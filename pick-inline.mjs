// 挑 2 张无重复高清横版壁纸做正文配图
import sharp from 'sharp';
import { readdirSync } from 'fs';

async function phash(img) {
  const { data } = await img.resize(8, 8).greyscale().raw().toBuffer({ resolveWithObject: true });
  const avg = data.reduce((a, b) => a + b, 0) / 64;
  let h = 0n;
  for (let i = 0; i < 64; i++) if (data[i] > avg) h |= (1n << BigInt(i));
  return h;
}
function hamming(a, b) { let d = a ^ b, c = 0; while (d) { c += Number(d & 1n); d >>= 1n; } return c; }

const coversDir = 'public/images/covers/';
const usedHashes = [];
for (const f of readdirSync(coversDir)) {
  if (f.endsWith('.webp')) usedHashes.push(await phash(sharp(coversDir + f)));
}
// 也要避开正文已有图 01.webp
usedHashes.push(await phash(sharp('public/images/posts/rk3588-local-kb/01.webp')));
console.log(`已用图哈希 ${usedHashes.length} 个`);

const dir = '/opt/data/document/websites/壁纸/';
const bad = /屏幕截图|upscayl|freecompress|汉化组|星空列车|千恋|CUT|yourname|东方|初音|linux|web-dynamic|@|合照|R-C/;
const files = readdirSync(dir).filter(f => !bad.test(f));

let picked = [];
for (const f of files) {
  if (picked.length >= 3) break;
  try {
    const meta = await sharp(dir + f).metadata();
    const r = meta.width / meta.height;
    if (r >= 1.5 && r <= 2.0 && meta.width >= 1600) {
      const h = await phash(sharp(dir + f));
      if (usedHashes.every(u => hamming(h, u) > 12)) {
        picked.push({ f, w: meta.width, hgt: meta.height, r: r.toFixed(2) });
      }
    }
  } catch {}
}
console.log('\n无重复候选:');
picked.forEach((p, i) => console.log(`${i + 1}. ${p.f} (${p.w}x${p.hgt} r=${p.r})`));
