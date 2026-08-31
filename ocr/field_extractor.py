import re


def extract_fields(ocr_text):
    """
    Extract the 8 Legal Metrology mandatory-declaration fields
    (Rule 6/9 scope) from one image's OCR blocks.
    """
    fields = {
        "mrp": None,
        "net_quantity": None,
        "manufacturer": None,
        "address": None,
        "date": None,
        "consumer_care": None,
        "country": None,
        "unit_price": None,
    }

    full_text = "\n".join(item["text"] for item in ocr_text)

    # MRP
    match = re.search(
        r"MRP\s*(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]+)?)",
        full_text, re.IGNORECASE
    )
    if match:
        fields["mrp"] = match.group(1)

    # NET QUANTITY
    match = re.search(
        r"Net\s*(?:Weight|Quantity|Wt\.?|Qty\.?)\s*[:\-]?\s*"
        r"([0-9]+(?:\.[0-9]+)?\s*(?:kgs?|gms?|grams?|litres?|liters?|ml|g|l))",
        full_text, re.IGNORECASE
    )
    if match:
        fields["net_quantity"] = match.group(1)

    # UNIT PRICE
    match = re.search(
        r"(?:Unit\s*Sale\s*Price|Price\s*per\s*(?:kg|g|litre|liter|unit))\s*[:\-]?\s*"
        r"(₹?\s*[0-9]+(?:\.[0-9]+)?\s*/\s*(?:kg|g|l|litre|unit))",
        full_text, re.IGNORECASE
    )
    if match:
        fields["unit_price"] = match.group(1)

    # DATE
    match = re.search(
        r"(?:Packing|Packed|MFD|Mfg\.?|Date\s*of\s*Mfg\.?|Use\s*by|Best\s*Before)\s*Date\s*[:\-]?\s*"
        r"([0-9]{1,2}[-/][A-Za-z0-9]{2,3}[-/][0-9]{2,4})",
        full_text, re.IGNORECASE
    )
    if match:
        fields["date"] = match.group(1)

    # COUNTRY
    match = re.search(
        r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of|Origin)\s*[:\-]?\s*([A-Za-z][A-Za-z ]{2,30})",
        full_text, re.IGNORECASE
    )
    if match:
        fields["country"] = match.group(1).strip()

    # CONSUMER CARE
    match = re.search(
        r"(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll[\s\-]?Free|Contact)\s*[:\-]?\s*"
        r"([\d\-\+\s]{8,15}|[\w.+-]+@[\w-]+\.[\w.-]+)",
        full_text, re.IGNORECASE
    )
    if match:
        fields["consumer_care"] = match.group(1).strip()

    # MANUFACTURER
    match = re.search(
        r"(?:Manufactured\s*by|Mfg\.?\s*by|Marketed\s*by|Packed\s*by)\s*[:\-]?\s*([A-Za-z0-9&.,\s]+?)(?:\.|,|\n|$)",
        full_text, re.IGNORECASE
    )
    if match:
        fields["manufacturer"] = match.group(1).strip()

    # ADDRESS — label-anchored, multi-block stitch
    address_labels = re.compile(
        r"(Manufactured\s*by|Mfg\.?\s*by|Marketed\s*by|Packed\s*by)",
        re.IGNORECASE
    )
    pincode_pattern = re.compile(r"\b\d{6}\b")
    non_address_pattern = re.compile(
        r"(e-?mail|website|www\.|@|toll[\s\-]?free|helpline|customer\s*care|consumer\s*care)",
        re.IGNORECASE
    )

    for i, item in enumerate(ocr_text):
        if address_labels.search(item["text"]):
            collected = [item["text"]]
            for j in range(i + 1, min(i + 5, len(ocr_text))):
                next_block = ocr_text[j]["text"]
                if non_address_pattern.search(next_block):
                    break
                collected.append(next_block)
                if pincode_pattern.search(next_block):
                    break
            fields["address"] = " ".join(collected).strip()
            break

    return fields