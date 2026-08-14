import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, 'assets/audio/audio-manifest.json'), 'utf8'));
const htmlPath = path.join(projectRoot, '04B-prototype-手势小狗探险MVP.html');
const html = await fs.readFile(htmlPath, 'utf8');
const sourceFiles = [
  html,
  await fs.readFile(path.join(projectRoot, 'scripts/generate-game-audio.mjs'), 'utf8'),
  JSON.stringify(manifest)
];
const failures = [];

if (manifest.assets.length !== 18) failures.push(`expected 18 assets, found ${manifest.assets.length}`);
if (manifest.assets.filter(asset => asset.kind === 'bgm').length !== 4) failures.push('expected 4 BGM assets');
if (manifest.assets.filter(asset => asset.kind === 'sfx').length !== 14) failures.push('expected 14 SFX assets');

for (const asset of manifest.assets) {
  const filePath = path.join(projectRoot, 'assets/audio', asset.file);
  const bytes = await fs.readFile(filePath).catch(() => null);
  if (!bytes) {
    failures.push(`missing ${asset.id}: ${asset.file}`);
    continue;
  }
  const isMp3 = bytes.subarray(0, 3).toString('ascii') === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (!isMp3 || bytes.length <= 4096) failures.push(`invalid MP3 ${asset.id}: ${bytes.length} bytes`);
  const browserPath = `assets/audio/${asset.file}`;
  if (!html.includes(browserPath)) failures.push(`HTML does not map ${asset.id}: ${browserPath}`);
  const idOccurrences = html.split(asset.id).length - 1;
  if (idOccurrences < 2) failures.push(`HTML maps ${asset.id} but does not use it in playback routing`);
}

if (!html.includes('id="drawer-audio"') || !html.includes('aria-pressed="true"')) failures.push('accessible parent audio toggle is missing');
if (!html.includes("document.addEventListener('pointerdown', unlockAudio")) failures.push('trusted-interaction audio unlock is missing');
if (!html.includes("document.addEventListener('visibilitychange'")) failures.push('background audio lifecycle is missing');
if (sourceFiles.some(source => /sk_[a-z0-9]{20,}/i.test(source))) failures.push('an API key leaked into a shipped source file');

const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
try {
  for (const script of inlineScripts) new Function(script);
} catch (error) {
  failures.push(`inline JavaScript syntax error: ${error.message}`);
}

if (failures.length) {
  console.error(failures.map(failure => `FAIL ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS game audio: 4 BGM, 14 SFX, 18 valid local MP3 mappings, audio lifecycle and source secrecy checks');
}
