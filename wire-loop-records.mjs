export const WIRE_RECORD_KEY='gesture-pup-wire-times-v1';
export const groupKey=r=>JSON.stringify([r.trackId,r.trackRevision,r.difficultyId,r.controlMode,r.assistMode,r.rulesVersion]);
export function validRecord(r){return r&&typeof r.runId==='string'&&r.runId.length<150&&typeof r.trackId==='string'&&r.trackId.length<100&&Number.isInteger(r.trackRevision)&&r.trackRevision>0&&typeof r.difficultyId==='string'&&['camera','keyboard'].includes(r.controlMode)&&r.assistMode==='none'&&Number.isInteger(r.rulesVersion)&&r.rulesVersion>0&&Number.isFinite(r.elapsedMs)&&r.elapsedMs>0&&r.elapsedMs<=60000&&r.success===true&&r.eligible===true;}
export class WireRecords {
  constructor(storage){this.storage=storage;this.available=Boolean(storage);this.records=[];this.seen=new Set();try{const raw=JSON.parse(storage?.getItem(WIRE_RECORD_KEY)||'[]');if(Array.isArray(raw))this.records=raw.filter(validRecord).slice(0,1000);}catch{this.available=false;}this.records=this.records.filter(r=>{if(this.seen.has(r.runId))return false;this.seen.add(r.runId);return true;});}
  top(group){return this.records.filter(r=>groupKey(r)===groupKey(group)).sort((a,b)=>a.elapsedMs-b.elapsedMs||a.runId.localeCompare(b.runId)).slice(0,5);}
  add(record){if(!validRecord(record)||this.seen.has(record.runId))return false;this.seen.add(record.runId);this.records.push({...record});const groups=new Map();for(const r of this.records)groups.set(groupKey(r),this.top(r));this.records=[...groups.values()].flat();try{this.storage?.setItem(WIRE_RECORD_KEY,JSON.stringify(this.records));}catch{this.available=false;}return true;}
  clear(){this.records=[];this.seen.clear();try{this.storage?.removeItem(WIRE_RECORD_KEY);}catch{this.available=false;}}
}
