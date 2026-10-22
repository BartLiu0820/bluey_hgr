import {buildTrack} from './wire-loop-geometry.mjs';
import {WireLoopRuntime} from './wire-loop-runtime.mjs';
import {WireInput,estimateGripFrame} from './wire-loop-input.mjs';
import {WireRecords} from './wire-loop-records.mjs';
import {WireRenderer} from './wire-loop-renderer.mjs';
import {WireCamera} from './wire-loop-camera.mjs';

export async function mountWireLoop(root,{mode='keyboard',character='bluey',video,onExit,playSfx=()=>{},onKeyboard=()=>{},onClearScores=()=>{},onControllerReady=()=>{},onPauseAudio=()=>{},onResumeAudio=()=>{},onToggleAudio=()=>{}}={}){
  let disposed=false,renderer=null,runtime=null,camera=null,raf=0,lastAt=performance.now(),lastFrameAt=0,phase='loading',activeTrack=0,fxAt=0,fxKind=null,fxPoint=null,cameraFailed=false,inputHint='';
  const input=new WireInput(),keys=new Set();
  let storage;try{storage=localStorage;}catch{}const records=new WireRecords(storage);
  root.innerHTML=`<div class="wl-shell"><header class="wl-header"><button class="wl-button" data-wl="exit" aria-label="返回玩法大厅">‹ 返回</button><h1>火线冲击</h1><button class="wl-button" data-wl="pause" aria-label="暂停游戏">暂停</button></header><div class="wl-playfield"><div class="wl-stage"></div><video class="wl-camera" autoplay muted playsinline hidden aria-label="本机小手预览"></video><div class="wl-clock" hidden><strong>60.0</strong><span>秒</span><small></small></div><div class="wl-partner"><img alt="伙伴" src="assets/characters/${character}/idle/idle-1.png"></div><img class="wl-fx" alt="" hidden><div class="wl-overlay"><div class="wl-panel"><h2 tabindex="-1"></h2><p class="wl-copy"></p><div class="wl-help"><figure><img src="assets/wire-loop/fist-move/fist-move.png" alt="握拳移动"><figcaption>握住 · 移动</figcaption></figure><figure><img src="assets/wire-loop/wrist-tilt/wrist-tilt.png" alt="轻轻转腕"><figcaption>轻轻转向</figcaption></figure><figure><img src="assets/wire-loop/release-hand/release-hand.png" alt="松手停住"><figcaption>松手 · 停住</figcaption></figure></div><ol class="wl-records"></ol><div class="wl-actions"></div></div></div></div><footer class="wl-footer" aria-live="polite"></footer></div>`;
  const $=s=>root.querySelector(s),stage=$('.wl-stage'),overlay=$('.wl-overlay'),actions=$('.wl-actions'),help=$('.wl-help'),ranking=$('.wl-records'),footer=$('.wl-footer'),partner=$('.wl-partner img');
  const preview=$('.wl-camera');if(mode==='camera'&&video?.srcObject){preview.hidden=false;preview.srcObject=video.srcObject;preview.play().catch(()=>{});}
  const abort=new AbortController();
  function panel(title,copy,buttons,showHelp=false){overlay.hidden=false;$('.wl-panel h2').textContent=title;$('.wl-copy').textContent=copy;help.hidden=!showHelp;ranking.hidden=true;actions.replaceChildren();for(const [label,action] of buttons){const button=document.createElement('button');button.className='wl-button';button.textContent=label;button.onclick=action;actions.append(button);}$('.wl-panel h2').focus({preventScroll:true});}
  function hidePanel(){overlay.hidden=true;root.tabIndex=-1;root.focus({preventScroll:true});}
  function instruction(){return mode==='keyboard'?'按住空格 + 方向键移动 · A / D 转向 · 松开空格停住':'握拳移动 · 轻轻转腕 · 张手停住';}
  function explain(){phase='tutorial';panel('让圆环穿过去','别碰到银蓝色的线。松手会停住，时间还会走。',[['先练一练',()=>start(0)]],true);footer.textContent=instruction();}
  function failResource(message){if(disposed)return;cameraFailed=true;runtime?.pause('resource');phase='unavailable';camera?.dispose();panel('暂时还没准备好',message,[[mode==='camera'?'用按键玩':'返回大厅',mode==='camera'?switchKeyboard:exit],['返回大厅',exit]]);}
  function switchKeyboard(){camera?.dispose();camera=null;preview.srcObject=null;preview.hidden=true;onKeyboard();mode='keyboard';cameraFailed=false;input.reset();inputHint='';if(runtime&&renderer&&!runtime.terminal){runtime.eligible=false;runtime.controlMode='keyboard';runtime.resume();phase='playing';keys.clear();hidePanel();onResumeAudio();}else start(activeTrack);}
  function onEvent(event){
    if(event.type==='paused'){
      onPauseAudio();phase='paused';keys.clear();input.detach();
      const tracking=event.reason==='tracking';
      const reason=tracking?'小手离开画面，或暂时看不清了。':event.reason==='background'?'刚才离开了游戏画面。':'游戏已经停住了。';
      panel(tracking?'找不到小手了':'已暂停',reason+'这一局接着练习，不记录最好用时。',[
        ['继续练习',()=>{
          input.detach();
          if(mode==='camera'){
            phase='recovering';
            panel('握住再继续','把整只小手放回画面，握稳后自动继续。',[['改用按键',switchKeyboard],['返回大厅',exit]]);
            footer.textContent='正在等小手，时间已暂停';
          }else{runtime.resume();onResumeAudio();phase='playing';hidePanel();}
        }],['重新开始',()=>start(activeTrack)],...(mode==='camera'?[['改用按键',switchKeyboard]]:[]),['声音开关',onToggleAudio],['返回大厅',exit]
      ]);
      footer.textContent=tracking?'把小手放回画面，再握住':'已安全暂停';
    }
    if(['success','failed_contact','failed_timeout'].includes(event.type)){
      phase='result';keys.clear();const success=event.type==='success';
      fxKind=success?'finish':event.type==='failed_contact'?'contact':null;fxAt=performance.now();fxPoint=event.contact?.point||runtime.pose;
      playSfx(success?'sfx_round_complete':'sfx_collision_soft',.55);
      partner.src=`assets/characters/${character}/${success?'celebrate':'bump'}/${success?'celebrate':'bump'}-2.png`;
      if(success&&!runtime.track.tutorial)records.add(runtime.record());
      let title=success?'穿过去啦！':event.type==='failed_contact'?'碰到线啦':'时间到啦';
      let copy=runtime.track.tutorial?(success?'试手完成，准备挑战弯弯的火线。':'再来一次，慢慢移动就好。'):success?`${(runtime.elapsedMs/1000).toFixed(1)} 秒${runtime.eligible?'':' · 练习完成，不入榜'}`:'没关系，再试一次。';
      const buttons=runtime.track.tutorial&&success?[['开始挑战',()=>start(1)],['再练一次',()=>start(0)],['返回大厅',exit]]:[['再试一次',()=>start(activeTrack)],['返回大厅',exit]];
      panel(title,copy,buttons);
      if(!runtime.track.tutorial){const top=records.top(runtime.group);ranking.replaceChildren();ranking.hidden=false;top.forEach((r,i)=>{const li=document.createElement('li');li.textContent=`${i===0?'最好':'第 '+(i+1)+' 次'}　${(r.elapsedMs/1000).toFixed(1)} 秒`;ranking.append(li);});if(!top.length){const li=document.createElement('li');li.textContent='通过以后，留下你的用时';ranking.append(li);}if(!records.available){const li=document.createElement('li');li.textContent='成绩暂存在本页';ranking.append(li);}}
    }
  }
  let tracks=[];
  function start(index){
    if(disposed)return;onResumeAudio();activeTrack=index;keys.clear();input.reset();inputHint='';lastFrameAt=performance.now();fxKind=null;$('.wl-fx').hidden=true;partner.src=`assets/characters/${character}/idle/idle-1.png`;
    renderer?.dispose();renderer=null;runtime=new WireLoopRuntime(tracks[index],{controlMode:mode,onEvent});
    try{renderer=new WireRenderer(stage,tracks[index],()=>failResource('画面暂时中断了，可以返回再试。'));}catch{failResource('这个小游戏需要浏览器支持 WebGL。其他玩法仍然可以玩。');return;}
    $('.wl-clock').hidden=tracks[index].tutorial;phase=mode==='camera'?'calibrating':'playing';lastAt=performance.now();
    if(mode==='camera')panel('握稳小拳头','自然放在身前，保持一小会儿。',[['返回大厅',exit]]);else hidePanel();
    footer.textContent=instruction();
  };
  function exit(){dispose();onExit();}
  function pause(reason='parent'){runtime?.pause(reason);}
  function frame(now){
    if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-lastAt)/1000);lastAt=now;
    if(runtime&&renderer){
      if(phase==='playing'){
        if(mode==='keyboard'){
          const held=keys.has('Space');const dx=(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')))*dt*.12,dy=(Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown')))*dt*.12;
          const delta=renderer.mapDelta(dx,dy),pose={x:runtime.pose.x+delta.x,y:runtime.pose.y+delta.y,angle:runtime.pose.angle+(Number(keys.has('KeyD'))-Number(keys.has('KeyA')))*dt*.8};
          runtime.step({pose,held,timestampMs:now},now);
        }else if(now-lastFrameAt>100){runtime.step({valid:false,held:false,timestampMs:lastFrameAt},now);}else runtime.tick(now);
      }
      renderer.render(runtime.pose);$('.wl-clock strong').textContent=(Math.max(0,runtime.track.timeLimitMs-runtime.elapsedMs)/1000).toFixed(1);$('.wl-clock small').textContent=!runtime.eligible&&!runtime.track.tutorial?'练习':'';
      if(phase==='playing'){const released=runtime.state==='released';const text=runtime.state==='tracking_hold'?'找一找小手…':inputHint?inputHint:released?'停住啦，时间还在走':runtime.state==='ready'?'从起点出发 · '+instruction():instruction();if(footer.textContent!==text)footer.textContent=text;}
      const fx=$('.wl-fx');if(fxKind){const frameMs=fxKind==='contact'?70:110,index=Math.max(0,Math.floor((now-fxAt)/frameMs));if(index<4){fx.hidden=false;const p=renderer.project(fxPoint);fx.style.left=`${p.x}px`;fx.style.top=`${p.y}px`;fx.src=`assets/wire-loop/${fxKind==='contact'?'contact-flash':'finish-sparkles'}/processed/${fxKind}-${index+1}.png`;}else{fx.hidden=true;fxKind=null;}}
    }
  }
  function acceptFrame(result){
    if(disposed||cameraFailed||!renderer||!runtime||!['calibrating','playing','recovering'].includes(phase))return;
    const now=performance.now(),frame=estimateGripFrame(result,{width:video.videoWidth||640,height:video.videoHeight||480,now});
    const sample=input.consume(frame,runtime.pose,(x,y)=>renderer.mapDelta(x,y));
    if(sample.valid)lastFrameAt=now;
    inputHint=sample.gripUnknown?'轻轻握拳，再接着移动':'';
    if(phase==='calibrating'){
      $('.wl-copy').textContent=sample.valid?`握稳小拳头 ${Math.round((sample.calibrationProgress||0)*100)}%`:'把整只小手放回画面，轻轻握拳。';
      if(input.calibrated){phase='playing';runtime.lastValidAt=now;hidePanel();}return;
    }
    if(phase==='recovering'){
      if(!sample.valid||!sample.held)return;
      runtime.resume();onResumeAudio();phase='playing';lastFrameAt=now;hidePanel();
    }
    runtime.step({...sample,timestampMs:frame.timestampMs},now);
  }
  $('[data-wl="exit"]').onclick=exit;$('[data-wl="pause"]').onclick=()=>pause();
  document.addEventListener('keydown',event=>{
    if(!root.classList.contains('active'))return;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)&&phase==='playing'&&mode==='keyboard'&&!(event.target instanceof HTMLButtonElement)){event.preventDefault();keys.add(event.code);}
    if(event.code==='KeyP'||event.code==='Escape'){event.preventDefault();pause();}
  },{signal:abort.signal});
  document.addEventListener('keyup',event=>keys.delete(event.code),{signal:abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('background');},{signal:abort.signal});
  window.addEventListener('blur',()=>{keys.clear();pause('background');},{signal:abort.signal});
  function dispose(){if(disposed)return;disposed=true;abort.abort();cancelAnimationFrame(raf);camera?.dispose();preview.srcObject=null;renderer?.dispose();keys.clear();if(window.__wireLoopTest===testApi)delete window.__wireLoopTest;root.replaceChildren();}
  const testApi={snapshot:()=>({phase,state:runtime?.state,pose:runtime?.pose,progress:runtime?.progress,elapsedMs:runtime?.elapsedMs,eligible:runtime?.eligible,track:runtime?.track.id,mode,character,records:runtime?records.top(runtime.group):[]}),start,feedCamera:acceptFrame,feed:sample=>runtime?.step(sample),pause,clearRecords:()=>{records.clear();onClearScores();},project:p=>renderer?.project(p)};
  window.__wireLoopTest=testApi;
  onControllerReady({dispose,pause,clearRecords:()=>records.clear()});
  panel('正在准备…','', [['返回大厅',exit]]);
  try{
    const response=await fetch('./data/wire-loop/tracks.json');if(!response.ok)throw new Error('轨道加载失败');tracks=(await response.json()).tracks.map(buildTrack);if(disposed)return {dispose,pause};
    if(mode==='camera'){
      camera=new WireCamera(video,acceptFrame,()=>failResource('摄像头识别暂时不可用，可以改用按键。'));await camera.start();if(disposed)return {dispose,pause};
    }
    explain();raf=requestAnimationFrame(frame);
  }catch(error){if(!disposed)failResource(error.message||'资源加载失败，请返回重试。');}
  return {dispose,pause,clearRecords:()=>records.clear()};
}
