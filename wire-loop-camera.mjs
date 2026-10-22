// Owns inference only. The application owns the single camera MediaStream.
export class WireCamera {
  constructor(video,onFrame,onError){this.video=video;this.onFrame=onFrame;this.onError=onError;this.busy=false;this.stopped=false;this.raf=0;this.lastVideo=-1;this.lastAt=0;}
  async start(){
    this.worker=new Worker(new URL('./wire-loop-worker.mjs',import.meta.url));
    await new Promise((resolve,reject)=>{
      this.rejectLoad=reject;
      this.timer=setTimeout(()=>reject(new Error('识别加载超时')),20000);
      this.worker.onerror=event=>{clearTimeout(this.timer);reject(new Error(event.message||'识别不可用'));this.onError(event.message);};
      this.worker.onmessage=({data})=>{
        if(this.stopped)return;
        if(data.type==='ready'){clearTimeout(this.timer);this.rejectLoad=null;resolve();}
        else if(data.type==='result'){this.busy=false;this.onFrame(data);}
        else if(data.type==='error'){clearTimeout(this.timer);this.busy=false;reject(new Error(data.message));this.onError(data.message);}
      };
      this.worker.postMessage({type:'load'});
    });
    if(this.stopped)return;
    const loop=async now=>{
      if(this.stopped)return;this.raf=requestAnimationFrame(loop);
      if(this.busy||this.video.readyState<2||this.video.currentTime===this.lastVideo||now-this.lastAt<33)return;
      this.busy=true;this.lastAt=now;this.lastVideo=this.video.currentTime;
      try{const bitmap=await createImageBitmap(this.video);if(this.stopped){bitmap.close();return;}this.worker.postMessage({type:'frame',bitmap,timestampMs:now},[bitmap]);}
      catch(error){this.busy=false;this.onError(String(error));}
    };
    this.raf=requestAnimationFrame(loop);
  }
  dispose(){this.stopped=true;clearTimeout(this.timer);this.rejectLoad?.(new Error('cancelled'));this.rejectLoad=null;cancelAnimationFrame(this.raf);this.worker?.terminate();}
}
