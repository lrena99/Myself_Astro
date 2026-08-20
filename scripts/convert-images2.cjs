#!/usr/bin/env node
// 转换 OCR 确认安全的图
const sharp = require('/opt/data/workspace/blog/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const PUB = '/opt/data/workspace/blog/public/images/posts';
const ATT = '/opt/data/document/websites/Obsidian Vault/附件';

const jobs = {
  'headscale-derp-selfhost-guide': [
    { src: `${ATT}/Pasted image 20241218003449.png`, out: '02' },
    { src: `${ATT}/Pasted image 20241218014948.png`, out: '03' },
    { src: `${ATT}/Pasted image 20241218004834.png`, out: '04' },
    { src: `${ATT}/Pasted image 20241218004910.png`, out: '05' },
  ],
  'hc550-hdd-haul': [
    { src: `${ATT}/qq_pic_merged_1734275782544.jpg`, out: '13' },
    { src: `${ATT}/qq_pic_merged_1734275794778.jpg`, out: '14' },
    { src: `${ATT}/IMG_20241218_181317.jpg`, out: '15' },
    { src: `${ATT}/屏幕截图 2024-12-15 231103.png`, out: '16' },
    { src: `${ATT}/Pasted image 20241217112241.png`, out: '17' },
  ],
};

(async () => {
  for (const [slug, items] of Object.entries(jobs)) {
    const dir = path.join(PUB, slug);
    fs.mkdirSync(dir, { recursive: true });
    for (const it of items) {
      const outPath = path.join(dir, `${it.out}.webp`);
      try {
        const img = sharp(it.src, { failOn: 'none' }).rotate();
        const meta = await img.metadata();
        let pipeline = img;
        if (meta.width > 1600) pipeline = pipeline.resize({ width: 1600 });
        await pipeline.webp({ quality: 82 }).toFile(outPath);
        console.log(`OK ${slug}/${it.out}.webp ${meta.width}x${meta.height}`);
      } catch (e) {
        console.log(`FAIL ${it.src}: ${e.message}`);
      }
    }
  }
  console.log('done');
})();
