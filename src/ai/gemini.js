import { planJsonSchema, validatePlanRaw } from "../planner/schema.js";
import { randomId } from "../security.js";
function systemPrompt(userPrompt,snapshot,mode){return`You are a Discord workspace planning engine. Convert the request into a precise JSON action plan. Never execute actions.

RULES
- Use only schema action types.
- Reuse target IDs when matching objects exist.
- Never invent member IDs or message IDs; ask a question instead.
- Use Discord permission names such as ViewChannel, SendMessages, ManageChannels, ManageRoles, ManageGuild, ManageMessages, ReadMessageHistory, Connect, Speak.
- Never transfer server ownership, expose credentials, invite users, or change unrelated objects.
- Preserve unrelated roles, channels, permissions, members, and messages.
- Use roleName '@everyone' for the everyone role.
- CREATE_CATEGORY uses name and optional permissionOverwrites.
- CREATE_TEXT_CHANNEL and CREATE_VOICE_CHANNEL use name, categoryName, topic, and optional permissionOverwrites.
- SEND_MESSAGE uses name as the channel name and content as message text.
- For ambiguous destructive requests, add a question and omit the destructive action.
- Do not grant Administrator.
- Current mode: ${mode}.

CURRENT SNAPSHOT
${JSON.stringify(snapshot)}

USER REQUEST
${userPrompt}`;}
export async function testGemini(apiKey){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1`);if(!r.ok)throw new Error(`Gemini connection failed (${r.status}): ${(await r.text()).slice(0,300)}`);}
async function interactions(apiKey,model,input){const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{method:"POST",headers:{"x-goog-api-key":apiKey,"content-type":"application/json"},body:JSON.stringify({model,input,response_format:{type:"text",mime_type:"application/json",schema:planJsonSchema}})});if(!r.ok)throw new Error(`Gemini Interactions API ${r.status}: ${(await r.text()).slice(0,500)}`);const d=await r.json();if(!d.output_text)throw new Error("Gemini returned no structured output.");return JSON.parse(d.output_text);}
async function generateContent(apiKey,model,input){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:input}]}],generationConfig:{responseMimeType:"application/json",responseJsonSchema:planJsonSchema,temperature:0.1}})});if(!r.ok)throw new Error(`Gemini generateContent API ${r.status}: ${(await r.text()).slice(0,500)}`);const d=await r.json();const text=d.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");if(!text)throw new Error("Gemini returned no JSON output.");return JSON.parse(text);}
export async function createAiPlan({apiKey,model,prompt,snapshot,mode}){const input=systemPrompt(prompt,snapshot,mode);let raw;try{raw=await interactions(apiKey,model,input)}catch(first){try{raw=await generateContent(apiKey,model,input)}catch(second){throw new Error(`${first.message}
Fallback failed: ${second.message}`)}}validatePlanRaw(raw);const now=new Date().toISOString();return{...raw,id:randomId("plan"),prompt,risk:"low",confirmationPhrase:null,status:"pending",createdAt:now,updatedAt:now,executionLog:[]};}
