export const TRACKING_PAUSE_MS=1200;
import {trackPose,mixPose,sweepContact,threadedProgress} from './wire-loop-geometry.mjs';
export class WireLoopRuntime {
  constructor(track,{clock=()=>performance.now(),controlMode='keyboard',onEvent=()=>{}}={}) {
    this.track=track;this.clock=clock;this.controlMode=controlMode;this.onEvent=onEvent;
    this.state='ready';this.pose=trackPose(track,0);this.progress=0;this.startedAt=null;this.elapsedMs=0;this.eligible=!track.tutorial;this.lastValidAt=clock();this.lastStepAt=clock();this.lastHeld=false;this.runId=globalThis.crypto?.randomUUID?.()||`wire-${Date.now()}-${Math.random()}`;
  }
  get terminal(){return ['success','failed_contact','failed_timeout'].includes(this.state);}
  get group(){return {trackId:this.track.id,trackRevision:this.track.revision,difficultyId:this.track.difficultyId,controlMode:this.controlMode,assistMode:'none',rulesVersion:this.track.rulesVersion};}
  emit(type,detail={}){this.onEvent({type,...detail});}
  finish(state,at,detail={}){if(this.terminal)return;this.state=state;this.elapsedMs=this.startedAt===null?0:Math.max(0,at-this.startedAt);this.emit(state,detail);}
  pause(reason='parent'){if(this.terminal||this.state==='paused')return;this.tick(this.clock());if(this.terminal)return;this.eligible=false;this.state='paused';this.lastHeld=false;this.pauseAt=this.clock();this.emit('paused',{reason});}
  resume(){if(this.state!=='paused')return;const now=this.clock();if(this.startedAt!==null)this.startedAt+=now-this.pauseAt;this.state=this.startedAt===null?'ready':'released';this.lastValidAt=now;this.lastStepAt=now;this.lastHeld=false;this.emit('resumed');}
  tick(now=this.clock()){
    if(this.terminal||this.state==='paused')return;
    if(this.startedAt!==null){this.elapsedMs=now-this.startedAt;if(this.elapsedMs>=this.track.timeLimitMs)this.finish('failed_timeout',this.startedAt+this.track.timeLimitMs);}
  }
  step({pose=this.pose,held=false,valid=true,timestampMs=this.clock()},now=this.clock()){
    if(this.terminal||this.state==='paused')return;
    if(!valid||now-timestampMs>250||timestampMs>now+5){
      this.lastHeld=false;this.tick(now);if(this.terminal)return;
      if(now-this.lastValidAt>=TRACKING_PAUSE_MS)this.pause('tracking');else if(this.startedAt!==null)this.state='tracking_hold';return;
    }
    this.lastValidAt=now;
    if(!held){this.lastHeld=false;this.lastStepAt=now;this.tick(now);if(!this.terminal&&this.startedAt!==null)this.state='released';return;}
    if(!this.lastHeld){this.lastHeld=true;this.lastStepAt=now;this.tick(now);return;}
    const moving=Math.hypot(pose.x-this.track.points[0].x,pose.y-this.track.points[0].y)>0.01;
    if(this.startedAt===null&&!moving){
      const contact=sweepContact(this.track,this.pose,pose);
      if(contact){this.pose=contact.pose;this.finish('failed_contact',now,{contact});}
      else this.pose={...pose};
      this.lastStepAt=now;return;
    }
    if(this.startedAt===null){this.startedAt=this.lastStepAt;this.emit('started');}
    this.state='running';
    const from={...this.pose},delta=now-this.lastStepAt;
    const hit=sweepContact(this.track,from,pose);
    // Subdivide traversal too: nearest-endpoint progress alone could skip a checkpoint.
    const count=Math.max(1,Math.ceil((Math.hypot(pose.x-from.x,pose.y-from.y)+this.track.ringRadius*Math.abs(pose.angle-from.angle))/0.03));
    let finishFraction=null;
    for(let i=1;i<=count;i++){
      const f=i/count;if(hit&&f>=hit.fraction)break;
      const p=mixPose(from,pose,f);this.progress=threadedProgress(this.track,p,this.progress);
      if(this.progress>=this.track.length-0.035){finishFraction=f;break;}
    }
    const hitAt=hit?this.lastStepAt+delta*hit.fraction:Infinity;
    const finishAt=finishFraction!==null?this.lastStepAt+delta*finishFraction:Infinity;
    const timeoutAt=this.startedAt+this.track.timeLimitMs;
    if(hitAt<=finishAt&&hitAt<=timeoutAt){this.pose=hit.pose;this.finish('failed_contact',hitAt,{contact:hit});}
    else if(timeoutAt<=finishAt&&timeoutAt<=now){this.finish('failed_timeout',timeoutAt);}
    else if(finishAt<=now){this.pose=mixPose(from,pose,finishFraction);this.finish('success',finishAt);}
    else{this.pose={...pose};this.elapsedMs=now-this.startedAt;}
    this.lastStepAt=now;
  }
  record(){return {...this.group,runId:this.runId,elapsedMs:this.elapsedMs,success:this.state==='success',eligible:this.eligible};}
}
