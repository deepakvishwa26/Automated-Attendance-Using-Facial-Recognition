"""
Face Recognition Service
========================
Isolated face-recognition logic using OpenCV 5's DNN-based face detection
and recognition models.

Models used:
  - YuNet (face_detection_yunet_2023mar.onnx) — fast DNN face detector
  - SFace (face_recognition_sface_2021dec.onnx) — 128-dim face embedding

This module can be replaced with DeepFace, InsightFace, or any other
face-recognition backend without changing the rest of the application.
"""

import base64
import json
import os
import numpy as np
import cv2
from io import BytesIO
from PIL import Image
from typing import Optional, Tuple

# ─── Configuration ──────────────────────────────────────────
# Cosine similarity threshold. Higher = stricter.
VERIFICATION_THRESHOLD = 0.363  # SFace recommended threshold for cosine

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))), "models")

YUNET_MODEL = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_MODEL = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

# ─── Lazy-loaded models ────────────────────────────────────
_face_detector = None
_face_recognizer = None


def _get_face_detector(input_size=(320, 320)):
    """Get or create the YuNet face detector."""
    global _face_detector
    if _face_detector is None:
        if not os.path.exists(YUNET_MODEL):
            raise FileNotFoundError(
                f"YuNet model not found at {YUNET_MODEL}. "
                "Please download from: https://github.com/opencv/opencv_zoo"
            )
        _face_detector = cv2.FaceDetectorYN_create(
            YUNET_MODEL, "", input_size, 0.6, 0.3, 5000
        )
    return _face_detector


def _get_face_recognizer():
    """Get or create the SFace face recognizer."""
    global _face_recognizer
    if _face_recognizer is None:
        if not os.path.exists(SFACE_MODEL):
            raise FileNotFoundError(
                f"SFace model not found at {SFACE_MODEL}. "
                "Please download from: https://github.com/opencv/opencv_zoo"
            )
        _face_recognizer = cv2.FaceRecognizerSF_create(SFACE_MODEL, "")
    return _face_recognizer


def _decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode a base64-encoded image string to an OpenCV numpy array (BGR)."""
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
    cv_image = np.array(pil_image)
    cv_image = cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR)
    return cv_image


def _detect_face(image: np.ndarray):
    """
    Detect faces using YuNet.
    Returns the detection result for the largest face, or None.
    """
    h, w = image.shape[:2]
    detector = _get_face_detector()
    detector.setInputSize((w, h))

    _, faces = detector.detect(image)

    if faces is None or len(faces) == 0:
        return None

    # Return the face with highest confidence (last column is score)
    best_idx = np.argmax(faces[:, -1])
    return faces[best_idx]


def _align_and_crop_face(image: np.ndarray, face_detection) -> np.ndarray:
    """
    Align and crop a face using the SFace recognizer's alignment.
    """
    recognizer = _get_face_recognizer()
    aligned = recognizer.alignCrop(image, face_detection)
    return aligned


def generate_embedding(base64_image: str) -> Optional[list]:
    """
    Generate a 128-dimensional face embedding from a base64-encoded image.

    Returns:
        List of floats (128-dim embedding), or None if no face detected.
    """
    image = _decode_base64_image(base64_image)
    face = _detect_face(image)

    if face is None:
        return None

    # Align and crop the face
    aligned_face = _align_and_crop_face(image, face)

    # Generate 128-dim embedding
    recognizer = _get_face_recognizer()
    embedding = recognizer.feature(aligned_face)

    # Convert to list for JSON serialization
    return embedding.flatten().tolist()


def compare_embeddings(
    embedding1: list, embedding2: list
) -> Tuple[bool, float]:
    """
    Compare two face embeddings using cosine similarity via SFace.

    Returns:
        Tuple of (is_match: bool, similarity: float)
    """
    vec1 = np.array(embedding1, dtype=np.float32).reshape(1, -1)
    vec2 = np.array(embedding2, dtype=np.float32).reshape(1, -1)

    recognizer = _get_face_recognizer()
    # Use cosine distance
    score = recognizer.match(vec1, vec2, cv2.FACE_RECOGNIZER_SF_FR_COSINE)

    is_match = score >= VERIFICATION_THRESHOLD
    return is_match, float(score)


def verify_face(
    base64_image: str, stored_embedding_json: str
) -> Tuple[bool, float]:
    """
    Verify a face image against a stored embedding.

    Args:
        base64_image: base64-encoded image from webcam
        stored_embedding_json: JSON string of the stored embedding vector

    Returns:
        Tuple of (is_match: bool, confidence/similarity: float)
    """
    new_embedding = generate_embedding(base64_image)
    if new_embedding is None:
        return False, 0.0

    stored_embedding = json.loads(stored_embedding_json)
    return compare_embeddings(new_embedding, stored_embedding)


def embedding_to_json(embedding: list) -> str:
    """Serialize an embedding vector to JSON string for storage."""
    return json.dumps(embedding)


def json_to_embedding(json_string: str) -> list:
    """Deserialize an embedding vector from JSON string."""
    return json.loads(json_string)
