import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const file = "04B-prototype-手势小狗探险MVP.html";
const mime = { ".css":"text/css", ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".task": "application/octet-stream" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = path.resolve(root, `.${pathname}`);
  if (!requested.startsWith(`${root}${path.sep}`) || !fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
    response.writeHead(404); response.end("not found"); return;
  }
  response.writeHead(200, { "Content-Type": mime[path.extname(requested)] || "application/octet-stream" });
  fs.createReadStream(requested).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(file)}`;
const browser = await chromium.launch({ headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try{const page=await browser.newPage();page.on('console',m=>console.log(m.type(),m.text()));page.on('pageerror',e=>console.log('ERROR',e.message));page.on('request',r=>{if(/wasm|worker|recognizer/.test(r.url()))console.log('GET',r.url());});await page.goto(url);const result=await page.evaluate(()=>new Promise(resolve=>{const events=[];const w=new Worker('./wire-loop-worker.mjs');const timer=setTimeout(()=>{w.terminate();resolve({error:'timeout',events});},30000);w.onerror=e=>{clearTimeout(timer);w.terminate();resolve({error:e.message,events});};w.onmessage=async({data})=>{events.push(data);if(data.type==='ready'){const c=new OffscreenCanvas(640,480);c.getContext('2d').fillRect(0,0,640,480);const bitmap=c.transferToImageBitmap();w.postMessage({type:'frame',timestampMs:performance.now(),bitmap},[bitmap]);}else if(data.type==='result'||data.type==='error'){clearTimeout(timer);w.terminate();resolve({data,events});}};w.postMessage({type:'load'});}));console.log(JSON.stringify(result));if(result.data?.type!=='result')process.exitCode=1;}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
