from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from app.api.dependencies.deps import get_current_user
from app.models.user import User
import os
import uuid
import shutil
import re

router = APIRouter()

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("/")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image file and return a persistent server URL.

    IMPORTANT: Never pass blob: URLs here — they are browser-local object URLs
    that expire when the session ends. Always upload the actual file binary.
    The returned URL is a permanent /static/... path served by the backend.
    """
    # Relaxed check: allow images and common document types
    allowed_types = {"image/", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument"}
    is_allowed = any(file.content_type.startswith(t) for t in allowed_types) if file.content_type else False
    
    if not is_allowed:
        # If content_type is missing or not in list, check extension
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in {"pdf", "doc", "docx", "txt", "xls", "xlsx"}:
            raise HTTPException(status_code=400, detail="Unsupported file type")

    # Read content with size guard
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
        )

    # Sanitize filename: replace illegal characters (especially for Windows like :)
    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename or 'upload')
    filename = f"{uuid.uuid4()}_{safe_filename}"
    # Use a generic 'files' folder for non-image documents to keep things organized
    is_image = file.content_type and file.content_type.startswith("image/")
    folder = "events" if is_image else "documents"
    filepath = os.path.join("uploads", folder, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    try:
        with open(filepath, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    # Build a full absolute URL so clients don't need to know the server address
    base_url = str(request.base_url).rstrip("/")
    return {
        "url": f"{base_url}/static/{folder}/{filename}",
        "path": f"/static/{folder}/{filename}",
    }

