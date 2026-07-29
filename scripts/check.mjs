import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
async function files(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else if(p.endsWith('.js'))out.push(p)}return out}
for(const file of [...await files('src'),...await files('public'),...await files('test')]){const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)}
console.log('All JavaScript files parsed successfully.');
