
def check_readability(item, min_height_px=15, min_confidence=0.60):
    """
    Checks a single OCR text block for readability concerns.

    Args:
        item: dict with keys "text", "confidence", "box" ([x1, y1, x2, y2])
        min_height_px: minimum bounding-box height (in pixels) considered
            comfortably legible in the processed image. Tune this against
            your preprocessing scale (you upscale 2x, so real minimum
            printed height is roughly half this value).
        min_confidence: OCR confidence below this is treated as a signal
            the text may be unclear, blurry, or too small — not just a
            model quirk.

    Returns:
        dict: {
            "text": ...,
            "confidence": ...,
            "box": ...,
            "height_px": ...,
            "readability": "ok" | "low_readability",
            "reason": short explanation, only present when flagged
        }
    """
    box = item["bbox"]
    height_px = box[3] - box[1]  # y2 - y1

    reasons = []
    if height_px < min_height_px:
        reasons.append(f"text height {height_px}px below threshold {min_height_px}px")
    if item["confidence"] < min_confidence:
        reasons.append(f"OCR confidence {item['confidence']:.2f} below threshold {min_confidence}")

    result = {
        "text": item["text"],
        "confidence": item["confidence"],
        "bbox": box,
        "height_px": height_px,
        "readability": "low_readability" if reasons else "ok"
    }

    if reasons:
        result["reason"] = "; ".join(reasons)

    return result


def check_all_readability(ocr_text, min_height_px=15, min_confidence=0.60):
   
    results = [
        check_readability(item, min_height_px, min_confidence)
        for item in ocr_text
    ]

    flagged = [r for r in results if r["readability"] == "low_readability"]

    return {
        "blocks": results,
        "total_blocks": len(results),
        "flagged_count": len(flagged),
        "flagged_blocks": flagged
    }


if __name__ == "__main__":
    # Quick manual test
    from test_ocr import run_ocr

    result = run_ocr("sample-data/compliant/milkpacket.jpg")
    readability = check_all_readability(result)

    print(f"Total blocks: {readability['total_blocks']}")
    print(f"Flagged as low readability: {readability['flagged_count']}\n")

    for block in readability["flagged_blocks"]:
        print(f"- \"{block['text']}\"  ({block['reason']})")