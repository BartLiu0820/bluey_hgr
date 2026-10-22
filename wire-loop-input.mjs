const TAU=Math.PI*2;
export function unwrapAngle(previous,next){return previous+((next-previous+Math.PI)%TAU+TAU)%TAU-Math.PI;}
export class OneEuro {
  constructor({minCutoff=1.2,beta=0.12,dCutoff=1}={}){Object.assign(this,{minCutoff,beta,dCutoff});this.reset();}
  reset(){this.value=null;this.raw=null;this.time=null;this.derivative=0;}
  filter(value,time){if(this.value===null){this.value=this.raw=value;this.time=time;return value;}const dt=Math.max(.001,(time-this.time)/1000);const alpha=c=>1/(1+1/(2*Math.PI*c*dt));this.derivative+=alpha(this.dCutoff)*((value-this.raw)/dt-this.derivative);this.value+=alpha(this.minCutoff+this.beta*Math.abs(this.derivative))*(value-this.value);this.raw=value;this.time=time;return this.value;}
}
export function estimateGripFrame(result,{width=640,height=480,now=performance.now()}={}){
  const timestampMs=result.timestampMs??now,points=result.landmarks||[],qualityReasons=[];
  const ids=[0,5,9,13,17];
  if(!result.handPresent||ids.some(i=>!points[i]||!Number.isFinite(points[i].x)||!Number.isFinite(points[i].y)))return {timestampMs,handPresent:false,gripState:'unknown',positionValid:false,rotationValid:false,qualityReasons:['missing']};
  if(now-timestampMs>250||timestampMs>now+5)qualityReasons.push('stale');
  if(ids.some(i=>points[i].x<.015||points[i].x>.985||points[i].y<.015||points[i].y>.985))qualityReasons.push('cropped');
  const average=indices=>indices.reduce((p,i)=>({x:p.x+points[i].x/indices.length,y:p.y+points[i].y/indices.length}),{x:0,y:0});
  const center=average(ids),mcp=average([5,9,13,17]),wrist=points[0];
  const dx=-(mcp.x-wrist.x)*width/height,dy=-(mcp.y-wrist.y);
  const scale=Math.hypot(dx,dy);if(scale<.035)qualityReasons.push('short_projection');
  const label=result.label??result.rawLabel;
  return {timestampMs,handPresent:true,handedness:result.handedness||'unknown',gripState:label==='Closed_Fist'?'held':label==='Open_Palm'?'open':'unknown',position2D:{x:1-center.x,y:1-center.y},angleRad:Math.atan2(dy,dx),scale,positionValid:qualityReasons.length===0,rotationValid:qualityReasons.length===0,qualityReasons};
}
export class WireInput {
  constructor({rotationGain=1.6}={}){this.rotationGain=rotationGain;this.filters=[new OneEuro(),new OneEuro(),new OneEuro({minCutoff:2.4,beta:.35})];this.reset();}
  reset(){this.filters.forEach(f=>f.reset());this.samples=[];this.calibrated=false;this.candidate='unknown';this.candidateAt=0;this.grip='open';this.anchor=null;this.last=null;this.lastTimestamp=-Infinity;this.referenceAngle=null;}
  detach(){this.anchor=null;this.grip='open';this.candidate='unknown';this.filters.forEach(f=>f.reset());this.referenceAngle=null;}
  consume(frame,currentPose,mapDelta){
    const time=frame.timestampMs;
    let valid=frame.positionValid&&frame.rotationValid&&time>this.lastTimestamp;
    if(this.last&&frame.scale&&this.last.scale&&(frame.scale/this.last.scale>1.45||frame.scale/this.last.scale<.69))valid=false;
    if(this.last&&frame.handedness!==this.last.handedness)valid=false;
    if(this.last&&frame.position2D&&this.last.position2D&&time-this.last.timestampMs<120&&Math.hypot(frame.position2D.x-this.last.position2D.x,frame.position2D.y-this.last.position2D.y)>.2)valid=false;
    if(this.last&&time-this.last.timestampMs>250){this.detach();}
    this.lastTimestamp=time;
    if(!valid){if(frame.positionValid&&frame.rotationValid)this.last=frame;this.anchor=null;this.samples=[];this.candidate='unknown';this.grip='open';return {valid:false,held:false,pose:currentPose,calibrationProgress:0};}
    this.last=frame;
    if(frame.gripState!==this.candidate){this.candidate=frame.gripState;this.candidateAt=time;}
    // A visible hand with an uncertain gesture is released, not lost tracking.
    if(frame.gripState==='unknown'){this.detach();this.samples=[];return {valid:true,held:false,pose:currentPose,gripUnknown:true};}
    if(time-this.candidateAt>=150)this.grip=frame.gripState;
    if(!this.calibrated){
      if(this.grip!=='held'){this.samples=[];return {valid:true,held:false,pose:currentPose,calibrationProgress:0};}
      this.samples.push(frame);while(this.samples.length>100)this.samples.shift();
      const first=this.samples[0],elapsed=time-first.timestampMs;
      const xs=this.samples.map(f=>f.position2D.x),ys=this.samples.map(f=>f.position2D.y);
      const angleSpan=Math.max(...this.samples.map(f=>unwrapAngle(first.angleRad,f.angleRad)))-Math.min(...this.samples.map(f=>unwrapAngle(first.angleRad,f.angleRad)));
      if(Math.max(...xs)-Math.min(...xs)>.025||Math.max(...ys)-Math.min(...ys)>.025||angleSpan>.18){this.samples=[frame];return {valid:true,held:false,pose:currentPose,calibrationProgress:0};}
      if(elapsed>=1000&&this.samples.length>=12){this.calibrated=true;this.samples=[];}
      return {valid:true,held:false,pose:currentPose,calibrationProgress:Math.min(1,elapsed/1000)};
    }
    if(this.grip!=='held'){this.anchor=null;return {valid:true,held:false,pose:currentPose};}
    const rawAngle=this.referenceAngle===null?frame.angleRad:unwrapAngle(this.referenceAngle,frame.angleRad);this.referenceAngle=rawAngle;
    if(!this.anchor){this.filters.forEach(f=>f.reset());this.anchor={x:frame.position2D.x,y:frame.position2D.y,angle:rawAngle,pose:{...currentPose}};}
    const x=this.filters[0].filter(frame.position2D.x,time),y=this.filters[1].filter(frame.position2D.y,time),angle=this.filters[2].filter(rawAngle,time);
    const delta=mapDelta(x-this.anchor.x,y-this.anchor.y);
    return {valid:true,held:true,pose:{x:this.anchor.pose.x+delta.x,y:this.anchor.pose.y+delta.y,angle:this.anchor.pose.angle+(angle-this.anchor.angle)*this.rotationGain}};
  }
}
