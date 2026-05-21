from ultralytics import YOLO

# load your trained model
model = YOLO("runs/detect/train5/weights/best.pt")

# run detection on your image
results = model("test_images/test5.png", save=True)

# show result
results[0].show()