import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
const dir = '/opt/data/document/websites/壁纸';
const picks = [
  'R-C (1).jpg',
  'QQ图片20220208175437.jpg',
  '84690075_p0.jpg',
  'Image_1757771782940.jpg',
  'Image_1757771785045.jpg',
  'yxzyw0zx123z13x0w0zz3xx12y02zxzw.jpg',
  'd27bab16682d3a3befd4a3f0a7c5d0371cdddaf9_raw.jpg',
  'QQ图片20211001122220.png',
];
const ddir = 'public/assets/desktop-banner';
const mdir = 'public/assets/mobile-banner';
fs.mkdirSync(ddir, { recursive: true });
fs.mkdirSync(mdir, { recursive: true });
for (let i = 0; i < picks.length; i++) {
  const src = path.join(dir, picks[i]);
  const base = (i+1) + '.webp';
  // desktop 16:9 @1920
  await sharp(src).resize(1920, 1080, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 }).toFile(path.join(ddir, base));
  // mobile 9:19.5 @1080
  await sharp(src).resize(1080, 2340, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 }).toFile(path.join(mdir, base));
  console.log('ok', base, picks[i]);
}
const sizes = fs.readdirSync(ddir).map(f => `${f}: ${(fs.statSync(path.join(ddir,f)).size/1024).toFixed(0)}KB`);
console.log(sizes.join('\n'));
