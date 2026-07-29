import crypto from "node:crypto";
import { readJson, writeJson } from "./storage.js";
import { SECRETS_FILE } from "./config.js";
const scrypt = (password, salt) => crypto.scryptSync(password, salt, 32);
export function createPasswordVerifier(password) {
  if (typeof password !== "string" || password.length < 8) throw new Error("Local admin password must contain at least 8 characters.");
  const salt = crypto.randomBytes(16); const hash = scrypt(password, salt);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}
export function verifyPassword(password, verifier) {
  try { const [s,h] = verifier.split(":"); const expected = Buffer.from(h,"base64"); const actual = scrypt(password, Buffer.from(s,"base64")); return expected.length === actual.length && crypto.timingSafeEqual(expected, actual); }
  catch { return false; }
}
export async function saveSecrets(secrets, password) {
  const salt=crypto.randomBytes(16), iv=crypto.randomBytes(12), key=scrypt(password,salt), cipher=crypto.createCipheriv("aes-256-gcm",key,iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(secrets),"utf8"),cipher.final()]);
  await writeJson(SECRETS_FILE,{version:1,salt:salt.toString("base64"),iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),ciphertext:ciphertext.toString("base64")});
}
export async function loadSecrets(password) {
  const payload=await readJson(SECRETS_FILE,null); if(!payload) throw new Error("Encrypted credentials were not found.");
  try { const decipher=crypto.createDecipheriv("aes-256-gcm",scrypt(password,Buffer.from(payload.salt,"base64")),Buffer.from(payload.iv,"base64")); decipher.setAuthTag(Buffer.from(payload.tag,"base64")); return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.ciphertext,"base64")),decipher.final()]).toString("utf8")); }
  catch { throw new Error("Could not decrypt local credentials."); }
}
export function randomId(prefix="id") { return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`; }
