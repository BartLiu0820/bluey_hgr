// The rendered rail is this exact polyline. Bounds include both curve and motion.
export const EPSILON = 0.00025;
export const mixPose = (a,b,t) => ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:a.angle+(b.angle-a.angle)*t});
export function buildTrack(config) {
  const points = Array.from({length:config.samples+1},(_,i)=>{
    const x=config.startX+(config.endX-config.startX)*i/config.samples;
    return {x,y:config.amplitude*Math.sin(Math.PI*x/config.halfWave),z:0};
  });
  let length=0;
  const segments=points.slice(1).map((b,i)=>{const a=points[i], len=Math.hypot(b.x-a.x,b.y-a.y);const segment={a,b,len,s:length};length+=len;return segment;});
  return {...config,points,segments,length};
}
export function trackPose(track,s) {
  s=Math.max(0,Math.min(track.length,s));
  const seg=track.segments.find(seg=>seg.s+seg.len>=s)||track.segments.at(-1);
  const t=(s-seg.s)/seg.len;
  return {x:seg.a.x+(seg.b.x-seg.a.x)*t,y:seg.a.y+(seg.b.y-seg.a.y)*t,angle:Math.atan2(seg.b.y-seg.a.y,seg.b.x-seg.a.x)};
}
export function ringDistance(point,pose,R) {
  const x=point.x-pose.x,y=point.y-pose.y,z=point.z||0;
  const a=x*Math.cos(pose.angle)+y*Math.sin(pose.angle);
  const rho=Math.sqrt(Math.max(0,x*x+y*y+z*z-a*a));
  return Math.hypot(a,rho-R);
}
function segmentBound(a,b,pose,R,threshold,depth=0) {
  const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:0};
  const half=Math.hypot(b.x-a.x,b.y-a.y)/2;
  const d=ringDistance(mid,pose,R);
  if(d-half>threshold || half<EPSILON || depth>=16) return {lower:d-half,upper:d,point:mid};
  const left=segmentBound(a,mid,pose,R,threshold,depth+1),right=segmentBound(mid,b,pose,R,threshold,depth+1);
  return left.lower<right.lower?left:right;
}
export function clearance(track,pose,extra=0) {
  const threshold=track.wireRadius+track.ringTubeRadius;
  let best={lower:Infinity,upper:Infinity,point:null};
  for(const seg of track.segments){
    const bound=segmentBound(seg.a,seg.b,pose,track.ringRadius,threshold+extra);
    if(bound.lower<best.lower) best=bound;
  }
  return {...best,lower:best.lower-threshold,upper:best.upper-threshold};
}
export function sweepContact(track,from,to) {
  const totalMotion=Math.hypot(to.x-from.x,to.y-from.y)+track.ringRadius*Math.abs(to.angle-from.angle);
  function visit(lo,hi,depth){
    const mid=(lo+hi)/2,pose=mixPose(from,to,mid),bound=totalMotion*(hi-lo)/2;
    const c=clearance(track,pose,bound);
    if(c.lower>bound) return null;
    if(bound<EPSILON || depth>=22) return {fraction:lo,pose:mixPose(from,to,lo),point:c.point,errorBound:bound+EPSILON};
    return visit(lo,mid,depth+1)||visit(mid,hi,depth+1);
  }
  return visit(0,1,0);
}
// Plane crossing inside the physical hole, indexed along the entire route.
export function threadedProgress(track,pose,progress) {
  let candidate=null;
  const nx=Math.cos(pose.angle),ny=Math.sin(pose.angle);
  for(const seg of track.segments){
    const a=(seg.a.x-pose.x)*nx+(seg.a.y-pose.y)*ny;
    const b=(seg.b.x-pose.x)*nx+(seg.b.y-pose.y)*ny;
    if(a*b>0 || Math.abs(a-b)<1e-9) continue;
    const t=a/(a-b),x=seg.a.x+(seg.b.x-seg.a.x)*t,y=seg.a.y+(seg.b.y-seg.a.y)*t;
    if(Math.hypot(x-pose.x,y-pose.y)>track.ringRadius-track.ringTubeRadius-track.wireRadius) continue;
    const s=seg.s+t*seg.len;
    if(s<=progress+track.checkpointSpacing && (candidate===null||Math.abs(s-progress)<Math.abs(candidate-progress))) candidate=s;
  }
  return candidate===null?progress:Math.max(progress,candidate);
}
