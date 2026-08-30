import re
 
 
def extract_fields(ocr_text):
    fields = {
        "product_name": None,
        "manufacturer": None,
        "address": None,
        "country_of_origin": None,
        "net_quantity": None,
        "manufacturing_date": None,
        "unit_price": None,
        "best_before": None,
        "mrp": None,
        "consumer_care": None,
        "batch_no": None,
        "fssai_no": None,
        "ingredients": None
    }
 
    full_text = "\n".join(item["text"] for item in ocr_text)
 
    # PRODUCT NAME
    if ocr_text:
        fields["product_name"] = ocr_text[0]["text"]
 
       # BATCH NUMBER — search per-block, not the joined blob (prevents cross-line bleed)
    for item in ocr_text:
        match = re.search(
            r"Batch\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Za-z0-9]{4,})",
            item["text"], re.IGNORECASE
        )
        if match:
            fields["batch_no"] = match.group(1)
            break
 
    # NET QUANTITY
    match = re.search(
        r"Net\s*(?:Weight|Quantity|Wt\.?|Qty\.?)\s*[:\-]?\s*"
        r"([0-9]+(?:\.[0-9]+)?\s*(?:kgs?|gms?|grams?|litres?|liters?|ml|g|l))",
        full_text, re.IGNORECASE
    )
    if match:
        fields["net_quantity"] = match.group(1)
 
    # MANUFACTURING DATE
    match = re.search(
        r"(?:Packing|Packed|MFD|Mfg\.?)\s*Date\s*[:\-]?\s*"
        r"([0-9]{1,2}[-/][A-Za-z0-9]{2,3}[-/][0-9]{2,4})",
        full_text, re.IGNORECASE
    )
    if match:
        fields["manufacturing_date"] = match.group(1)
 
    # BEST BEFORE
    match = re.search(
        r"Best\s*Before\s*[:\-]?\s*([0-9]+\s*(?:Days?|Months?|Years?))",
        full_text, re.IGNORECASE
    )
    if match:
        fields["best_before"] = match.group(1)
 
    # MRP
    match = re.search(
        r"MRP\s*(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]+)?)",
        full_text, re.IGNORECASE
    )
    if match:
        fields["mrp"] = match.group(1)
 
    # FSSAI NUMBER (14 = real format, 10 = fallback for test labels)
    match = re.search(
        r"FSSAI\s*(?:No\.?|Number)?\s*[:\-]?\s*(\d{14}|\d{10})",
        full_text, re.IGNORECASE
    )
    if match:
        fields["fssai_no"] = match.group(1)
 
    # COUNTRY OF ORIGIN
    match = re.search(
        r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of|Origin)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{2,30})",
        full_text, re.IGNORECASE
    )
    if match:
        fields["country_of_origin"] = match.group(1).strip()
 
    # MANUFACTURER  (fixed: was being written to "manufacturer_name", a key
    # that didn't exist in the dict, so this field was always None before)
    match = re.search(
        r"(?:Manufactured\s*by|Mfg\.?\s*by|Marketed\s*by|Packed\s*by)\s*[:\-]?\s*([A-Za-z0-9&.,\s]+?)(?:\.|,|\n|$)",
        full_text, re.IGNORECASE
    )
    if match:
        fields["manufacturer"] = match.group(1).strip()

        # UNIT PRICE
    match = re.search(
        r"(?:Unit\s*Sale\s*Price|Price\s*per\s*(?:kg|g|litre|liter|unit))\s*[:\-]?\s*"
        r"(₹?\s*[0-9]+(?:\.[0-9]+)?\s*/\s*(?:kg|g|l|litre|unit))",
        full_text, re.IGNORECASE
    )
    if match:
        fields["unit_price"] = match.group(1)
 
    # ADDRESS  (fixed: was being written to "manufacturer_address", same issue)
    for item in ocr_text:
        match = re.search(r"([A-Za-z0-9,.\-\s]{10,100}\b\d{6}\b)", item["text"])
        if match:
            fields["address"] = match.group(1).strip()
            break
 
    # CONSUMER CARE (phone or email)
    match = re.search(
        r"(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll[\s\-]?Free|Contact)\s*[:\-]?\s*"
        r"([\d\-\+\s]{8,15}|[\w.+-]+@[\w-]+\.[\w.-]+)",
        full_text, re.IGNORECASE
    )
    if match:
        fields["consumer_care"] = match.group(1).strip()
 
    # INGREDIENTS
    match = re.search(r"(?:Ingredients?|Contains?)\s*[:\-]?\s*(.+)", full_text, re.IGNORECASE)
    if match:
        fields["ingredients"] = match.group(1).strip()
    else:
        for item in ocr_text:
            text = item["text"].strip()
            if ("," in text or "." in text) and not re.search(
                r"^(Batch|Net Weight|Net Quantity|Packing|Packed|MFD|Mfg|Best Before|MRP|FSSAI)",
                text, re.IGNORECASE
            ):
                fields["ingredients"] = text
                break
 
    return fields
 
