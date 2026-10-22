import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..');
const entry='04B-prototype-手势小狗探险MVP.html';
const baselineRef=process.env.LOADING_BASELINE_REF||'1e53896';
const baseline=execFileSync('git',['show',`${baselineRef}:${entry}`],{cwd:root});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/baseline.html'){res.writeHead(200,{'Content-Type':mime['.html']});res.end(baseline);return;}
 if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 const f=path.resolve(root,'.'+pathname);
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Content-Length':fs.statSync(f).size,'Cache-Control':'public, max-age=3600'});fs.createReadStream(f).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out=path.join(root,'qa/loading-performance');fs.mkdirSync(out,{recursive:true});
let checks=0;const results=[];const pass=label=>{checks++;results.push(label);console.log('PASS',label);};
const ready=page=>page.waitForFunction(()=>window.GameAssets&&!window.GameAssets.busy&&document.querySelector('#asset-loading').hidden);
async function imagesComplete(page){return page.evaluate(()=>[...document.querySelectorAll('.screen.active img')].filter(e=>e.getClientRects().length&&!e.hidden).filter(e=>!e.complete||!e.naturalWidth).map(e=>e.outerHTML));}
function record(page){const paths=new Set();page.on('request',r=>{if(/\.(png|webp)(\?|$)/.test(r.url()))paths.add(decodeURIComponent(new URL(r.url()).pathname).slice(1));});return ()=>({count:paths.size,bytes:[...paths].reduce((n,p)=>n+(fs.existsSync(path.join(root,p))?fs.statSync(path.join(root,p)).size:0),0),paths:[...paths]});}
let before,after;
try{
 const old=await browser.newPage();const oldStats=record(old);await old.goto(base+'/baseline.html');await old.waitForTimeout(1500);before=oldStats();await old.close();
 const page=await browser.newPage({viewport:{width:1440,height:900}});const stats=record(page);const errors=[];const missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 let release;const hold=new Promise(r=>release=r);
 await page.route('**/assets/maps/menu/adventure-garden.webp',async route=>{await hold;await route.continue().catch(()=>{});});
 await page.goto(base+'/'+encodeURIComponent(entry),{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GameAssets?.busy);
 assert(await page.locator('#asset-loading').isVisible());assert(await page.locator('#app').evaluate(e=>e.inert));
 await page.screenshot({path:path.join(out,'loading-1440x900.png')});
 assert(!stats().paths.some(p=>/\/characters\/[^/]+\/(run|jump)\//.test(p)||p.includes('far-loop-pair')));pass('慢网首帧先显示准备层，底层不可操作，未抢载动作/完整地图');
 release();await ready(page);await page.waitForTimeout(200);assert.deepEqual(await imagesComplete(page),[]);
 after=stats();assert(after.bytes<before.bytes*.25);pass('首次就绪后可见图片完整，首屏图片下载量减少超过75%');
 await page.screenshot({path:path.join(out,'ready-1440x900.png')});
 await page.evaluate(()=>window.__mvpTest.startWithMode('keyboard_full'));
 await page.evaluate(()=>window.__mvpTest.chooseCharacter('lilac-girl',true));
 await page.waitForFunction(()=>window.__mvpTest.getState().screen==='LV-00');assert.deepEqual(await imagesComplete(page),[]);pass('按键入口→六角色→棉棉确认→大厅，角色素材准备后进入');
 let releaseLevel;const holdLevel=new Promise(r=>releaseLevel=r);
 await page.route('**/assets/maps/creek/far-loop-pair.webp',async route=>{await holdLevel;await route.continue().catch(()=>{});});
 await page.locator('#level-card-L1').click();await page.waitForFunction(()=>window.GameAssets.busy);
 assert.equal(await page.evaluate(()=>window.__mvpTest.getState().screen),'LV-00');
 assert.equal(await page.evaluate(()=>window.__mvpTest.getState().level),null);
 await page.keyboard.press('p');assert(!(await page.locator('#drawer-backdrop').getAttribute('class')||'').includes('open'));
 await page.locator('[data-loading-back]').click();releaseLevel();await ready(page);await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>window.__mvpTest.getState().screen),'LV-00');pass('关卡准备不启动游戏，返回取消及键盘隔离有效，旧请求不误跳');
 await page.unroute('**/assets/maps/creek/far-loop-pair.webp');
 for(const id of ['L1','L2','L3']){
  await page.evaluate(id=>window.__mvpTest.selectLevel(id),id);
  assert.equal(await page.evaluate(()=>window.__mvpTest.getState().screen),'LV-01');
  assert.deepEqual(await imagesComplete(page),[]);
  await page.locator('#launch-start').click();await page.evaluate(()=>window.__mvpTest.advance(3200));
  assert.equal(await page.evaluate(()=>window.__mvpTest.getState().screen),'LV-02');
  await page.evaluate(()=>window.__mvpTest.enterLevelMap());
 }
 pass('三种旧玩法加载后均可开始，未出现缺图');
 await page.evaluate(()=>window.__mvpTest.selectLevel('L4'));
 await page.waitForFunction(()=>window.__wireLoopTest?.snapshot().phase==='tutorial');
 await page.getByRole('button',{name:'先练一练',exact:true}).click();
 await page.waitForFunction(()=>window.__wireLoopTest.snapshot().phase==='playing');
 await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'wire-ready.png')});
 assert.deepEqual(await imagesComplete(page),[]);pass('火线冲击图片/纹理预载后教学与运行可达');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);pass('正常链路无脚本异常及404');await page.close();
 const fail=await browser.newPage({viewport:{width:919,height:843}});let broken=true;
 await fail.route('**/assets/ui/control-icons/back-control.webp',r=>broken?r.fulfill({status:503,body:'test unavailable'}):r.continue());
 await fail.goto(base+'/'+encodeURIComponent(entry),{waitUntil:'domcontentloaded'});
 await fail.waitForFunction(()=>document.querySelector('#asset-loading').dataset.state==='error');
 assert(await fail.locator('[data-loading-retry]').isVisible());assert(await fail.locator('#app').evaluate(e=>e.inert));
 assert(await fail.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
 await fail.screenshot({path:path.join(out,'retry-919x843.png')});
 broken=false;await fail.locator('[data-loading-retry]').click();await ready(fail);assert.deepEqual(await imagesComplete(fail),[]);pass('资源503时保持遮罩、窄屏可见重试，恢复后正常进入');
 await fail.close();
 const timeout=await browser.newPage();let releaseTimeout;const stalled=new Promise(r=>releaseTimeout=r);
 await timeout.route('**/assets/ui/control-icons/back-control.webp',async route=>{await stalled;await route.continue().catch(()=>{});});
 await timeout.goto(base+'/'+encodeURIComponent(entry),{waitUntil:'domcontentloaded'});
 await timeout.waitForFunction(()=>document.querySelector('#asset-loading').dataset.state==='error',{},{timeout:25000});
 releaseTimeout();await timeout.locator('[data-loading-retry]').click();await ready(timeout);pass('单张图片长时间无响应会超时进入重试，恢复后可进入');await timeout.close();
 const manifestPage=await browser.newPage();let failManifest=true;
 await manifestPage.route('**/runtime-images.js',route=>failManifest?route.fulfill({status:503,body:''}):route.continue());
 await manifestPage.goto(base+'/'+encodeURIComponent(entry),{waitUntil:'domcontentloaded'});
 await manifestPage.waitForFunction(()=>document.querySelector('#asset-loading').dataset.state==='error');
 assert(await manifestPage.locator('#app').evaluate(e=>e.inert));failManifest=false;
 await manifestPage.locator('[data-loading-retry]').click();await ready(manifestPage);pass('资源清单脚本失败时阻止缺图进入，重新加载可恢复');await manifestPage.close();
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({checks,results,before,after},null,2));
 console.log(JSON.stringify({checks,before:{count:before.count,bytes:before.bytes},after:{count:after.count,bytes:after.bytes},savedPercent:Math.round((1-after.bytes/before.bytes)*100)},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
