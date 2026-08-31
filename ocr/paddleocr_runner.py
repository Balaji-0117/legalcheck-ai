"""
PaddleOCR Runner Module for LegalCheck AI
Primary OCR Engine: Uses Baidu PP-OCR v4 / PaddleOCR models via RapidOCR ONNX runtime.
Outputs clean JSON to stdout for Node.js consumption.
"""

import sys
import os
import json
import warnings

# Suppress all warnings and redirect stderr
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
_devnull = open(os.devnull, 'w', encoding='utf-8')
sys.stderr = _devnull

_engine = None

def get_engine():
    global _engine
    if _engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _engine = RapidOCR()
        except Exception as e:
            try:
                from paddleocr import PaddleOCR
                _engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except Exception as e2:
                _engine = None
    return _engine

def run_ocr(image_path):
    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": f"Image file not found: {image_path}",
            "rawText": "",
            "confidence": 0.0,
            "boxes": []
        }

    engine = get_engine()
    if engine is None:
        return {
            "success": False,
            "error": "PaddleOCR engine unavailable",
            "rawText": "",
            "confidence": 0.0,
            "boxes": []
        }

    try:
        raw_text_lines = []
        boxes = []
        total_conf = 0.0
        count = 0

        # RapidOCR execution
        if hasattr(engine, '__call__'):
            results, elapse_list = engine(image_path)
            if results:
                for item in results:
                    bbox_pts, text, score = item
                    text_str = str(text).strip()
                    if not text_str:
                        continue

                    conf = float(score) if score is not None else 0.85
                    raw_text_lines.append(text_str)
                    total_conf += conf
                    count += 1

                    try:
                        xs = [pt[0] for pt in bbox_pts]
                        ys = [pt[1] for pt in bbox_pts]
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
                        "confidence": round(conf, 2),
                        "bbox": bbox
                    })

        avg_conf = round(total_conf / count, 2) if count > 0 else 0.0
        raw_text = "\n".join(raw_text_lines)

        return {
            "success": True,
            "rawText": raw_text,
            "confidence": avg_conf,
            "boxes": boxes,
            "engine": "PaddleOCR"
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
    res = run_ocr(image_path)
    print(json.dumps(res, ensure_ascii=False))
