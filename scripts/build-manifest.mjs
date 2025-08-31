#!/usr/bin/env node
import { writeFile } from 'fs/promises';

const ASSETS_BASE = 'https://killinger.synology.me';
const MAX_DEPTH = 2;
const manifest = { ambient: [], ui: [], pops: [], loops: [], foliage: [] };
const failures = [];

const matchers = {
  ambient: [
    'audio/dungeon_ambient_1.ogg',
    'audio/dark_cavern_ambient_001.ogg',
    'audio/Rain OGG/1.ogg',
    'audio/Memoraphile - Up in the Sky.ogg'
  ],
  ui: [
    'audio/qubodup-click/qubodup-click1.wav',
    'audio/qubodup-click/qubodup-hover1.wav'
  ],
  pops: ['audio/3pops/pop2.ogg'],
  loops: [
    'audio/sfx_100_v2/sfx100v2_loop_water_01.ogg',
    'audio/sfx_100_v2/sfx100v2_thunder_01.ogg'
  ]
};

function categorize(url) {
  const rel = url.replace(ASSETS_BASE, '').replace(/^\//, '');
  for (const [key, arr] of Object.entries(matchers)) {
    if (arr.includes(rel)) {
      manifest[key].push(url);
      return;
    }
  }
  if (/kenney_foliage-pack\/PNG\/(Default%20size|Leaves)\/foliagePack/.test(rel)) {
    manifest.foliage.push(url);
  }
}

async function crawl(url, depth = 0) {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    failures.push([url, e.message]);
    return;
  }
  if (!res.ok) { failures.push([url, res.status]); return; }
  const text = await res.text();
  const regex = /href="([^\"]+)"/g;
  let m;
  while ((m = regex.exec(text))) {
    let href = m[1];
    if (href.startsWith('?') || href.startsWith('#')) continue;
    const full = new URL(href, url).href;
    if (full.endsWith('/') && depth < MAX_DEPTH) {
      await crawl(full, depth + 1);
    } else if (/\.(ogg|wav|mp3|png)$/i.test(full)) {
      const encoded = encodeURI(full);
      try {
        const head = await fetch(encoded, { method: 'HEAD' });
        if (head.ok) {
          categorize(encoded);
        } else {
          failures.push([encoded, head.status]);
        }
      } catch (e) {
        failures.push([encoded, e.message]);
      }
    }
  }
}

await crawl(ASSETS_BASE + '/');
await writeFile('config/assets.manifest.json', JSON.stringify(manifest, null, 2));
if (failures.length) {
  console.table(failures.map(([url, status]) => ({ url, status })));
}
console.log('Wrote manifest with', Object.values(manifest).reduce((a,b)=>a+b.length,0), 'assets');
