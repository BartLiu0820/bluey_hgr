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
  if(pathname === "/favicon.ico"){response.writeHead(204);response.end();return;}
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
const errors=[];const output=path.join(root,'output/playwright/wire-loop');fs.mkdirSync(output,{recursive:true});
let checks=0;const pass=label=>{checks++;console.log('PASS '+label);};
async function ready(page){await page.goto(url);await page.waitForFunction(()=>window.__mvpTest);await page.evaluate(()=>{window.__mvpTest.startWithMode('keyboard_full');window.__mvpTest.chooseCharacter('lilac-girl',true);});}
async function wire(page){await page.locator('#level-card-L4').click();await page.waitForFunction(()=>window.__wireLoopTest?.snapshot().phase==='tutorial');}
async function bounds(page){await page.screenshot({path:path.join(output,'latest-layout.png')});return page.evaluate(()=>{const visible=[...document.querySelectorAll('.screen.active button,.screen.active h1,.screen.active h2,.screen.active .level-card,.screen.active .wl-footer')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height);return {scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1,out:visible.filter(e=>{const r=e.getBoundingClientRect();return r.top< -1||r.left< -1||r.right>innerWidth+1||r.bottom>innerHeight+1;}).map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))};});}
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon.ico')&&m.text()!=='INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(r.status()+' '+r.url());});
 await ready(page);assert.equal(await page.locator('.level-card').count(),4);await wire(page);await page.getByRole('button',{name:'先练一练',exact:true}).click();
 await page.waitForFunction(()=>window.__wireLoopTest.snapshot().phase==='playing');
 const before=await page.evaluate(()=>window.__wireLoopTest.snapshot());
 await page.keyboard.down('Space');await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');
 const after=await page.evaluate(()=>window.__wireLoopTest.snapshot());assert(after.pose.x>before.pose.x);assert(after.elapsedMs>0);assert.equal(after.character,'lilac-girl');pass('真实按键握持移动，角色保持，离开起点计时');
 await page.waitForTimeout(60);const frozen=await page.evaluate(()=>window.__wireLoopTest.snapshot());await page.waitForTimeout(180);const released=await page.evaluate(()=>window.__wireLoopTest.snapshot());assert.deepEqual(released.pose,frozen.pose);assert(released.elapsedMs>frozen.elapsedMs);pass('松手冻结但不停表');
 await page.locator('[data-wl="pause"]').click();assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).state,'paused');await page.getByRole('button',{name:'继续练习',exact:true}).click();assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).eligible,false);pass('暂停后仅练习');
 await page.evaluate(async()=>{window.__wireLoopTest.start(1);const {buildTrack,trackPose}=await import('./wire-loop-geometry.mjs');const track=buildTrack((await(await fetch('./data/wire-loop/tracks.json')).json()).tracks[1]);window.__wireLoopTest.feed({held:true,timestampMs:performance.now()});for(let s=.025;s<track.length+.04;s+=.025)window.__wireLoopTest.feed({held:true,pose:trackPose(track,s),timestampMs:performance.now()});});
 assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).state,'success');assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).records.length,1);pass('合成连续输入通关接入实际结果页与用时榜');
 await page.screenshot({path:path.join(output,'success-1280x720.png')});
 await page.locator('[data-wl="exit"]').click();assert.equal(await page.locator('#wl01 canvas').count(),0);assert.equal(await page.evaluate(()=>Boolean(window.__wireLoopTest)),false);await page.locator('#level-card-L1').click();assert.equal((await page.evaluate(()=>window.__mvpTest.getState())).screen,'LV-01');pass('退出释放舞台与监听器，旧玩法仍可进入');
 await page.evaluate(()=>localStorage.removeItem('gesture-pup-wire-times-v1'));
 for(const [width,height] of [[1440,900],[1280,720],[1219,681],[1024,700],[919,843]]){
  await page.setViewportSize({width,height});await ready(page);assert.deepEqual(await bounds(page),{scroll:false,out:[]});await page.screenshot({path:path.join(output,`hub-${width}x${height}.png`)});await wire(page);assert.deepEqual(await bounds(page),{scroll:false,out:[]});await page.getByRole('button',{name:'先练一练',exact:true}).click();await page.evaluate(()=>window.__wireLoopTest.start(1));await page.waitForTimeout(120);assert.deepEqual(await bounds(page),{scroll:false,out:[]});
  const projected=await page.evaluate(async()=>{const {buildTrack}=await import('./wire-loop-geometry.mjs');const t=buildTrack((await(await fetch('./data/wire-loop/tracks.json')).json()).tracks[1]);const r=document.querySelector('.wl-stage').getBoundingClientRect();return t.points.map(p=>window.__wireLoopTest.project(p)).every(p=>p.x>35&&p.y>65&&p.x<r.width-35&&p.y<r.height-50);});assert(projected);await page.screenshot({path:path.join(output,`stage-${width}x${height}.png`)});await page.locator('[data-wl="pause"]').click();assert.deepEqual(await bounds(page),{scroll:false,out:[]});pass(`${width}×${height} 大厅/教学/舞台/暂停单屏，完整轨道安全区`);
 }
 await ready(page);const workerResult=await page.evaluate(()=>new Promise(resolve=>{const w=new Worker('./wire-loop-worker.mjs');const timer=setTimeout(()=>{w.terminate();resolve({error:'timeout'});},30000);w.onerror=e=>{clearTimeout(timer);w.terminate();resolve({error:e.message});};w.onmessage=async({data})=>{if(data.type==='loading')return;if(data.type==='ready'){const c=new OffscreenCanvas(640,480);c.getContext('2d').fillRect(0,0,640,480);const bitmap=c.transferToImageBitmap();w.postMessage({type:'frame',timestampMs:performance.now(),bitmap},[bitmap]);}else{clearTimeout(timer);w.terminate();resolve(data);}};w.postMessage({type:'load'});}));assert.equal(workerResult.type,'result',JSON.stringify(workerResult));assert.equal(workerResult.handPresent,false);pass('本地Worker模型实际加载及空白合成帧推理（非实摄）');
 await ready(page);
 await page.evaluate(async()=>{window.__mvpTest.showScreen('WL-01');const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;canvas.getContext('2d').fillRect(0,0,640,480);const video=document.createElement('video');video.muted=true;video.srcObject=canvas.captureStream(30);await video.play();window.__wireSyntheticVideo=video;window.__wireSyntheticSwitches=0;const {mountWireLoop}=await import('./wire-loop-ui.mjs');window.__wireSyntheticController=await mountWireLoop(document.querySelector('#wl01'),{mode:'camera',character:'bluey',video,onKeyboard:()=>{window.__wireSyntheticSwitches++;video.srcObject.getTracks().forEach(t=>t.stop());},onExit:()=>window.__mvpTest.showScreen('LV-00')});});
 await page.getByRole('button',{name:'先练一练',exact:true}).click();await page.waitForTimeout(350);assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'calibrating');await page.locator('[data-wl="pause"]').click();await page.getByRole('button',{name:'改用按键',exact:true}).click();assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).mode,'keyboard');assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).eligible,false);assert.equal(await page.evaluate(()=>window.__wireSyntheticSwitches),1);assert(await page.evaluate(()=>window.__wireSyntheticVideo.srcObject.getTracks().every(t=>t.readyState==='ended')));await page.locator('[data-wl="exit"]').click();pass('合成视频Worker连续采样/校准等待/切键盘取消资格与释放视频');
 // Deterministic camera results exercise the real estimator/input/UI chain.
 // Stub only the worker so blank inference cannot race the synthetic hand frames.
 await page.route('**/wire-loop-worker.mjs',route=>route.fulfill({contentType:'text/javascript',body:"onmessage=({data})=>{if(data.type==='load')postMessage({type:'ready'});if(data.bitmap)data.bitmap.close();};"}));
 await ready(page);
 await page.evaluate(async()=>{
  window.__mvpTest.showScreen('WL-01');
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;canvas.getContext('2d').fillRect(0,0,640,480);
  const video=document.createElement('video');video.muted=true;video.srcObject=canvas.captureStream(30);await video.play();window.__wireRecoveryVideo=video;
  const {mountWireLoop}=await import('./wire-loop-ui.mjs');
  await mountWireLoop(document.querySelector('#wl01'),{mode:'camera',video,onExit:()=>window.__mvpTest.showScreen('LV-00')});
  window.__sendWireHands=async(label,duration)=>{
   const end=performance.now()+duration;
   while(performance.now()<end){
    const landmarks=Array.from({length:21},()=>({x:.5,y:.4}));landmarks[0]={x:.5,y:.55};
    window.__wireLoopTest.feedCamera({timestampMs:performance.now(),handPresent:true,handedness:'Left',label,landmarks});
    await new Promise(r=>setTimeout(r,40));
   }
  };
 });
 await page.getByRole('button',{name:'先练一练',exact:true}).click();
 await page.evaluate(()=>window.__sendWireHands('Closed_Fist',1500));
 assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'playing');
 await page.evaluate(()=>window.__sendWireHands('None',1500));
 assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'playing');
 assert.equal(await page.locator('.wl-overlay').isVisible(),false);
 assert.match(await page.locator('.wl-footer').innerText(),/轻轻握拳/);pass('可见手分类未知1.5秒只提示握拳，不弹暂停');
 const cameraPose=(await page.evaluate(()=>window.__wireLoopTest.snapshot())).pose;
 await page.waitForTimeout(450);assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'playing');
 await page.evaluate(()=>window.__sendWireHands('Closed_Fist',400));
 assert.deepEqual((await page.evaluate(()=>window.__wireLoopTest.snapshot())).pose,cameraPose);pass('短暂无帧冻结，恢复握持保持原位');
 await page.waitForFunction(()=>window.__wireLoopTest.snapshot().phase==='paused');
 assert.equal(await page.locator('.wl-panel h2').innerText(),'找不到小手了');
 await page.getByRole('button',{name:'继续练习',exact:true}).click();
 await page.waitForTimeout(1500);
 assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'recovering');
 assert.equal(await page.locator('.wl-panel h2').innerText(),'握住再继续');
 await page.evaluate(()=>window.__sendWireHands('Closed_Fist',500));
 assert.equal((await page.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'playing');
 assert.equal(await page.locator('.wl-overlay').isVisible(),false);
 assert.deepEqual((await page.evaluate(()=>window.__wireLoopTest.snapshot())).pose,cameraPose);pass('持续失联说明原因，继续等待稳握后恢复，不重复弹窗');
 await page.evaluate(()=>window.__wireRecoveryVideo.srcObject.getTracks().forEach(t=>t.stop()));
 await page.locator('[data-wl="exit"]').click();await page.unroute('**/wire-loop-worker.mjs');
 await ready(page);await page.evaluate(()=>{localStorage.setItem('gesture-pup-wire-times-v1','[]');});await page.locator('#lv00 [data-open-parent]').click();page.once('dialog',d=>d.accept());await page.locator('#drawer-clear-scores').click();assert.equal(await page.evaluate(()=>localStorage.getItem('gesture-pup-wire-times-v1')),null);assert.deepEqual((await page.evaluate(()=>window.__mvpTest.getState())).bestScoreByMode,{});await page.locator('#drawer-close').click();pass('家长清空成绩同时覆盖新旧成绩');
 const noGL=await browser.newPage();await ready(noGL);await noGL.evaluate(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:getContext.call(this,type,...args);};});await wire(noGL);await noGL.getByRole('button',{name:'先练一练',exact:true}).click();assert.equal((await noGL.evaluate(()=>window.__wireLoopTest.snapshot())).phase,'unavailable');await noGL.locator('[data-wl="exit"]').click();await noGL.locator('#level-card-L2').click();assert.equal((await noGL.evaluate(()=>window.__mvpTest.getState())).screen,'LV-01');await noGL.close();pass('WebGL不可用时明确降级，仍可返回旧玩法');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({checks,errors,worker:'blank synthetic frame passed',realCamera:'not tested'},null,2));console.log(`Wire browser: ${checks}/${checks} PASS`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
