**Django REST Integration**

Use [retail_detector.py](retail_detector.py) as the shared AI service inside your Django backend.

Put [retail_detector.py](retail_detector.py) somewhere importable by your Django project, for example inside your Django app or a shared `services/` package.

Example `views.py`:

```python
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .retail_detector import DEFAULT_CONFIDENCE, DEFAULT_IMAGE_SIZE, detect_image_bytes


class DetectProductsView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        image_file = request.FILES.get("file")
        if image_file is None:
            return Response({"detail": "Image file is required."}, status=400)

        confidence = float(request.query_params.get("confidence", DEFAULT_CONFIDENCE))
        imgsz = int(request.query_params.get("imgsz", DEFAULT_IMAGE_SIZE))

        try:
            payload = image_file.read()
            result = detect_image_bytes(payload=payload, confidence=confidence, imgsz=imgsz)
            return Response(result, status=200)
        except ValueError as error:
            return Response({"detail": str(error)}, status=400)
        except Exception as error:
            return Response({"detail": str(error)}, status=500)
```

Example `urls.py`:

```python
from django.urls import path

from .views import DetectProductsView


urlpatterns = [
    path("detect/", DetectProductsView.as_view(), name="detect-products"),
]
```

Example request from mobile app:

```http
POST /detect/?confidence=0.5&imgsz=1280
Content-Type: multipart/form-data

file=<image>
```

What happens in Django:

1. DRF receives the uploaded image through `request.FILES`.
2. The view reads the file bytes.
3. `detect_image_bytes(...)` decodes the image and runs YOLO.
4. The detector groups products, simulates storage, and builds the stock response.
5. Django returns the JSON to the mobile app.

Recommended project shape inside Django:

```text
your_app/
    views.py
    urls.py
    retail_detector.py
```

If your Django backend already has business logic layers, a cleaner shape is:

```text
your_app/
    views.py
    urls.py
    services/
        retail_detector.py
```

Then import it as:

```python
from .services.retail_detector import detect_image_bytes
```