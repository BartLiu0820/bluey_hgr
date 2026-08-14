import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(projectRoot, 'assets/audio/audio-manifest.json');
const outputRoot = path.dirname(manifestPath);
const force = process.argv.includes('--force');

function parseEnv(text) {
  return Object.fromEntries(text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const splitAt = line.indexOf('=');
      const key = line.slice(0, splitAt).trim();
      let value = line.slice(splitAt + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      return [key, value];
    }));
}

async function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const localEnv = parseEnv(await fs.readFile(path.join(projectRoot, '.env'), 'utf8'));
  if (!localEnv.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is missing from the environment and project .env');
  return localEnv.ELEVENLABS_API_KEY;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateAsset(asset, manifest, key) {
  const destination = path.join(outputRoot, asset.file);
  const temporary = `${destination}.part`;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (!force) {
    try {
      const stats = await fs.stat(destination);
      if (stats.size > 1024) {
        console.log(`skip ${asset.id}`);
        return;
      }
    } catch (_) {}
  }

  const endpoint = new URL('https://api.elevenlabs.io/v1/sound-generation');
  endpoint.searchParams.set('output_format', manifest.output_format);
  const payload = {
    text: asset.prompt,
    model_id: manifest.model_id,
    duration_seconds: asset.duration_seconds,
    prompt_influence: asset.prompt_influence,
    loop: asset.loop
  };

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length <= 1024) throw new Error(`${asset.id} returned an unexpectedly small audio file`);
      await fs.writeFile(temporary, bytes);
      await fs.rename(temporary, destination);
      console.log(`generated ${asset.id} (${bytes.length} bytes)`);
      return;
    }
    const errorText = (await response.text()).slice(0, 300);
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await sleep(attempt * 1800);
      continue;
    }
    throw new Error(`${asset.id} failed with HTTP ${response.status}: ${errorText}`);
  }
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const key = await apiKey();
for (const asset of manifest.assets) await generateAsset(asset, manifest, key);
console.log(`complete ${manifest.assets.length} assets`);
