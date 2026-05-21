from __future__ import annotations

import random
from collections import Counter
from pathlib import Path
from threading import Lock
from typing import Any

import cv2
import numpy as np
from ultralytics import YOLO


MODEL_PATH = Path("runs/detect/train5/weights/best.pt")
DEFAULT_CONFIDENCE = 0.15
DEFAULT_IMAGE_SIZE = 1024

CLASS_NAMES = {
    0: "cannelloni",
    1: "coude",
    2: "escargot",
    3: "fell",
    4: "papillon",
    5: "ressort",
    6: "spaghetti",
    7: "tagliatelle",
    8: "langue doiseau",
    9: "lasagne",
    10: "plume",
}

if not MODEL_PATH.exists():
    print("=" * 60)
    print(f"CRITICAL WARNING: CUSTOM WEIGHTS NOT FOUND AT: {MODEL_PATH}")
    print("THE AI WILL DETECT GENERIC OBJECTS (LIKE HOT DOGS) UNTIL YOU")
    print("PLACE YOUR 'best.pt' FILE IN THE FOLDER ABOVE.")
    print("=" * 60)
    print("Falling back to pre-trained yolov8n.pt for service stability.")
    MODEL_PATH = Path("yolov8n.pt")

_MODEL: YOLO | None = None
_MODEL_LOCK = Lock()
_STOCK_LOCK = Lock()

STORAGE = {
    name: {
        "cannelloni": 4,
        "coude": 0,
        "escargot": 7,
        "fell": 5,
        "papillon": 8,
        "ressort": 3,
        "spaghetti": 12,
        "tagliatelle": 6,
        "langue doiseau": 2,
        "lasagne": 0,
        "plume": 9,
    }.get(name, 0)
    for name in CLASS_NAMES.values()
}


def get_model() -> YOLO:
    global _MODEL

    if _MODEL is None:
        with _MODEL_LOCK:
            if _MODEL is None:
                _MODEL = YOLO(str(MODEL_PATH))
    return _MODEL


def health_data() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_path": str(MODEL_PATH),
        "model_loaded": _MODEL is not None,
        "classes": list(CLASS_NAMES.values()),
    }


def product_catalog_data() -> list[dict[str, Any]]:
    return [
        {
            "id": class_id,
            "name": product_name,
            "storage": STORAGE.get(product_name, 0),
        }
        for class_id, product_name in sorted(CLASS_NAMES.items())
    ]


def decode_image_bytes(payload: bytes) -> np.ndarray:
    if not payload:
        raise ValueError("Uploaded file is empty.")

    image_array = np.frombuffer(payload, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Failed to decode the uploaded image.")

    return image


def _simulate_storage_snapshot() -> dict[str, int]:
    with _STOCK_LOCK:
        for product_name in STORAGE:
            STORAGE[product_name] = max(0, STORAGE[product_name] + random.choice([-1, 0, 0, 1]))
        return dict(STORAGE)


def _build_status(detected: int, storage: int) -> str:
    if detected > 0 and storage > 0:
        return "IN STOCK"
    if detected > 0 and storage == 0:
        return "LAST ITEMS"
    if detected == 0 and storage > 0:
        return "NOT ON SHELF (RESTOCK NEEDED)"
    return "OUT OF STOCK"


def detect_image(
    image: np.ndarray,
    confidence: float = DEFAULT_CONFIDENCE,
    imgsz: int = DEFAULT_IMAGE_SIZE,
    visualize: bool = False,
) -> dict[str, Any]:
    model = get_model()
    results = model.predict(source=image, conf=confidence, imgsz=imgsz, verbose=False)
    boxes = results[0].boxes

    detected_counts: Counter[str] = Counter()
    detection_boxes: list[dict[str, Any]] = []

    if boxes is not None:
        for box in boxes:
            class_id = int(box.cls[0].item())
            product_name = CLASS_NAMES.get(class_id, f"class_{class_id}")
            score = float(box.conf[0].item())
            x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]

            detected_counts[product_name] += 1
            detection_boxes.append(
                {
                    "name": product_name,
                    "confidence": round(score, 4),
                    "bbox": [x1, y1, x2, y2],
                }
            )

    storage_snapshot = _simulate_storage_snapshot()
    product_names = sorted(set(storage_snapshot) | set(detected_counts))

    products = []
    for product_name in product_names:
        detected = detected_counts.get(product_name, 0)
        storage = storage_snapshot.get(product_name, 0)
        products.append(
            {
                "name": product_name,
                "detected": detected,
                "storage": storage,
                "status": _build_status(detected, storage),
            }
        )

    response = {
        "products": products,
        "detections": detection_boxes,
        "summary": {
            "total_detected_items": sum(detected_counts.values()),
            "unique_detected_products": len(detected_counts),
            "confidence_threshold": confidence,
            "image_size": imgsz,
        },
    }

    if visualize:
        import base64
        # Plot detection results on the image
        plotted_img = results[0].plot()
        # Encode to base64
        _, buffer = cv2.imencode('.jpg', plotted_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        response["image_base64"] = img_base64

    return response


def detect_image_bytes(
    payload: bytes,
    confidence: float = DEFAULT_CONFIDENCE,
    imgsz: int = DEFAULT_IMAGE_SIZE,
    visualize: bool = False,
) -> dict[str, Any]:
    image = decode_image_bytes(payload)
    return detect_image(image=image, confidence=confidence, imgsz=imgsz, visualize=visualize)