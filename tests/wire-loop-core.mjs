import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildTrack,trackPose,clearance,sweepContact,threadedProgress} from '../wire-loop-geometry.mjs';
import {WireLoopRuntime,TRACKING_PAUSE_MS} from '../wire-loop-runtime.mjs';
import {WireRecords,WIRE_RECORD_KEY} from '../wire-loop-records.mjs';
import {WireInput,OneEuro,unwrapAngle,estimateGripFrame} from '../wire-loop-input.mjs';
const tracks=JSON.parse(fs.readFileSync(new URL('../data/wire-loop/tracks.json',import.meta.url))).tracks.map(buildTrack);
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
test('环孔穿线安全，实体边缘碰撞，附近非当前轨段也参与',()=>{const t=tracks[0],p=trackPose(t,2);assert(clearance(t,p).lower>0);assert(clearance(t,{...p,y:.27}).lower<0);assert(sweepContact(t,p,{...p,y:1}));assert(sweepContact(t,{...p,y:-1},{...p,y:1}));});
test('连续转角穿越接触，终态无碰撞也不能穿透',()=>{const t=tracks[0],p=trackPose(t,2);assert(sweepContact(t,p,{...p,angle:Math.PI}));assert(clearance(t,{...p,angle:Math.PI}).lower>0);});
for(const t of tracks)test(`${t.id} 全路线确定性可达及连续检测`,()=>{let now=0;const r=new WireLoopRuntime(t,{clock:()=>now});r.step({held:true,timestampMs:now});for(let s=.025;s<t.length+.03;s+=.025){now+=30;r.step({pose:trackPose(t,s),held:true,timestampMs:now},now);if(r.terminal)break;}assert.equal(r.state,'success');assert.equal(r.eligible,!t.tutorial);});
test('越过路径不能直接在终点取得进度',()=>{const t=tracks[1],p=trackPose(t,t.length);assert.equal(threadedProgress(t,p,0),0);});
test('松手不停表，重握不瞬移，超时按真实时钟',()=>{let now=0;const r=new WireLoopRuntime(tracks[1],{clock:()=>now});r.step({held:true,timestampMs:now});now=100;r.step({pose:trackPose(tracks[1],.04),held:true,timestampMs:now});now=500;r.step({held:false,timestampMs:now});const p={...r.pose};now=1000;r.step({held:true,pose:{x:100,y:100,angle:10},timestampMs:now});assert.deepEqual(r.pose,p);assert.equal(r.elapsedMs,1000);now=60001;r.tick();assert.equal(r.state,'failed_timeout');assert.equal(r.elapsedMs,60000);});
test('短暂失联冻结且计时，持续1.2秒才暂停；暂停永久取消资格',()=>{let now=0;const r=new WireLoopRuntime(tracks[1],{clock:()=>now});r.step({held:true,timestampMs:now});now=100;r.step({pose:trackPose(tracks[1],.04),held:true,timestampMs:now});const frozen={...r.pose};now=360;r.step({valid:false,timestampMs:100});assert.equal(r.state,'tracking_hold');assert.equal(r.eligible,true);assert.deepEqual(r.pose,frozen);assert.equal(r.elapsedMs,360);now=100+TRACKING_PAUSE_MS-1;r.step({valid:false,timestampMs:100});assert.notEqual(r.state,'paused');now++;r.step({valid:false,timestampMs:100});assert.equal(r.state,'paused');assert.equal(r.eligible,false);now=3000;r.resume();r.tick();assert.equal(r.elapsedMs,1300);});
test('慢帧越过超时，仍保存准确超时值',()=>{let now=0;const r=new WireLoopRuntime(tracks[1],{clock:()=>now});r.step({held:true,timestampMs:0});now=100;r.step({pose:trackPose(tracks[1],.03),held:true,timestampMs:now});now=75000;r.step({held:false,timestampMs:now});assert.equal(r.state,'failed_timeout');assert.equal(r.elapsedMs,60000);});
test('用时榜分组/升序/幂等/拒绝不合格/损坏存储/清空',()=>{const memory=new Map(),store={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};const db=new WireRecords(store);const base={...new WireLoopRuntime(tracks[1]).group,success:true,eligible:true};for(let i=10;i>0;i--)db.add({...base,runId:String(i),elapsedMs:i*1000});assert.deepEqual(db.top(base).map(r=>r.elapsedMs),[1000,2000,3000,4000,5000]);assert(!db.add({...base,runId:'1',elapsedMs:3}));assert(!db.add({...base,runId:'bad',elapsedMs:NaN}));assert(!db.add({...base,runId:'practice',elapsedMs:2,eligible:false}));db.add({...base,controlMode:'camera',runId:'c',elapsedMs:33});assert.equal(db.top(base).length,5);assert.equal(new WireRecords(store).top(base).length,5);db.clear();assert(!memory.has(WIRE_RECORD_KEY));assert.doesNotThrow(()=>new WireRecords({getItem:()=>'{bad'}));assert.doesNotThrow(()=>new WireRecords({getItem:()=>{throw Error();}}).add({...base,runId:'x',elapsedMs:5}));});
test('角度unwrap、微移滤波，不平均成零',()=>{const a=unwrapAngle(179*Math.PI/180,-179*Math.PI/180);assert(Math.abs(a-181*Math.PI/180)<1e-6);const f=new OneEuro();f.filter(0,0);assert(f.filter(.0001,40)>0);});
test('掌根位置镜像与角度等比例，裁边/缺点失效',()=>{const landmarks=Array.from({length:21},()=>({x:.5,y:.4}));landmarks[0]={x:.5,y:.55};const result={handPresent:true,label:'Closed_Fist',landmarks,timestampMs:100};const f=estimateGripFrame(result,{now:100});assert(f.positionValid);assert.equal(f.position2D.x,.5);assert(Math.abs(f.angleRad-Math.PI/2)<.001);assert(!estimateGripFrame({...result,landmarks:[]},{now:100}).positionValid);landmarks[5].x=.99;assert(!estimateGripFrame(result,{now:100}).positionValid);});
test('稳握校准、松手与重握保持姿态连续，未知冻结',()=>{const input=new WireInput();let pose={x:1,y:2,angle:.2};const base={handedness:'Left',scale:.1,positionValid:true,rotationValid:true,gripState:'held',position2D:{x:.5,y:.5},angleRad:1};let sample;for(let t=0;t<1600;t+=40)sample=input.consume({...base,timestampMs:t},pose,(x,y)=>({x:x*10,y:y*10}));assert(input.calibrated);assert(sample.held);assert.deepEqual(sample.pose,pose);for(let t=1600;t<1840;t+=40)sample=input.consume({...base,gripState:'open',timestampMs:t},pose,(x,y)=>({x,y}));assert(!sample.held);for(let t=1840;t<2080;t+=40)sample=input.consume({...base,position2D:{x:.8,y:.7},angleRad:2,timestampMs:t},pose,(x,y)=>({x,y}));assert.deepEqual(sample.pose,pose);sample=input.consume({...base,position2D:{x:.8,y:.7},angleRad:2,gripState:'unknown',timestampMs:2120},pose,(x,y)=>({x,y}));assert(sample.valid);assert(!sample.held);assert(sample.gripUnknown);});
test('终点恰好遇到超时，超时优先；最后一段碰线不能成功',()=>{const t=tracks[0];const make=(limit=60000)=>{const r=new WireLoopRuntime({...t,timeLimitMs:limit},{clock:()=>100});r.pose=trackPose(t,t.length-.12);r.progress=t.length-.12;r.startedAt=0;r.lastStepAt=0;r.lastHeld=true;return r;};const probe=make();probe.step({pose:trackPose(t,t.length),held:true,timestampMs:100},100);assert.equal(probe.state,'success');const tie=make(probe.elapsedMs);tie.step({pose:trackPose(t,t.length),held:true,timestampMs:100},100);assert.equal(tie.state,'failed_timeout');const hit=make();const end=trackPose(t,t.length);hit.step({pose:{...end,y:.4},held:true,timestampMs:100},100);assert.equal(hit.state,'failed_contact');});
test('准备区转向不计时，微小累计位移离开起点即开始',()=>{let now=0;const t=tracks[0],r=new WireLoopRuntime(t,{clock:()=>now});r.step({held:true,timestampMs:0});now=10;r.step({held:true,pose:{...r.pose,angle:.1},timestampMs:now});assert.equal(r.startedAt,null);for(let i=0;i<15;i++){now+=10;r.step({held:true,pose:{...r.pose,x:r.pose.x+.001},timestampMs:now});}assert.notEqual(r.startedAt,null);});
test('相对转腕放大1.6倍、快速响应、跨正负180度连续且重握不跳变',()=>{
  const input=new WireInput();input.calibrated=true;let pose={x:0,y:0,angle:.2};
  const base={handedness:'Left',scale:.1,positionValid:true,rotationValid:true,gripState:'held',position2D:{x:.5,y:.5},angleRad:179*Math.PI/180};
  const consume=(time,patch={})=>input.consume({...base,...patch,timestampMs:time},pose,(x,y)=>({x,y}));
  for(let t=0;t<=200;t+=40)consume(t);
  const target=base.angleRad+.3-Math.PI*2;
  let sample=consume(240,{angleRad:target});assert(sample.pose.angle>.2+.15);assert(sample.pose.angle<.68);
  for(let t=280;t<=1200;t+=40)sample=consume(t,{angleRad:target});
  assert(Math.abs(sample.pose.angle-(.2+.3*1.6))<.001);pose=sample.pose;
  const unknown=consume(1240,{gripState:'unknown'});assert.deepEqual(unknown.pose,pose);assert(!unknown.held);
  for(let t=1280;t<=1520;t+=40)sample=consume(t,{angleRad:-1});assert.deepEqual(sample.pose,pose);
});
test('可见手势未知超过暂停阈值不取消资格；真正丢手仍暂停',()=>{
  const input=new WireInput();input.calibrated=true;let now=0;
  const runtime=new WireLoopRuntime(tracks[1],{clock:()=>now});
  const base={handedness:'Left',scale:.1,positionValid:true,rotationValid:true,gripState:'unknown',position2D:{x:.5,y:.5},angleRad:1};
  for(now=0;now<=2400;now+=40){const sample=input.consume({...base,timestampMs:now},runtime.pose,(x,y)=>({x,y}));runtime.step({...sample,timestampMs:now});}
  assert.equal(runtime.state,'ready');assert(runtime.eligible);
  for(;now<=3640;now+=40){const sample=input.consume({positionValid:false,rotationValid:false,timestampMs:now},runtime.pose,(x,y)=>({x,y}));runtime.step({...sample,timestampMs:now});}
  assert.equal(runtime.state,'paused');assert(!runtime.eligible);
});
test('短暂丢手后重新锚定，恢复不瞬移也不暂停',()=>{
  const input=new WireInput();input.calibrated=true;let now=0;
  const runtime=new WireLoopRuntime(tracks[1],{clock:()=>now});
  const base={handedness:'Left',scale:.1,positionValid:true,rotationValid:true,gripState:'held',position2D:{x:.5,y:.5},angleRad:1};
  const feed=frame=>runtime.step({...input.consume({...frame,timestampMs:now},runtime.pose,(x,y)=>({x,y})),timestampMs:now});
  for(;now<=200;now+=40)feed(base);
  const frozen={...runtime.pose};
  for(;now<640;now+=40)feed({positionValid:false,rotationValid:false});
  for(;now<=1000;now+=40)feed({...base,position2D:{x:.7,y:.6},angleRad:2});
  assert.deepEqual(runtime.pose,frozen);assert(runtime.eligible);assert.notEqual(runtime.state,'paused');
});
console.log(`Wire core: ${passed}/${passed} PASS`);
