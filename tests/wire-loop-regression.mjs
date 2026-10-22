import {spawnSync} from 'node:child_process';
for(const file of ['tests/character-selection-targeted.mjs','tests/mode-hub-score-loop-targeted.mjs','tests/l1-ground-collision-jump-physics-targeted.mjs','tests/font-typography-targeted.mjs']){
  const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
