// 扫描壁纸库, 挑 16:9 高分辨率候选
import sharp from 'sharp';
import { readdirSync } from 'fs';

const dir = '/opt/data/document/websites/壁纸/';
const files = readdirSync(dir);
const bad = /屏幕截图|upscayl|freecompress|汉化组|星空列车|千恋|CUT|yourname|东方|初音|linux|web-dynamic|@/;
const cands = [];

for (const f of files) {
  if (bad.test(f)) continue;
  try {
    const meta = await sharp(dir + f).metadata();
    const { width, height, format } = meta;
    if (!width || !height) continue;
    const r = width / height;
    // 横版 16:9 附近 (1.5~2.0), 宽 >= 1280
    if (r >= 1.5 && r <= 2.0 && width >= 1280) {
      cands.push({ f, width, height, r: r.toFixed(2), format });
    }
  } catch {}
}
cands.sort((a, b) => b.width * b.height - a.width * a.height);
console.log(`候选 ${cands.length} 张:`);
cands.slice(0, 20).forEach((c, i) => console.log(`${i + 1}. ${c.f} (${c.width}x${c.height} ${c.format} r=${c.r})`));
