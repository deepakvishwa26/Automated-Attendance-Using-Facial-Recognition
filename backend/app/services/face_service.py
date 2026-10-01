"""
Face Recognition Service
========================
Isolated face-recognition logic using DeepFace.
This module can be replaced with any other face-recognition backend
without changing the rest of the application.

Uses:
  - DeepFace with the "VGG-Face" model (default) for generating embeddings
  - Cosine similarity for comparing face embeddings
  - OpenCV for face detection as a quick pre-check
"""

import base64
import json
import numpy as np
import cv2
from io import BytesIO
from PIL import Image
from typing import Optional, Tuple

# DeepFace import — will be lazily loaded
_deepface = None

# Configurable threshold for face verification
VERIFICATION_THRESHOLD = 0.60  # cosine similarity; higher = stricter


def _get_deepface():
    """Lazy-load DeepFace to avoid slow startup."""
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface


def _decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode a base64-encoded image string to an OpenCV numpy array."""
    # Strip data URI prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    image_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
    cv_image = np.array(pil_image)
    # Convert RGB to BGR for OpenCV
    cv_image = cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR)
    return cv_image


def _detect_face(image: np.ndarray) -> bool:
    """Quick check: is there a face in the image using OpenCV Haar cascades?"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
    return len(faces) > 0


def generate_embedding(base64_image: str) -> Optional[list]:
    """
    Generate a face embedding vector from a base64-encoded image.

    Returns:
        List of floats (the embedding vector), or None if no face detected.
    """
    image = _decode_base64_image(base64_image)

    # Quick face detection check
    if not _detect_face(image):
        return None

    DeepFace = _get_deepface()

    try:
        # Generate embedding using DeepFace
        embeddings = DeepFace.represent(
            img_path=image,
            model_name="VGG-Face",
            enforce_detection=False,
            detector_backend="opencv",
        )

        if embeddings and len(embeddings) > 0:
            return embeddings[0]["embedding"]
        return None

    except Exception as e:
        print(f"[FaceService] Error generating embedding: {e}")
        return None


def compare_embeddings(
    embedding1: list, embedding2: list
) -> Tuple[bool, float]:
    """
    Compare two face embeddings using cosine similarity.

    Returns:
        Tuple of (is_match: bool, similarity: float)
    """
    vec1 = np.array(embedding1, dtype=np.float64)
    vec2 = np.array(embedding2, dtype=np.float64)

    # Cosine similarity
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return False, 0.0

    similarity = dot_product / (norm1 * norm2)
    similarity = float(similarity)

    is_match = similarity >= VERIFICATION_THRESHOLD
    return is_match, similarity


def verify_face(
    base64_image: str, stored_embedding_json: str
) -> Tuple[bool, float]:
    """
    Verify a face image against a stored embedding.

    Args:
        base64_image: base64-encoded image from webcam
        stored_embedding_json: JSON string of the stored embedding vector

    Returns:
        Tuple of (is_match: bool, confidence: float)
    """
    # Generate embedding for the new image
    new_embedding = generate_embedding(base64_image)
    if new_embedding is None:
        return False, 0.0

    # Parse the stored embedding
    stored_embedding = json.loads(stored_embedding_json)

    # Compare
    return compare_embeddings(new_embedding, stored_embedding)


def embedding_to_json(embedding: list) -> str:
    """Serialize an embedding vector to JSON string for storage."""
    return json.dumps(embedding)


def json_to_embedding(json_string: str) -> list:
    """Deserialize an embedding vector from JSON string."""
    return json.loads(json_string)
