from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

from smart_ocr import smart_ocr
from field_extractor import extract_fields

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def merge_fields(per_image_fields):
    """
    per_image_fields: list of (filename, fields_dict, avg_confidence)
    Merge rule: if only one image has a value for a field, use it.
    If multiple images disagree, keep the higher-confidence one and
    record the conflict instead of silently discarding it.
    """
    merged = {}
    conflicts = {}

    all_keys = per_image_fields[0][1].keys() if per_image_fields else []

    for key in all_keys:
        candidates = [
            (filename, fields[key], conf)
            for filename, fields, conf in per_image_fields
            if fields.get(key) is not None
        ]

        if not candidates:
            merged[key] = None
        elif len(candidates) == 1:
            merged[key] = candidates[0][1]
        else:
            distinct_values = set(c[1] for c in candidates)
            if len(distinct_values) == 1:
                merged[key] = candidates[0][1]  # all agree
            else:
                # disagreement — pick highest confidence, but log it
                best = max(candidates, key=lambda c: c[2])
                merged[key] = best[1]
                conflicts[key] = [
                    {"filename": c[0], "value": c[1], "confidence": c[2]}
                    for c in candidates
                ]

    return merged, conflicts


@app.post("/analyze")
async def analyze(files: list[UploadFile] = File(...)):
    os.makedirs("uploads", exist_ok=True)
    per_image_results = []
    per_image_fields = []

    for file in files:
        image_path = f"uploads/{file.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        ocr_result = smart_ocr(image_path)
        blocks = ocr_result["ocr_text"]

        raw_text = "\n".join(item["text"] for item in blocks)
        avg_confidence = (
            sum(item["confidence"] for item in blocks) / len(blocks)
            if blocks else 0.0
        )

        fields = extract_fields(blocks)

        per_image_results.append({
            "filename": file.filename,
            "rawText": raw_text,
            "confidence": round(avg_confidence, 2)
        })
        per_image_fields.append((file.filename, fields, avg_confidence))

    merged_fields, conflicts = merge_fields(per_image_fields)

    return {
        "images": per_image_results,
        "fields": merged_fields,
        "conflicts": conflicts  # empty dict if nothing disagreed
    }