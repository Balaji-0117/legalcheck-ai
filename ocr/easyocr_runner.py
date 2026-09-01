"""
EasyOCR Runner Module for LegalCheck AI
Extracts text, bounding boxes, and confidence scores using PyTorch-backed EasyOCR.
"""

import sys
import os
import json
import warnings

warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"
os.environ["QT_QPA_PLATFORM"] = "offscreen"

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

_reader = None

def get_reader():
    global _reader
    if _reader is None:
        try:
            import easyocr
            _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            _reader = None
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

    try:
        reader = get_reader()
        if reader is None:
            return {
                "success": False,
                "error": "EasyOCR could not be initialized",
                "rawText": "",
                "confidence": 0.0,
                "boxes": []
            }

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
            "boxes": boxes,
            "engine": "EasyOCR"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "rawText": "",
            "confidence": 0.0,
            "boxes": []
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
