"""
Download the required face detection and recognition models for OpenCV 5.
Run this script once before starting the backend server.
"""
import urllib.request
import os
import sys

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODELS = {
    "face_detection_yunet_2023mar.onnx": {
        "url": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "desc": "YuNet Face Detector (~211KB)",
    },
    "face_recognition_sface_2021dec.onnx": {
        "url": "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "desc": "SFace Face Recognizer (~37MB)",
    },
}


def download_models():
    for filename, info in MODELS.items():
        filepath = os.path.join(MODELS_DIR, filename)
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"[OK] {info['desc']} already exists ({size:,} bytes)")
            continue

        print(f"[..] Downloading {info['desc']}...")
        try:
            urllib.request.urlretrieve(info["url"], filepath)
            size = os.path.getsize(filepath)
            print(f"[OK] Downloaded {filename} ({size:,} bytes)")
        except Exception as e:
            print(f"[ERROR] Failed to download {filename}: {e}")
            sys.exit(1)

    print("\nAll models are ready!")


if __name__ == "__main__":
    download_models()
