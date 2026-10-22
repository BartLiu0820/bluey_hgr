import * as THREE from './node_modules/three/build/three.module.js';
export class WireRenderer {
  constructor(host,track,onLost=()=>{}){
    this.host=host;this.track=track;this.disposed=false;this.textures=[];
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','金色圆环穿过银蓝色火线');
    this.lost=event=>{event.preventDefault();onLost();};this.renderer.domElement.addEventListener('webglcontextlost',this.lost);
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-5,5,3.5,-3.5,.1,100);
    this.camera.position.set(11,-1,10);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xb5bea0,2.5));const light=new THREE.DirectionalLight(0xfff2d6,3);light.position.set(-3,4,8);this.scene.add(light);
    this.materials=[];
    const load=path=>{const texture=new THREE.TextureLoader().load(path,()=>{if(this.disposed)texture.dispose();});texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;this.textures.push(texture);return texture;};
    const railMaterial=new THREE.MeshStandardMaterial({map:load('assets/wire-loop/wire-metal-strip/material.png'),metalness:.35,roughness:.42});
    const ringMaterial=new THREE.MeshStandardMaterial({map:load('assets/wire-loop/probe-metal-strip/material.png'),metalness:.42,roughness:.35});this.materials.push(railMaterial,ringMaterial);
    // Custom tube rings at every collision vertex: TubeGeometry's uniform re-sampling
    // could otherwise cut across a bend differently from the collision polyline.
    const vertices=[],normals=[],uv=[],indices=[],radial=48;
    track.points.forEach((p,i)=>{const before=track.points[Math.max(0,i-1)],after=track.points[Math.min(track.points.length-1,i+1)];const tangent=new THREE.Vector3(after.x-before.x,after.y-before.y,0).normalize();const side=new THREE.Vector3(-tangent.y,tangent.x,0);for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,n=side.clone().multiplyScalar(Math.cos(a)).add(new THREE.Vector3(0,0,Math.sin(a)));vertices.push(p.x+n.x*track.wireRadius,p.y+n.y*track.wireRadius,n.z*track.wireRadius);normals.push(n.x,n.y,n.z);uv.push(i/track.points.length*8,j/radial);if(i<track.points.length-1&&j<radial){const k=i*(radial+1)+j;indices.push(k,k+radial+1,k+1,k+1,k+radial+1,k+radial+2);}}});
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);this.scene.add(new THREE.Mesh(geometry,railMaterial));
    this.probe=new THREE.Group();this.ring=new THREE.Mesh(new THREE.TorusGeometry(track.ringRadius,track.ringTubeRadius,48,192),ringMaterial);this.probe.add(this.ring);this.scene.add(this.probe);
    for(const [i,slug] of [[0,'start-dock'],[track.points.length-1,'finish-dock']]){const dock=this.sprite(`assets/wire-loop/${slug}/${slug}.png`,.85,.85);dock.center.set(127.35/256,1-66.674/256);dock.position.set(track.points[i].x,track.points[i].y,-.01);this.scene.add(dock);}
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
  }
  sprite(path,w,h){const texture=new THREE.TextureLoader().load(path,()=>{if(this.disposed)texture.dispose();});texture.colorSpace=THREE.SRGBColorSpace;this.textures.push(texture);const material=new THREE.SpriteMaterial({map:texture,depthWrite:false});this.materials.push(material);const sprite=new THREE.Sprite(material);sprite.scale.set(w,h,1);return sprite;}
  resize(){const width=Math.max(1,this.host.clientWidth),height=Math.max(1,this.host.clientHeight),aspect=width/height;const halfH=Math.max(2.45,3.5/aspect);Object.assign(this.camera,{left:-halfH*aspect,right:halfH*aspect,top:halfH,bottom:-halfH});this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);}
  mapDelta(dx,dy){const c=this.camera;const up=new THREE.Vector3(0,1,0).applyQuaternion(c.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(c.quaternion);const sx=dx*(c.right-c.left),sy=dy*(c.top-c.bottom),det=right.x*up.y-right.y*up.x;return {x:(sx*up.y-sy*right.y)/det,y:(sy*right.x-sx*up.x)/det};}
  project(point){const p=new THREE.Vector3(point.x,point.y,point.z||0).project(this.camera);return {x:(p.x+1)*.5*this.host.clientWidth,y:(1-p.y)*.5*this.host.clientHeight};}
  render(pose){if(this.disposed)return;this.probe.position.set(pose.x,pose.y,0);this.ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(Math.cos(pose.angle),Math.sin(pose.angle),0));this.renderer.render(this.scene,this.camera);}
  dispose(){if(this.disposed)return;this.disposed=true;this.resizeObserver.disconnect();this.scene.traverse(object=>object.geometry?.dispose());this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
