"""
EasyOCR Runner Module for LegalCheck AI
Extracts text, bounding boxes, and confidence scores using PyTorch-backed EasyOCR.
Warnings are suppressed to keep stdout clean for JSON parsing by Node.js.
"""

import sys
import os
import json
import warnings

# CRITICAL: Suppress ALL warnings before any imports (prevents stdout pollution)
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

# Redirect stderr to devnull to prevent PyTorch deprecation warnings from polluting stdout
import io
_devnull = open(os.devnull, 'w', encoding='utf-8')

# Force UTF-8 on stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Redirect stderr to suppress PyTorch/EasyOCR warnings
sys.stderr = _devnull

# Global EasyOCR Reader instance
_reader = None

def get_reader():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _reader

def run_ocr(image_path):
    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": f"Image file not found: {image_path}",
            "rawText": "",
            "confidence": 0.0,
            "boxes": []
        }

    reader = get_reader()
    results = reader.readtext(image_path, canvas_size=1024)

    raw_text_lines = []
    boxes = []
    total_conf = 0.0
    count = 0

    for res in results:
        bbox_poly, text, conf = res
        text_str = str(text).strip()
        if not text_str:
            continue

        raw_text_lines.append(text_str)
        total_conf += float(conf)
        count += 1

        # Convert 4-point polygon [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] to [x, y, w, h]
        try:
            xs = [pt[0] for pt in bbox_poly]
            ys = [pt[1] for pt in bbox_poly]
            x_min = int(min(xs))
            y_min = int(min(ys))
            w = int(max(xs) - x_min)
            h = int(max(ys) - y_min)
            bbox = [x_min, y_min, w, h]
        except Exception:
            bbox = [40, 40, 400, 30]

        boxes.append({
            "field": "text_line",
            "text": text_str,
            "confidence": round(float(conf), 2),
            "bbox": bbox
        })

    avg_conf = round(total_conf / count, 2) if count > 0 else 0.0
    raw_text = "\n".join(raw_text_lines)

    return {
        "success": True,
        "rawText": raw_text,
        "confidence": avg_conf,
        "boxes": boxes
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    try:
        res = run_ocr(image_path)
        print(json.dumps(res, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "rawText": "", "confidence": 0.0, "boxes": []}))
