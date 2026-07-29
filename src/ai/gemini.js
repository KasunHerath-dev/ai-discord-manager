import { planJsonSchema, validatePlanRaw } from "../planner/schema.js";
import { validatePlan } from "../planner/validator.js";
import { randomId } from "../security.js";
function systemPrompt(userPrompt,snapshot,mode){return`You are a Discord workspace planning engine. Convert the request into a precise JSON action plan. Never execute actions.

CRITICAL RULES FOR SPECIFIC RESOURCES
- EVERY role mentioned or requested MUST have a separate CREATE_ROLE action with its exact name.
- EVERY category mentioned or requested MUST have a separate CREATE_CATEGORY action with its exact name.
- EVERY text channel mentioned or requested MUST have a separate CREATE_TEXT_CHANNEL action with its exact name.
- EVERY voice channel mentioned or requested MUST have a separate CREATE_VOICE_CHANNEL action with its exact name.
- Do NOT collapse multiple resources into one generic action.
- Do NOT use placeholder names like "Target", "Role", "Category", "Channel", "Project Role", "Project Category", "All Roles", "All Channels".
- Every action.name, action.roleName, and action.categoryName MUST be a concrete, specific resource name.
- Every action.id MUST be unique and derived from the resource name (e.g., "role-project-owner", "category-information", "channel-announcements").

OPERATION STRUCTURE
Each action must have:
- id: unique identifier (e.g., "role-project-owner", "category-01-information", "channel-announcements")
- type: specific operation type (CREATE_ROLE, CREATE_TEXT_CHANNEL, etc.)
- name or roleName or categoryName: exact resource name from the request
- parentCategoryId or categoryName: for channels, reference the category by name or operation ID
- reason: clear description of why this specific resource is created
- risk: assessed risk level
- topic: for channels, include the exact topic requested
- permissionOverwrites: specific permission rules for this resource

RESOURCE COUNT VALIDATION
- Analyze the user request for all mentioned roles, categories, and channels.
- Count them explicitly.
- Include resourceCounts in the response with rolesRequested, categoriesRequested, textChannelsRequested, voiceChannelsRequested.
- Generate the same number of operations: if 14 roles are requested, generate 14 CREATE_ROLE actions.

CORE RULES
- Use only schema action types.
- Reuse target IDs when matching objects exist in the snapshot.
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
- Set needsClarification to true only if the request cannot be interpreted.
- Current mode: ${mode}.

CURRENT SNAPSHOT
${JSON.stringify(snapshot)}

USER REQUEST
${userPrompt}`;}
export async function testGemini(apiKey){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1`);if(!r.ok)throw new Error(`Gemini connection failed (${r.status}): ${(await r.text()).slice(0,300)}`);}
async function interactions(apiKey,model,input){const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{method:"POST",headers:{"x-goog-api-key":apiKey,"content-type":"application/json"},body:JSON.stringify({model,input,response_format:{type:"text",mime_type:"application/json",schema:planJsonSchema}})});if(!r.ok)throw new Error(`Gemini Interactions API ${r.status}: ${(await r.text()).slice(0,500)}`);const d=await r.json();if(!d.output_text)throw new Error("Gemini returned no structured output.");return JSON.parse(d.output_text);}
async function generateContent(apiKey,model,input){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:input}]}],generationConfig:{responseMimeType:"application/json",responseJsonSchema:planJsonSchema,temperature:0.1}})});if(!r.ok)throw new Error(`Gemini generateContent API ${r.status}: ${(await r.text()).slice(0,500)}`);const d=await r.json();const text=d.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");if(!text)throw new Error("Gemini returned no JSON output.");return JSON.parse(text);}
export async function createAiPlan({apiKey,model,prompt,snapshot,mode}){const input=systemPrompt(prompt,snapshot,mode);let raw;try{raw=await interactions(apiKey,model,input)}catch(first){try{raw=await generateContent(apiKey,model,input)}catch(second){throw new Error(`${first.message}
Fallback failed: ${second.message}`)}}validatePlanRaw(raw);const validationIssues=validatePlan(prompt,raw);let needsClarification=raw.needsClarification||validationIssues.length>0;const warnings=[...raw.warnings,...validationIssues];const now=new Date().toISOString();return{...raw,id:randomId("plan"),prompt,risk:"low",confirmationPhrase:null,status:"pending",createdAt:now,updatedAt:now,executionLog:[],needsClarification,warnings};}
