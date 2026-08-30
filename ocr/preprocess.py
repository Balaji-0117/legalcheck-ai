import cv2
import os

def preprocess_image(input_path):
    #Load the original image

    image = cv2.imread(input_path)

    if image is None:
        raise FileNotFoundError(f"Could not load image: {input_path}")

    #Build an output path derived from input filename
    os.makedirs("sample-data/preprocessed", exist_ok=True)
    filename = os.path.basename(input_path)
    name, _ = os.path.splitext(filename)
    output_path = f"sample-data/preprocessed/{name}.jpg"
    #1. UPSCALE

    scale = 2

    resized =cv2.resize(
        image,
        None,
        fx=scale,
        fy=scale,
        interpolation=cv2.INTER_CUBIC
    )

    #2. CONVERT TO GRAYSCALE
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

    #3. CONTRAST ENHANCEMENT
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize = (8,8)
    )
    enhanced = clahe.apply(gray)
    #4. NOISE REDUCTION
    denoised = cv2.GaussianBlur(
        enhanced,
        (3, 3),
        0
    )

    #5. ADAPTIVE THRESHOLD
    threshold = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11
    )

    #save

    cv2.imwrite(
        output_path,
        threshold
    )

    print("Advanced preprocessing complete")
    print(f"Saved as {output_path}")

    return output_path
