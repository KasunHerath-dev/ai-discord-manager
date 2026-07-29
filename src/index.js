import http from "node:http";
import { route } from "./router.js";
import { staticFile, json } from "./http.js";
import { HOST, PORT } from "./config.js";
const server=http.createServer(async(req,res)=>{try{res.setHeader("x-content-type-options","nosniff");res.setHeader("x-frame-options","DENY");res.setHeader("referrer-policy","no-referrer");res.setHeader("content-security-policy","default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:");const handled=await route(req,res);if(handled!==false)return;if(req.method==="GET"&&await staticFile(req,res))return;if(req.method==="GET"&&!req.url.startsWith("/api/")){req.url="/index.html";if(await staticFile(req,res))return}json(res,404,{error:"Not found"});}catch(e){console.error(e);json(res,e.status||400,{error:e.message||"Unexpected error"});}});
server.listen(PORT,HOST,()=>console.log(`
FasNet AI Discord Manager
http://${HOST}:${PORT}
`));
