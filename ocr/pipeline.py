from field_extractor import extract_fields
from smart_ocr import smart_ocr

def analyze_image(image_path):
    #1. Preprocess
    ocr_result = smart_ocr(image_path)

    #2. OCR
    ocr_text = ocr_result["ocr_text"]

    #3. Extract fields
    fields = extract_fields(ocr_text)

if __name__ == "__main__":
    result = analyze_image("sample-data/compliant/TataSalt.jpg")
    print(result)