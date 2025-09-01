// Simple structural + optional network smoke test
import { readFile } from "node:fs/promises";

const fail = (msg) => { console.error("TEST FAIL:", msg); process.exit(1); };
const ok = (msg) => console.log("\u2713", msg);

const html = await readFile("index.html", "utf8").catch(() => fail("missing index.html"));
if (!/id=["']ca["']/.test(html)) fail("index.html missing <canvas id=\"ca\">");
if (!/id=["']game["']/.test(html)) fail("index.html missing <canvas id=\"game\">");
ok("index.html has both canvases (ca, game)");

const raw = await readFile("config/assets.manifest.json", "utf8").catch(() => fail("missing config/assets.manifest.json"));
let manifest;
try { manifest = JSON.parse(raw); } catch { fail("assets.manifest.json is not valid JSON"); }

if (!manifest.images || !manifest.audio) fail("assets.manifest.json must have images and audio objects");
const collectUrls = (obj) => Object.values(obj).flatMap(v =>
  typeof v === "string" ? [v] : collectUrls(v)
);
const imgUrls = collectUrls(manifest.images);
const audUrls = collectUrls(manifest.audio);
if (imgUrls.length < 1 || audUrls.length < 1) fail("manifest must include at least 1 image and 1 audio URL");
ok(`manifest has ${imgUrls.length} images and ${audUrls.length} audio entries`);

const badProto = [...imgUrls, ...audUrls].find(u => !/^https:\/\//.test(u));
if (badProto) fail(`non-HTTPS asset URL: ${badProto}`);
ok("all asset URLs are HTTPS");

if (process.env.ASSET_CHECK) {
  if (typeof fetch !== "function") fail("Node 18+ required for fetch");
  const sample = [...imgUrls.slice(0, 3), ...audUrls.slice(0, 3)];
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000);

  const results = await Promise.allSettled(sample.map(u =>
    fetch(u, { method: "HEAD", redirect: "follow", signal: controller.signal })
      .then(r => ({ url: u, ok: r.ok, status: r.status }))
  ));
  clearTimeout(to);

  const failures = results.filter(x => x.status !== "fulfilled" || !x.value.ok);
  if (failures.length) {
    console.error("Asset HEAD check failures:", failures.map(f => f.status === "fulfilled" ? `${f.value.url} -> ${f.value.status}` : f.reason));
    fail("one or more assets were not reachable (HEAD)");
  }
  ok("asset reachability (HEAD) passed for sample set");
}

console.log("All smoke tests passed.");
