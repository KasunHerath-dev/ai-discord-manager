import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const sleep = ms => new Promise(r => setTimeout(r, ms));
test("local server exposes health, status, and UI", async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), "fasnet-smoke-"));
  const port = 18991;
  const child = spawn(process.execPath, ["src/index.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir },
    stdio: "ignore"
  });
  try {
    let ready = false;
    for (let i=0;i<30;i++) {
      try { const r=await fetch(`http://127.0.0.1:${port}/api/health`); if(r.ok){ready=true;break} } catch {}
      await sleep(100);
    }
    assert.equal(ready, true);
    const status = await (await fetch(`http://127.0.0.1:${port}/api/status`)).json();
    assert.equal(status.initialized, false);
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    assert.match(html, /FasNet Discord AI Manager/);
  } finally {
    child.kill("SIGTERM");
    await rm(dataDir, { recursive:true, force:true });
  }
});
