import { mkdir, readFile, rename, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
export async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return fallback; throw error; }
}
export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}
export async function listJsonFiles(dir) {
  try { return (await readdir(dir)).filter(x => x.endsWith(".json")).sort().reverse(); }
  catch (e) { if (e?.code === "ENOENT") return []; throw e; }
}
