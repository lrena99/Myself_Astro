#!/usr/bin/env python3
"""OCR 检查 hc550 三张 IMG_* 实物照片"""
import os, re
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

ATT = "/opt/data/document/websites/Obsidian Vault/附件"
ocr = RapidOCR()

imgs = {
    "IMG_181317": os.path.join(ATT, "IMG_20241218_181317.jpg"),
    "IMG_181501": os.path.join(ATT, "IMG_20241218_181501.jpg"),
    "IMG_172434": os.path.join(ATT, "IMG_20241218_172434.jpg"),
}
for name, p in imgs.items():
    if not os.path.exists(p):
        print(f"{name}: 缺失")
        continue
    try:
        im = Image.open(p)
        print(f"{name}: {im.size} {im.format}")
        result, _ = ocr(p)
        text = "\n".join(line[1] for line in result) if result else "(无文字/纯照片)"
        print(f"  OCR: {text[:300]}")
    except Exception as e:
        print(f"{name}: ERROR {str(e)[:100]}")
