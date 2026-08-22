// 生成新封面 wall-45.webp: phash 去重 + 转 webp
import sharp from 'sharp';
import { readdirSync } from 'fs';

// 8x8 灰度感知哈希
async function phash(img) {
  const { data, info } = await img.resize(8, 8).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < 64; i++) sum += data[i];
  const avg = sum / 64;
  let hash = 0n;
  for (let i = 0; i < 64; i++) {
    if (data[i] > avg) hash |= (1n << BigInt(i));
  }
  return hash;
}
function hamming(a, b) {
  let d = a ^ b, cnt = 0;
  while (d) { cnt += Number(d & 1n); d >>= 1n; }
  return cnt;
}

// 已用封面 (covers 目录所有 webp)
const coversDir = 'public/images/covers/';
const used = [];
for (const f of readdirSync(coversDir)) {
  if (f.endsWith('.webp')) {
    used.push({ f, hash: await phash(sharp(coversDir + f)) });
  }
}
console.log(`已用封面 ${used.length} 个`);

// 候选壁纸
const cands = [
  '/opt/data/document/websites/壁纸/R-C (1).jpg',
  '/opt/data/document/websites/壁纸/yxzyw0zx123z13x0w0zz3xx12y02zxzw.jpg',
  '/opt/data/document/websites/壁纸/1695033044241.jpg',
];

for (const c of cands) {
  const hash = await phash(sharp(c));
  let dup = null;
  for (const u of used) {
    if (hamming(hash, u.hash) <= 12) { dup = u.f; break; }
  }
  console.log(`\n${c.split('/').pop()}`);
  console.log(dup ? `  ⚠️ 与 ${dup} 重复` : '  ✅ 无重复');
}

// 选 1695033044241.jpg (4000x2216 16:9, phash 无重复) 生成 wall-45
const src = '/opt/data/document/websites/壁纸/1695033044241.jpg';
await sharp(src).resize(1280, 720, { fit: 'cover' }).webp({ quality: 82 }).toFile(coversDir + 'wall-45.webp');
console.log('\n✅ 已生成 covers/wall-45.webp (1280x720)');
