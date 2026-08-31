from field_extractor import extract_fields
from smart_ocr import smart_ocr


def analyze_image(image_path):
    """Single-image analysis — unchanged, kept for backward compatibility
    with existing tests and scripts."""
    ocr_result = smart_ocr(image_path)
    ocr_text = ocr_result["ocr_text"]
    fields = extract_fields(ocr_text)

    return {
        "ocr_text": ocr_text,
        "used_preprocessing": ocr_result["used_preprocessing"],
        "fields": fields
    }


def analyze_images(image_paths):
    """
    Multi-image analysis. Runs OCR on each image separately, tags each
    OCR block with which image it came from (for debugging / traceability),
    then merges ALL blocks into one list before running extract_fields ONCE.

    Why merge before extraction, not after:
    Running extract_fields() per image and merging the resulting dicts
    creates silent overwrite bugs — whichever image is processed last
    wins for every field, regardless of which extraction was actually
    correct. Merging raw OCR blocks first means extract_fields() sees
    the full picture at once and applies its normal first-match logic
    across ALL panels together.
    """
    combined_ocr_text = []
    per_image_results = []

    for path in image_paths:
        ocr_result = smart_ocr(path)
        for block in ocr_result["ocr_text"]:
            block["source_image"] = path
        combined_ocr_text.extend(ocr_result["ocr_text"])
        # Insert a boundary sentinel so block-adjacency logic (like the
        # address stitching in extract_fields) never bleeds across
        # different images' OCR blocks.
        combined_ocr_text.append({"text": "", "confidence": 1.0, "bbox": [0,0,0,0], "source_image": None, "_boundary": True})
        per_image_results.append({...})

    fields = extract_fields(combined_ocr_text)

    return {
        "ocr_text": combined_ocr_text,
        "per_image_results": per_image_results,
        "fields": fields
    }


if __name__ == "__main__":
    import sys
    image_paths = sys.argv[1:] if len(sys.argv) > 1 else ["sample-data/compliant/toothpaste.jpg"]

    if len(image_paths) == 1:
        result = analyze_image(image_paths[0])
    else:
        result = analyze_images(image_paths)

    print(f"Images processed: {len(image_paths)}\n")
    for key, value in result["fields"].items():
        print(f"{key}: {value}")