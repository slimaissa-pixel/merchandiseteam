import base64
import os
import uuid
from typing import Optional

def save_base64_image(image_data: str, folder: str = "general") -> Optional[str]:
    """
    Decodes a base64 image string and saves it to the uploads directory.
    Returns the static URL path to the image.
    """
    if not image_data:
        return None
        
    # If it's already a URL (e.g. from static/ or http), return as is
    if image_data.startswith("/static") or image_data.startswith("http"):
        return image_data

    # Check if it's a valid base64 image string
    if not image_data.startswith("data:image"):
        return None
        
    try:
        header, encoded = image_data.split(",", 1)
        ext = header.split(";")[0].split("/")[1]
        
        # Standardize extensions
        if "jpeg" in ext: ext = "jpg"
        
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join("uploads", folder, filename)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))
            
        return f"/static/{folder}/{filename}"
    except Exception as e:
        print(f"Error saving base64 image: {e}")
        return None
