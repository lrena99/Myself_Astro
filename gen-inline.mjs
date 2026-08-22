// 生成正文配图 02.webp / 03.webp
import sharp from 'sharp';

const outDir = 'public/images/posts/rk3588-local-kb/';
const picks = [
  ['/opt/data/document/websites/壁纸/2021-10-06-13-03-42.jpg', '02.webp'],
  ['/opt/data/document/websites/壁纸/3C70F8B40DACBD03FF4A0520AA622DF8.jpg', '03.webp'],
];
for (const [src, out] of picks) {
  await sharp(src).resize(1280, 720, { fit: 'cover' }).webp({ quality: 82 }).toFile(outDir + out);
  console.log('OK ->', outDir + out);
}
