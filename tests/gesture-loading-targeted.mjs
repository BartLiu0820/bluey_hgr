import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/${encodeURIComponent('04B-prototype-手势小狗探险MVP.html')}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const out=path.join(root,'qa/gesture-loading');fs.mkdirSync(out,{recursive:true});
const results=[];const pass=label=>{results.push(label);console.log('PASS',label);};
const snapshot=page=>page.evaluate(()=>window.__mvpTest.getState());
const mockRuntime=`
export const RECOGNIZER_INFO={test:true};
export class LocalGestureRecognizerRuntime {
 async load(){window.mockLoads=(window.mockLoads||0)+1; await new Promise((resolve,reject)=>{window.resolveModel=resolve;window.rejectModel=()=>reject(new Error('test load failure'));});}
 start(video,onFrame){this.onFrame=onFrame;window.sendFrame=result=>this.onFrame?.(result);window.mockStarts=(window.mockStarts||0)+1;}
 stop(){this.onFrame=null;}
 close(){this.stop();window.mockClosed=(window.mockClosed||0)+1;}
}`;
async function setup(mock=true){
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.testErrors=errors;
 if(mock)await page.route('**/gesture-recognizer-runtime.mjs',r=>r.fulfill({contentType:'text/javascript',body:mockRuntime}));
 await page.goto(url);await page.evaluate(()=>window.gameReady);
 if(mock)await page.clock.install();
 await page.locator('#privacy-check').check();await page.locator('#camera-choice').click();
 return page;
}
async function enable(page){await page.locator('#enable-camera').click();await page.waitForFunction(()=>window.__mvpTest.getState().modelStatus==='loading');}
async function noScrollAndOverlap(page){
 const layout=await page.evaluate(()=>{
  const nodes=['#gi02-title','#setup-loading','#enable-camera','#start-practice','#gi02 [data-go-keyboard]','#gi02 [data-back-settings]'].map(s=>document.querySelector(s)).filter(e=>e.getClientRects().length);
  const rects=nodes.map(e=>({id:e.id||e.textContent.trim(),...e.getBoundingClientRect().toJSON()}));
  return {scroll:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,out:rects.filter(r=>r.top<0||r.left<0||r.bottom>innerHeight||r.right>innerWidth),overlaps:rects.flatMap((r,i)=>rects.slice(i+1).filter(t=>r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top).map(t=>[r.id,t.id]))};
 });assert.deepEqual(layout,{scroll:false,out:[],overlaps:[]});
}
try{
 const page=await setup();await enable(page);await page.waitForFunction(()=>window.resolveModel);
 assert(await page.locator('#setup-loading').isVisible());assert(await page.locator('#start-practice').isDisabled());assert.equal(await page.locator('#gi02-title').textContent(),'正在准备动作助手');
 for(const [width,height] of [[1440,900],[919,843],[1024,700]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);await noScrollAndOverlap(page);await page.screenshot({path:path.join(out,`loading-${width}x${height}.png`)});
 }
 pass('模型等待提示可见，继续禁用，三个视口无滚动/按钮遮挡');
 await page.clock.fastForward(8100);assert.match(await page.locator('#setup-loading-copy').textContent(),/准备有点久/);pass('8秒慢加载提示可继续等待或改用按键');
 await page.evaluate(()=>window.resolveModel());await page.waitForFunction(()=>window.mockStarts===1);
 assert(await page.locator('#setup-loading').isVisible());assert(await page.locator('#start-practice').isDisabled());
 await page.evaluate(()=>window.sendFrame({handPresent:false,landmarks:[]}));assert(!(await page.locator('#setup-loading').isVisible()));assert.equal(await page.locator('#gi02-title').textContent(),'举起一只手');assert(await page.locator('#start-practice').isDisabled());
 await page.evaluate(()=>{const frame={handPresent:true,landmarks:Array.from({length:21},(_,i)=>({x:.3+(i%5)*.06,y:.3+Math.floor(i/5)*.06}))};window.sendFrame(frame);window.sendFrame(frame);});assert(await page.locator('#start-practice').isDisabled());
 await page.evaluate(()=>window.sendFrame({handPresent:true,landmarks:Array.from({length:21},()=>({x:.5,y:.5}))}));assert(!(await page.locator('#start-practice').isDisabled()));pass('首帧推理返回才结束loading，无手进入找手，三帧见手才允许继续');
 assert.deepEqual(page.testErrors,[]);await page.close();
 const cancel=await setup();await enable(cancel);await cancel.waitForFunction(()=>window.resolveModel);await cancel.locator('#gi02 [data-go-keyboard]').first().click();await cancel.evaluate(()=>window.resolveModel());await cancel.waitForTimeout(150);
 assert.equal((await snapshot(cancel)).screen,'GI-05');assert.equal((await snapshot(cancel)).cameraStreamActive,false);assert.equal((await snapshot(cancel)).recognizerLoopActive,false);assert.equal(await cancel.evaluate(()=>window.mockStarts||0),0);pass('切换按键后迟到模型不启动识别，不跳转');await cancel.close();
 const failed=await setup();await enable(failed);await failed.waitForFunction(()=>window.rejectModel);await failed.evaluate(()=>window.rejectModel());await failed.waitForFunction(()=>document.querySelector('#camera-error').classList.contains('show'));
 assert(!(await failed.locator('#setup-loading').isVisible()));assert.equal((await snapshot(failed)).cameraStreamActive,false);assert.equal(await failed.locator('#enable-camera').innerText(),'再试一次');
 await enable(failed);await failed.waitForFunction(()=>window.mockLoads===2);await failed.evaluate(()=>window.resolveModel());await failed.waitForFunction(()=>window.mockStarts===1);await failed.evaluate(()=>window.sendFrame({handPresent:false,landmarks:[]}));assert(!(await failed.locator('#setup-loading').isVisible()));pass('模型失败停止摄像头并显示重试，重试恢复到找手');await failed.close();
 const timeout=await setup();await enable(timeout);await timeout.waitForFunction(()=>window.resolveModel);await timeout.evaluate(()=>window.oldResolveModel=window.resolveModel);await timeout.clock.fastForward(61000);
 assert.match(await timeout.locator('#camera-error-copy').textContent(),/准备时间有点长/);assert.equal((await snapshot(timeout)).cameraStreamActive,false);
 await enable(timeout);await timeout.clock.runFor(50);await timeout.waitForFunction(()=>window.mockLoads===2);await timeout.evaluate(()=>window.oldResolveModel());await timeout.waitForFunction(()=>window.mockClosed===1);assert.equal((await snapshot(timeout)).modelStatus,'loading');await timeout.evaluate(()=>window.resolveModel());await timeout.waitForFunction(()=>window.mockStarts===1);
 await timeout.clock.fastForward(61000);assert.match(await timeout.locator('#camera-error-copy').textContent(),/准备时间有点长/);assert.equal((await snapshot(timeout)).recognizerLoopActive,false);pass('60秒模型及首帧超时均可恢复，旧模型不覆盖重试');await timeout.close();
 const permission=await setup();await permission.evaluate(()=>{
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.allowCamera=async()=>{const stream=await original({video:true});window.lateStream=stream;resolve(stream);});
 });await permission.locator('#enable-camera').click();assert.match(await permission.locator('#setup-loading-copy').textContent(),/允许浏览器/);await permission.locator('#gi02 [data-back-settings]').click();await permission.evaluate(()=>window.allowCamera());await permission.waitForFunction(()=>window.lateStream.getTracks().every(t=>t.readyState==='ended'));assert.equal((await snapshot(permission)).screen,'GI-01');pass('授权等待时返回，迟到的摄像头流立即关闭');await permission.close();
 const real=await setup(false);let release;const held=new Promise(r=>release=r);
 await real.route('**/gesture_recognizer.task',async route=>{await held;await route.continue().catch(()=>{});});await enable(real);assert(await real.locator('#setup-loading').isVisible());release();
 await real.waitForFunction(()=>window.__mvpTest.getState().modelStatus==='ready'&&document.querySelector('#setup-loading').hidden,{},{timeout:60000});
 assert.equal((await snapshot(real)).recognizerLoopActive,true);assert.deepEqual(real.testErrors,[]);await real.locator('#gi02 [data-back-settings]').click();assert.equal((await snapshot(real)).cameraStreamActive,false);pass('真实本地MediaPipe模型+模拟摄像头：等待→首帧推理→找手→返回正常');await real.close();
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({checks:results.length,results},null,2));
 console.log(`${results.length}/${results.length} passed`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
