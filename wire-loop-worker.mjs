// Classic worker: MediaPipe's local WASM loader uses importScripts.
const modules=Promise.all([import('./node_modules/@mediapipe/tasks-vision/vision_bundle.mjs'),import('./gesture-recognizer-runtime.mjs')]);
let recognizer;
self.onmessage=async({data})=>{
  try{
    if(data.type==='load')self.postMessage({type:'loading',stage:'dependencies'});
    const [{FilesetResolver,GestureRecognizer},{classifyLandmarkPose}]=await modules;
    if(data.type==='load'){
      self.postMessage({type:'loading',stage:'wasm'});
      const files=await FilesetResolver.forVisionTasks(new URL('./node_modules/@mediapipe/tasks-vision/wasm',self.location.href).href);
      self.postMessage({type:'loading',stage:'model'});
      recognizer=await GestureRecognizer.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('./assets/models/gesture_recognizer.task',self.location.href).href},runningMode:'VIDEO',numHands:1});
      self.postMessage({type:'ready'});
    }else if(data.type==='frame'){
      try{
        const result=recognizer.recognizeForVideo(data.bitmap,data.timestampMs),landmarks=result.landmarks?.[0]||[];
        const pose=classifyLandmarkPose(landmarks),top=result.gestures?.[0]?.[0];
        const model=top?.score>=.65&&['Closed_Fist','Open_Palm'].includes(top.categoryName)?top.categoryName:'None';
        const label=pose.label!=='None'&&model!=='None'&&pose.label!==model?'None':pose.label!=='None'?pose.label:model;
        self.postMessage({type:'result',timestampMs:data.timestampMs,landmarks,worldLandmarks:result.worldLandmarks?.[0]||[],handPresent:landmarks.length===21,handedness:result.handedness?.[0]?.[0]?.categoryName,label});
      }finally{data.bitmap.close();}
    }
  }catch(error){self.postMessage({type:'error',message:String(error?.message||error)});}
};
