#!/usr/bin/env node
// 批量转换补图：外链下载图 + 本地附件图 -> public/images/posts/<slug>/NN.webp
const sharp = require('/opt/data/workspace/blog/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const PUB = '/opt/data/workspace/blog/public/images/posts';
const TMP = '/tmp/blogimg';
const ATT = '/opt/data/document/websites/Obsidian Vault/附件';

// slug -> [{src, out}]
const jobs = {
  'proxmox-datacenter-manager-alpha': [
    { src: `${TMP}/proxmox_1`, out: '01' },
    { src: `${TMP}/proxmox_2`, out: '02' },
  ],
  'deepseek-r1-paper-reading': [
    { src: `${TMP}/r1_x1`, out: '01' },
    { src: `${TMP}/r1_aime`, out: '02' },
    { src: `${TMP}/r1_len`, out: '03' },
  ],
  'cet6-exam-prep': [
    { src: `${TMP}/zh_0`, out: '01' },
    { src: `${TMP}/zh_1`, out: '02' },
    { src: `${TMP}/zh_2`, out: '03' },
    { src: `${TMP}/zh_3`, out: '04' },
    { src: `${TMP}/zh_4`, out: '05' },
    { src: `${TMP}/zh_5`, out: '06' },
    { src: `${TMP}/zh_6`, out: '07' },
  ],
  'gigabyte-x170-extreme-ecc': [
    { src: `${TMP}/gig_1`, out: '01' },
    { src: `${TMP}/gig_2`, out: '02' },
    { src: `${TMP}/gig_3`, out: '03' },
    { src: `${TMP}/gig_4`, out: '04' },
  ],
  'asrock-c236-wsi': [
    { src: `${TMP}/c236_1`, out: '01' },
    { src: `${TMP}/c236_2`, out: '02' },
    { src: `${TMP}/c236_3`, out: '03' },
    { src: `${TMP}/c236_4`, out: '04' },
  ],
  'asus-p10s-ws-c236-nas-board': [
    { src: `${TMP}/hdslb`, out: '02' },
  ],
  'dachuang-llm-optimization-project': [
    { src: `${ATT}/Pasted image 20250131145131.png`, out: '01' },
    { src: `${ATT}/Pasted image 20250131152207.png`, out: '02' },
  ],
  'inspection-robot-project-retro': [
    { src: `${ATT}/train_batch1142_1.jpg`, out: '01' },
    { src: `${ATT}/val_batch0_labels.jpg`, out: '02' },
    { src: `${ATT}/BoxPR_curve.png`, out: '03' },
    { src: `${ATT}/confusion_matrix.png`, out: '04' },
    { src: `${ATT}/results.png`, out: '05' },
    { src: `${ATT}/val_batch0_pred.jpg`, out: '06' },
  ],
  'traffic-sign-recognition': [
    { src: `${ATT}/BH%SXM%E)[C7LZVG6%D(R(X.png`, out: '05' },
  ],
};

(async () => {
  let total = 0, fail = 0;
  for (const [slug, items] of Object.entries(jobs)) {
    const dir = path.join(PUB, slug);
    fs.mkdirSync(dir, { recursive: true });
    for (const it of items) {
      const src = it.src;
      const outPath = path.join(dir, `${it.out}.webp`);
      if (!fs.existsSync(src)) { console.log(`MISSING ${src}`); fail++; continue; }
      try {
        const img = sharp(src, { failOn: 'none' });
        const meta = await img.metadata();
        // 正文图：限宽 1600，保持比例；svg 直接转
        let pipeline = img.rotate();
        if (meta.width > 1600) {
          pipeline = pipeline.resize({ width: 1600 });
        }
        await pipeline.webp({ quality: 82 }).toFile(outPath);
        const sz = fs.statSync(outPath).size;
        console.log(`OK ${slug}/${it.out}.webp ${meta.width}x${meta.height} -> ${Math.round(sz/1024)}KB`);
        total++;
      } catch (e) {
        console.log(`FAIL ${src}: ${e.message}`);
        fail++;
      }
    }
  }
  console.log(`\nDone: ${total} converted, ${fail} failed`);
})();
