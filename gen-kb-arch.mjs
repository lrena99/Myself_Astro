// 转换架构图 SVG -> webp
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const outDir = 'public/images/posts/rk3588-local-kb';
mkdirSync(outDir, { recursive: true });

await sharp('kb_arch.svg', { density: 150 })
  .resize(1280, 720, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .webp({ quality: 85 })
  .toFile(`${outDir}/01.webp`);
console.log('OK ->', `${outDir}/01.webp`);
