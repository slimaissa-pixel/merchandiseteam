from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Body, FastAPI, File, HTTPException, Query, UploadFile

from retail_detector import (
    DEFAULT_CONFIDENCE,
    DEFAULT_IMAGE_SIZE,
    detect_image_bytes,
    health_data,
    product_catalog_data,
)


app = FastAPI(
    title="Smart Retail Detection API",
    description="Detect shelf products with YOLOv8 and compare them against simulated stock.",
    version="1.0.0",
)

api_router = APIRouter(prefix="/api/v1/merchandising", tags=["Merchandising"])

DEMO_STORES = [
    {
        "id": 1,
        "name": "Demo Retail Store",
        "code": "DEMO-001",
        "city": "Tunis",
    }
]


def _paginated_response(results: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "count": len(results),
        "next": None,
        "previous": None,
        "results": results,
    }


def _run_detection(payload: bytes, confidence: float, imgsz: int, visualize: bool) -> dict[str, Any]:
    try:
        return detect_image_bytes(payload=payload, confidence=confidence, imgsz=imgsz, visualize=visualize)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/health")
def health() -> dict[str, Any]:
    return health_data()


@app.post("/detect")
async def detect_products(
    file: UploadFile = File(...),
    confidence: float = Query(DEFAULT_CONFIDENCE, ge=0.0, le=1.0),
    imgsz: int = Query(DEFAULT_IMAGE_SIZE, ge=320, le=2048),
    visualize: bool = Query(False),
) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    payload = await file.read()
    return _run_detection(payload=payload, confidence=confidence, imgsz=imgsz, visualize=visualize)


@api_router.get("/ai/detect/")
def detect_products_info() -> dict[str, Any]:
    return {
        "detail": "Send a multipart/form-data POST request with an image file in the 'file' field.",
        "method": "POST",
        "path": "/api/v1/merchandising/ai/detect/",
        "query": {
            "confidence": DEFAULT_CONFIDENCE,
            "imgsz": DEFAULT_IMAGE_SIZE,
        },
    }


@api_router.post("/ai/detect/")
async def detect_products_compat(
    file: UploadFile = File(...),
    confidence: float = Query(DEFAULT_CONFIDENCE, ge=0.0, le=1.0),
    imgsz: int = Query(DEFAULT_IMAGE_SIZE, ge=320, le=2048),
    visualize: bool = Query(False),
) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    payload = await file.read()
    return _run_detection(payload=payload, confidence=confidence, imgsz=imgsz, visualize=visualize)


@api_router.get("/products/")
def products() -> dict[str, Any]:
    return _paginated_response(product_catalog_data())


@api_router.get("/stores/")
def stores() -> dict[str, Any]:
    return _paginated_response(DEMO_STORES)


@api_router.get("/visits/")
def visits() -> dict[str, Any]:
    return _paginated_response([])


@api_router.post("/gps/")
@api_router.post("/gps/track/")
def gps_track(payload: dict[str, Any] = Body(default_factory=dict)) -> dict[str, Any]:
    return {
        "status": "accepted",
        "received": payload,
    }


app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("UVICORN_RELOAD", "true").lower() == "true",
    )