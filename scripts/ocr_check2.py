#!/usr/bin/env python3
"""批量 OCR 识别 hc550 剩余图片"""
import os, re, json
from rapidocr_onnxruntime import RapidOCR

ATT = "/opt/data/document/websites/Obsidian Vault/附件"
ocr = RapidOCR()

imgs = {
    "hc550_D": os.path.join(ATT, "屏幕截图 2024-12-15 123847.png"),
    "hc550_E": os.path.join(ATT, "Screenshot_20241216133032.jpg"),
    "hc550_F": os.path.join(ATT, "屏幕截图 2024-12-16 133707.png"),
    "hc550_G": os.path.join(ATT, "屏幕截图 2024-12-16 134134.png"),
    "hc550_H": os.path.join(ATT, "Pasted image 20241217112241.png"),
    "hc550_I": os.path.join(ATT, "Screenshot_20241218104314.jpg"),
    "hc550_J": os.path.join(ATT, "Pasted image 20241218105425.png"),
    "hc550_K": os.path.join(ATT, "Pasted image 20241218105220.png"),
    "hc550_L": os.path.join(ATT, "Screenshot_2024-12-15-12-52-07-117_com.xunmeng.pi.jpg"),
    "hc550_M": os.path.join(ATT, "qq_pic_merged_1734275794778.jpg"),
    "hc550_N": os.path.join(ATT, "屏幕截图 2024-12-15 231103.png"),
    "hc550_O": os.path.join(ATT, "屏幕截图 2024-12-15 231500.png"),
    "hc550_P": os.path.join(ATT, "Pasted image 20241218175618.png"),
    "hc550_Q": os.path.join(ATT, "Pasted image 20241218180225.png"),
    "hc550_C": os.path.join(ATT, "屏幕截图 2024-12-15 123100.png"),
    "hc550_B": os.path.join(ATT, "qq_pic_merged_1734275782544.jpg"),
}

SENS = [
    (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', 'IP地址'),
    (r'(https?://|ssh://|git@)[^\s]+', 'URL'),
    (r'(私钥|BEGIN [A-Z ]*PRIVATE KEY|secret|token|password|passwd|api[_-]?key)', '密钥/密码'),
    (r'1[3-9]\d{9}', '手机号'),
    (r'(地址[:：]|收货|身份证)', '个人信息'),
    (r'订单号|单号[:：]?\s*[A-Z0-9]+', '订单号'),
    (r'¥|￥|\d+\.\d{2}元', '价格'),
    (r'\b\d{6}\b', '6位数字'),
]

def check(txt):
    flags = set()
    for pat, label in SENS:
        if re.search(pat, txt, re.I):
            flags.add(label)
    return sorted(flags)

out = {}
for name, p in imgs.items():
    if not os.path.exists(p):
        print(f"{name}: 缺失")
        continue
    result, _ = ocr(p)
    text = "\n".join(line[1] for line in result) if result else "(无文字)"
    flags = check(text)
    out[name] = {"flags": flags, "text": text}
    print(f"### {name} [敏感: {flags or '无'}]")
    print(text[:500])
    print("---")

with open("/tmp/ocr_results2.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("done")
