// 复制笔记图片到博客 + 转 webp 压缩；挑壁纸做封面池
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const vault = '/opt/data/document/websites/Obsidian Vault';
const att = path.join(vault, '附件');
const blog = '/opt/data/workspace/blog';
const imgDir = path.join(blog, 'public/images/posts');
const coverDir = path.join(blog, 'public/images/covers');

// slug -> 图片清单
const plan = {
  'debian-live-cd-notes': ['Pasted image 20250119224500.png', 'Pasted image 20250119225430.png', 'Pasted image 20250119225444.png'],
  'r730xd-boot-stuck-fix': ['Pasted image 20250118194608.png', 'Pasted image 20250119223533.png', 'Pasted image 20250119222456.png', 'Pasted image 20250119222546.png'],
  'debian12-install-pve': ['Pasted image 20250121011359.png'],
  'debian-media-box': ['box_all (2).jpg', 'instruction (2).jpg', 'inspiration (2).jpg'],
  'asus-p10s-ws-c236-nas-board': ['Pasted image 20241217120446.png'],
  'asrock-z370-pro4': ['Z370 Pro4(M1).png', 'image.png'],
  'my-nas-all-in-one': ['Pasted image 20241221144403.png', 'Pasted image 20241217024049.png', 'IMG_20241219_002232.jpg', 'IMG_20241219_010853.jpg', 'Pasted image 20241221145859.png', 'Pasted image 20241221145952.png'],
  'hc550-hdd-haul': ['IMG_20241218_181317.jpg', 'Pasted image 20241217112241.png', 'IMG_20241218_181501.jpg', 'Pasted image 20241218105425.png', 'Pasted image 20241218105220.png', 'IMG_20241218_172434.jpg'],
  'ssd-inventory': ['IMG_20241209_170328.jpg', 'IMG_20241218_173112.jpg', 'IMG_20241218_172404.jpg', 'Pasted image 20241218173428.png', 'Pasted image 20241218174548.png'],
  'hitachi-12tb': ['IMG_20241223_174401.jpg', 'IMG_20241224_125248.jpg', 'Pasted image 20241223180443.png', 'Pasted image 20241223180615.png', 'Pasted image 20241223180644.png', 'Pasted image 20241224124933.png'],
  'hc530': ['IMG_20250116_055338.jpg', 'Pasted image 20250116062126.png', 'Pasted image 20250116062144.png', 'Pasted image 20250117165914.png', 'Pasted image 20250117165932.png'],
  'smart-home-robot-mcp-ai-vtuber': ['CR11u_20250213_145435295.jpg', 'Pasted image 20250414084728.png', 'Pasted image 20250416140949.png'],
  'yolov11-mamba-pipe-defect-detection': ['train_batch1142_1.jpg', 'val_batch0_labels 1.jpg', 'x1 (1).png', 'Pasted image 20251211145311.png', 'Pasted image 20251211144808.png', 'Pasted image 20251211144822.png', 'Pasted image 20251211145326.png'],
  'anatomask-deploy-and-training': ['Pasted image 20250427160232.png', 'Pasted image 20250428070938.png', 'Pasted image 20250428155500.png', 'Pasted image 20250428163429.png', 'Pasted image 20250428165030.png', 'Pasted image 20250428164613.png'],
  'quant-distill-rl-llm-optimization': ['Pasted image 20250131145131.png', 'Pasted image 20250131152207.png'],
};

let done = 0, fail = 0;
for (const [slug, files] of Object.entries(plan)) {
  const outDir = path.join(imgDir, slug);
  fs.mkdirSync(outDir, { recursive: true });
  let i = 0;
  for (const f of files) {
    const src = path.join(att, f);
    if (!fs.existsSync(src)) { console.log(`  !! 缺失: ${f}`); fail++; continue; }
    i++;
    const ext = path.extname(f).toLowerCase();
    const outName = `${String(i).padStart(2, '0')}.webp`;
    try {
      await sharp(src, { limitInputPixels: false })
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(outDir, outName));
      done++;
    } catch (e) {
      // 大图重试（超像素限制）
      try {
        await sharp(src, { limitInputPixels: false })
          .resize(1200, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(outDir, outName));
        done++;
      } catch (e2) { console.log(`  !! 转换失败 ${f}: ${e2.message.slice(0, 60)}`); fail++; }
    }
  }
  console.log(`${slug}: ${i} 张 -> ${done}`);
}

// 壁纸封面池：从壁纸文件夹挑 16:9 高分辨率，转 webp 1280 宽
const wallDir = '/opt/data/document/websites/壁纸';
const exclude = /屏幕截图|upscayl|freecompress|汉化组|星空列车|千恋|@1036w/i;
const candidates = fs.readdirSync(wallDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !exclude.test(f));
const metas = [];
for (const f of candidates) {
  try { metas.push({ f, ...await sharp(path.join(wallDir, f), { limitInputPixels: false }).metadata() }); } catch {}
}
const picks = metas.filter(m => m.width >= 1920 && m.width >= m.height)
  .sort((a, b) => (b.width / b.height) - (a.width / a.height))
  .filter(m => { const r = m.width / m.height; return r >= 1.5 && r <= 2.0; })
  .slice(0, 12);
fs.mkdirSync(coverDir, { recursive: true });
let ci = 0;
for (const m of picks) {
  ci++;
  await sharp(path.join(wallDir, m.f), { limitInputPixels: false })
    .resize(1280, 720, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toFile(path.join(coverDir, `cover-${String(ci).padStart(2, '0')}.webp`));
  console.log(`cover-${String(ci).padStart(2, '0')}.webp <- ${m.f} (${m.width}x${m.height})`);
}
console.log(`\n完成: 图片 ${done} 张, 失败 ${fail}, 封面 ${ci} 张`);
