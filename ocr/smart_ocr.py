"""
Day 3 improvement - Smart OCR with fallback.

Runs OCR on the RAW image first (PaddleOCR's own models are often strong
enough on good-quality photos). Only falls back to the heavier preprocessing
pipeline (upscale/CLAHE/threshold) if raw confidence looks poor — since
preprocessing can sometimes hurt clean images as much as it helps blurry ones.
"""

from preprocess import preprocess_image
from test_ocr import run_ocr


def _average_confidence(ocr_results):
    if not ocr_results:
        return 0.0
    return sum(r["confidence"] for r in ocr_results) / len(ocr_results)


def smart_ocr(image_path, confidence_threshold=0.75, min_blocks=3):
    """
    Runs OCR on the raw image. If the result looks weak (low average
    confidence, or suspiciously few text blocks detected), retries using
    the preprocessed version instead.

    Returns:
        {
            "ocr_text": [...],           # the OCR results actually used
            "used_preprocessing": bool,  # which path was taken
            "raw_avg_confidence": float,
            "final_avg_confidence": float
        }
    """
    raw_results = run_ocr(image_path)
    raw_avg_conf = _average_confidence(raw_results)

    needs_fallback = (
        raw_avg_conf < confidence_threshold
        or len(raw_results) < min_blocks
    )

    if not needs_fallback:
        return {
            "ocr_text": raw_results,
            "used_preprocessing": False,
            "raw_avg_confidence": raw_avg_conf,
            "final_avg_confidence": raw_avg_conf
        }

    # Raw OCR looked weak — try the preprocessed version instead
    processed_path = preprocess_image(image_path)
    processed_results = run_ocr(processed_path)
    processed_avg_conf = _average_confidence(processed_results)

    # Use whichever actually performed better, in case preprocessing
    # also fails to improve things
    if processed_avg_conf >= raw_avg_conf:
        return {
            "ocr_text": processed_results,
            "used_preprocessing": True,
            "raw_avg_confidence": raw_avg_conf,
            "final_avg_confidence": processed_avg_conf
        }
    else:
        return {
            "ocr_text": raw_results,
            "used_preprocessing": False,
            "raw_avg_confidence": raw_avg_conf,
            "final_avg_confidence": raw_avg_conf
        }


if __name__ == "__main__":
    import sys
    image_path = sys.argv[1] if len(sys.argv) > 1 else "sample-data/compliant/TataSalt.jpg"

    result = smart_ocr(image_path)
    print(f"Used preprocessing: {result['used_preprocessing']}")
    print(f"Raw avg confidence: {result['raw_avg_confidence']:.3f}")
    print(f"Final avg confidence: {result['final_avg_confidence']:.3f}")
    print(f"Blocks detected: {len(result['ocr_text'])}")