import crypto from "node:crypto";
const sessions=new Map(); const TTL=12*60*60*1000;
export function createSession(password){const token=crypto.randomBytes(32).toString("base64url");sessions.set(token,{createdAt:Date.now(),password});return token;}
export function getSession(token){const s=sessions.get(token);if(!s)return null;if(Date.now()-s.createdAt>TTL){sessions.delete(token);return null;}return s;}
export function removeSession(token){sessions.delete(token);}
export function hasSessions(){for(const k of sessions.keys())getSession(k);return sessions.size>0;}
