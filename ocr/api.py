from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import json

from smart_ocr import smart_ocr
from field_extractor import extract_fields
from readability_check import check_all_readability

app = FastAPI()

# Allows Lavanya's frontend (running on a different port, e.g. localhost:3000)
# to call this API during development. Without this, the browser blocks the request.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # fine for hackathon dev; tighten later if needed
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # 1. Save the uploaded image to disk
    os.makedirs("uploads", exist_ok=True)
    image_path = f"uploads/{file.filename}"
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Run your existing pipeline on it
    ocr_result = smart_ocr(image_path)
    ocr_text = ocr_result["ocr_text"]
    fields = extract_fields(ocr_text)
    readability = check_all_readability(ocr_text)

    # 3. Return JSON — this is what Lavanya's frontend receives
    response = {
        "product_image": file.filename,
        "used_preprocessing": ocr_result["used_preprocessing"],
        "ocr": ocr_text,
        "fields": fields,
        "readability": readability
    }
    # Save a per-image copy AND update the "latest" file
    contracts_dir = "../docs/contracts"
    os.makedirs(contracts_dir, exist_ok=True)

    # unique filename based on the uploaded image name
    safe_name = os.path.splitext(file.filename)[0]
    with open(f"{contracts_dir}/sample-{safe_name}.json", "w", encoding="utf-8") as f:
        json.dump(response, f, indent=2, ensure_ascii=False)

    # also keep one "latest" copy for convenience
    with open(f"{contracts_dir}/sample-fields-output-latest.json", "w", encoding="utf-8") as f:
        json.dump(response, f, indent=2, ensure_ascii=False)

    return response