import { readFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_DIR } from "./config.js";
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png"};
export function json(res,status,data){const body=JSON.stringify(data);res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":Buffer.byteLength(body),"cache-control":"no-store"});res.end(body);}
export async function body(req,limit=2_000_000){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error("Request body is too large.");chunks.push(chunk);}if(!chunks.length)return{};try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{throw new Error("Invalid JSON body.");}}
export async function staticFile(req,res){let urlPath=new URL(req.url,"http://localhost").pathname; if(urlPath==="/")urlPath="/index.html";let file=path.normalize(path.join(PUBLIC_DIR,urlPath));if(!file.startsWith(PUBLIC_DIR))return false;try{const data=await readFile(file);res.writeHead(200,{"content-type":types[path.extname(file)]||"application/octet-stream","cache-control":path.extname(file)===".html"?"no-cache":"public, max-age=3600"});res.end(data);return true;}catch{return false;}}

