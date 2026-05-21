from ultralytics import YOLO
import os

model = YOLO("runs/detect/train-7/weights/best.pt")

# Use first image from validation set
val_images = "dataset/val/images"
if os.path.exists(val_images):
    test_images = [os.path.join(val_images, f) for f in os.listdir(val_images) if f.endswith(('.jpg', '.jpeg', '.png'))]
    if test_images:
        results = model(test_images[0])
        
        for box in results[0].boxes.xyxy:
            print(box.tolist())
    else:
        print(f"No images found in {val_images}")
else:
    print(f"Validation directory not found: {val_images}")