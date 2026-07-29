import { PLANS_FILE } from "../config.js";
import { readJson, writeJson } from "../storage.js";
export const listPlans=()=>readJson(PLANS_FILE,[]);
export async function getPlan(id){const p=(await listPlans()).find(x=>x.id===id);if(!p)throw new Error("Plan not found.");return p;}
export async function savePlan(plan){const all=await listPlans();const i=all.findIndex(x=>x.id===plan.id);if(i>=0)all[i]=plan;else all.unshift(plan);await writeJson(PLANS_FILE,all.slice(0,200));}
