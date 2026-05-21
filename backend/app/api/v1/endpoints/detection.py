from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, Response
import httpx
import os
import logging

router = APIRouter()

# Pasta AI API URL - default to 127.0.0.1:8001 for better host-to-docker compatibility on Windows
PASTA_AI_API_URL = os.getenv("PASTA_AI_API_URL", "http://127.0.0.1:8001")

@router.post("/detect")
async def detect_pasta(request: Request, file: UploadFile = File(None), image: UploadFile = File(None), visualize: bool = False):
    """
    Forwards the image to the Pasta AI detection service and returns the results.
    """
    # Debug info
    form = await request.form()
    print(f"[DETECTION] Received form fields: {list(form.keys())}")
    
    upload_file = file or image
    if not upload_file:
        print("[DETECTION] Error: No file or image field found in request")
        raise HTTPException(status_code=422, detail="Missing 'file' or 'image' field")

    print(f"[DETECTION] Using field: {'file' if file else 'image'}")
    print(f"[DETECTION] Filename: {upload_file.filename}, type: {upload_file.content_type}")
    
    try:
        # Read the file content
        content = await upload_file.read()
        print(f"[DETECTION] File size: {len(content)} bytes")
        
        async with httpx.AsyncClient() as client:
            # Forward the request to the pasta-ai service
            files = {'file': (upload_file.filename, content, upload_file.content_type)}
            target_url = f"{PASTA_AI_API_URL}/detect"
            if visualize:
                target_url = f"{target_url}?visualize=true"
            print(f"[DETECTION] Forwarding to: {target_url}")

            import time as _time
            start = _time.perf_counter()
            response = await client.post(target_url, files=files, timeout=30.0)
            elapsed = _time.perf_counter() - start

            print(f"[DETECTION] AI Service responded with status: {response.status_code}")

            if response.status_code != 200:
                error_detail = response.text
                print(f"[DETECTION] AI Service Error: {error_detail}")
                raise HTTPException(status_code=response.status_code, detail=f"AI Service error: {error_detail}")

            content_type = response.headers.get("content-type", "")
            if content_type.startswith("image/"):
                # return image bytes unchanged (no JSON)
                return Response(content=response.content, media_type=content_type)

            # fallback to JSON: include processing_time so frontend can display it
            try:
                data = response.json()
                if isinstance(data, dict):
                    data.setdefault('processing_time', round(elapsed, 3))
                return JSONResponse(data)
            except Exception:
                return JSONResponse({"detail": response.text, "processing_time": round(elapsed, 3)})
            
    except httpx.RequestError as exc:
        print(f"[DETECTION] Connection Error: {exc}")
        logging.error(f"Error connecting to AI service: {exc}")
        raise HTTPException(status_code=503, detail=f"AI Service unavailable: {exc}")
    except Exception as e:
        import traceback
        print(f"[DETECTION] Unexpected Error: {e}")
        traceback.print_exc()
        logging.error(f"Unexpected error in detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))
