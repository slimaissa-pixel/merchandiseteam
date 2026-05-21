import json
import os
import shutil
from pathlib import Path

DATASET_PATH = r"C:\\Users\\DHIB-WELD-DHIBA\\.cache\\kagglehub\\datasets\\humansintheloop\\supermarket-shelves-dataset\\versions\\2\\Supermarket shelves\\Supermarket shelves"
ANNOTATIONS_DIR = os.path.join(DATASET_PATH, "annotations")
IMAGES_DIR = os.path.join(DATASET_PATH, "images")

# Create directory structure
DATASET_ROOT = "dataset"
TRAIN_IMAGES = os.path.join(DATASET_ROOT, "images", "train")
VAL_IMAGES = os.path.join(DATASET_ROOT, "images", "val")
TRAIN_LABELS = os.path.join(DATASET_ROOT, "labels", "train")
VAL_LABELS = os.path.join(DATASET_ROOT, "labels", "val")

for path in [TRAIN_IMAGES, VAL_IMAGES, TRAIN_LABELS, VAL_LABELS]:
    os.makedirs(path, exist_ok=True)

# Get all annotation files
ann_files = sorted([f for f in os.listdir(ANNOTATIONS_DIR) if f.endswith(".json")])
split_idx = int(len(ann_files) * 0.8)  # 80/20 split

train_files = ann_files[:split_idx]
val_files = ann_files[split_idx:]

def process_annotations(ann_file_list, output_labels_dir, output_images_dir, split_name):
    for ann_file in ann_file_list:
        ann_path = os.path.join(ANNOTATIONS_DIR, ann_file)
        
        with open(ann_path) as f:
            data = json.load(f)
        
        # Extract image info from annotation (e.g., "001.jpg.json" -> "001.jpg")
        image_filename = ann_file.replace(".json", "")
        width = data.get("size", {}).get("width")
        height = data.get("size", {}).get("height")
        
        if width is None or height is None:
            print(f"Warning: No size info in {ann_file}")
            continue
        
        # Process each object in the annotation
        labels = []
        for obj in data.get("objects", []):
            if "classTitle" in obj and "points" in obj:
                points = obj["points"]["exterior"]
                # Get bounding box from points (assuming format: [[x1, y1], [x2, y2]])
                x_coords = [p[0] for p in points]
                y_coords = [p[1] for p in points]
                x1, x2 = min(x_coords), max(x_coords)
                y1, y2 = min(y_coords), max(y_coords)
                
                w = x2 - x1
                h = y2 - y1
                
                # Convert to YOLO format (center coords normalized)
                x_center = (x1 + w / 2) / width
                y_center = (y1 + h / 2) / height
                w_norm = w / width
                h_norm = h / height
                
                labels.append(f"0 {x_center} {y_center} {w_norm} {h_norm}")
        
        # Write labels to file
        if labels:
            txt_file = os.path.join(output_labels_dir, image_filename.replace(".jpg", ".txt"))
            with open(txt_file, "w") as f:
                f.write("\n".join(labels) + "\n")
        
        # Copy image to dataset directory
        src_image = os.path.join(IMAGES_DIR, image_filename)
        dst_image = os.path.join(output_images_dir, image_filename)
        if os.path.exists(src_image):
            shutil.copy2(src_image, dst_image)
            print(f"[{split_name}] Processed {image_filename}")
        else:
            print(f"Warning: Image not found {image_filename}")

# Process training set
print(f"Processing {len(train_files)} training files...")
process_annotations(train_files, TRAIN_LABELS, TRAIN_IMAGES, "TRAIN")

# Process validation set
print(f"Processing {len(val_files)} validation files...")
process_annotations(val_files, VAL_LABELS, VAL_IMAGES, "VAL")

print(f"\nDataset organization complete!")
print(f"Training samples: {len(train_files)}")
print(f"Validation samples: {len(val_files)}")