import { json, body } from "./http.js";
import { VERSION, AUDIT_FILE, BACKUPS_DIR } from "./config.js";
import { getSettings, saveSettings } from "./settings.js";
import { createPasswordVerifier, verifyPassword, saveSecrets, loadSecrets } from "./security.js";
import { createSession, getSession, removeSession, hasSessions } from "./sessions.js";
import { testGemini, createAiPlan } from "./ai/gemini.js";
import { discord, testDiscord } from "./discord/service.js";
import { securePlan } from "./planner/safety.js";
import { listPlans, getPlan, savePlan } from "./planner/plans.js";
import { executePlan } from "./planner/executor.js";
import { readJson, listJsonFiles } from "./storage.js";
function need(v,name){if(typeof v!=="string"||!v.trim())throw new Error(`${name} is required.`);return v.trim()}
function auth(req){const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");const session=getSession(token);if(!session)throw Object.assign(new Error("Application is locked."),{status:401});return{token,session};}
export async function route(req,res){const u=new URL(req.url,"http://localhost");const p=u.pathname;
  if(req.method==="GET"&&p==="/api/health")return json(res,200,{ok:true,version:VERSION});
  if(req.method==="GET"&&p==="/api/status"){const s=await getSettings();return json(res,200,{initialized:s.initialized,unlocked:hasSessions(),discordConnected:discord.connected(),serverName:s.serverName,botName:s.botName,model:s.model,mode:s.mode,version:VERSION});}
  if(req.method==="POST"&&p==="/api/setup/test-gemini"){const b=await body(req);await testGemini(need(b.apiKey,"Gemini API key"));return json(res,200,{ok:true});}
  if(req.method==="POST"&&p==="/api/setup/test-discord"){const b=await body(req);const result=await testDiscord({discordBotToken:need(b.discordBotToken,"Discord bot token"),discordClientId:need(b.discordClientId,"Discord Client ID"),guildId:need(b.guildId,"Guild ID"),geminiApiKey:""});return json(res,200,{ok:true,...result});}
  if(req.method==="POST"&&p==="/api/setup/complete"){const old=await getSettings();if(old.initialized)throw new Error("Application is already initialized.");const b=await body(req);for(const k of["geminiApiKey","model","discordBotToken","discordClientId","guildId","ownerUserId","password","mode"])need(b[k],k);if(!["safe","managed","full"].includes(b.mode))throw new Error("Invalid management mode.");if(b.password.length<8)throw new Error("Password must contain at least 8 characters.");await testGemini(b.geminiApiKey);const info=await testDiscord(b);await saveSecrets({geminiApiKey:b.geminiApiKey,discordBotToken:b.discordBotToken,discordClientId:b.discordClientId,guildId:b.guildId},b.password);await saveSettings({initialized:true,passwordVerifier:createPasswordVerifier(b.password),ownerUserId:b.ownerUserId,model:b.model,mode:b.mode,serverName:info.serverName,botName:info.botName,createdAt:new Date().toISOString()});await discord.connect(b);return json(res,200,{ok:true,token:createSession(b.password),...info});}
  if(req.method==="POST"&&p==="/api/auth/unlock"){const b=await body(req),s=await getSettings();if(!s.initialized||!verifyPassword(b.password||"",s.passwordVerifier||""))throw Object.assign(new Error("Invalid local admin password."),{status:401});const secrets=await loadSecrets(b.password);const info=await discord.connect(secrets);return json(res,200,{ok:true,token:createSession(b.password),...info});}
  if(req.method==="POST"&&p==="/api/auth/logout"){const a=auth(req);removeSession(a.token);discord.disconnect();return json(res,200,{ok:true});}
  if(!p.startsWith("/api/")) return false;
  const a=auth(req);
  if(req.method==="GET"&&p==="/api/server/snapshot")return json(res,200,await discord.snapshot());
  if(req.method==="GET"&&p==="/api/plans")return json(res,200,await listPlans());
  if(req.method==="POST"&&p==="/api/plans"){const b=await body(req);const prompt=need(b.prompt,"Prompt");if(prompt.length>30000)throw new Error("Prompt is too long.");const s=await getSettings(),secrets=await loadSecrets(a.session.password),snapshot=await discord.snapshot();let plan=await createAiPlan({apiKey:secrets.geminiApiKey,model:s.model||"gemini-3.1-flash-lite",prompt,snapshot,mode:s.mode||"managed"});plan=securePlan(plan,s.mode||"managed");await savePlan(plan);return json(res,200,plan);}
  const planMatch=p.match(/^\/api\/plans\/([^/]+)$/);if(req.method==="GET"&&planMatch)return json(res,200,await getPlan(planMatch[1]));
  const execMatch=p.match(/^\/api\/plans\/([^/]+)\/execute$/);if(req.method==="POST"&&execMatch){const b=await body(req);return json(res,200,await executePlan(await getPlan(execMatch[1]),b.confirmation));}
  const cancelMatch=p.match(/^\/api\/plans\/([^/]+)\/cancel$/);if(req.method==="POST"&&cancelMatch){const x=await getPlan(cancelMatch[1]);const y={...x,status:"cancelled",updatedAt:new Date().toISOString()};await savePlan(y);return json(res,200,y);}
  if(req.method==="GET"&&p==="/api/audit")return json(res,200,await readJson(AUDIT_FILE,[]));
  if(req.method==="GET"&&p==="/api/backups")return json(res,200,await listJsonFiles(BACKUPS_DIR));
  return false;
}
