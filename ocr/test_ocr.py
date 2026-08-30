import os
from field_extractor import extract_fields

# Disable oneDNN/MKLDNN CPU acceleration
os.environ["PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT"] = "0"

from paddleocr import PaddleOCR


# Create the OCR engine
ocr = PaddleOCR()


def run_ocr(image_path):

    # Run OCR on the given image
    result = ocr.predict(image_path)

    ocr_text = []

    # Extract text, confidence and bounding boxes
    for res in result:

        for text, score, box in zip(
            res["rec_texts"],
            res["rec_scores"],
            res["rec_boxes"]
        ):

            ocr_text.append({
                "text": text,
                "confidence": float(score),
                "bbox": box.tolist()
            })

    return ocr_text

if __name__ == "__main__":
    result = run_ocr("sample-data/compliant/milkpacket.jpg")

    print("\n======== OCR RESULT ========\n")

    for item in result:
        print(item)

    fields = extract_fields(result)
    for key, value in fields.items():
        print(f"{key}: {value}")

