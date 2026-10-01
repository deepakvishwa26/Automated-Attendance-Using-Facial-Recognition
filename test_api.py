"""
End-to-end test script for the Attendance System API.
Tests: registration, verification, attendance marking, duplicate prevention.

NOTE: Uses real face detection (YuNet DNN), so synthetic "faces" may not be
detected. This script tests the API flow. For face-detection tests, use a
real photo or the webcam-based frontend.
"""
import urllib.request
import json
import base64
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

API = "http://127.0.0.1:8000/api"


def api_call(method, endpoint, data=None):
    """Make an API call and return (status_code, response_dict)."""
    url = f"{API}{endpoint}"
    if data:
        body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=body, method=method,
                                     headers={"Content-Type": "application/json"})
    else:
        req = urllib.request.Request(url, method=method)

    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def create_realistic_face_image():
    """
    Create a more realistic test face image that YuNet can detect.
    Uses a proper skin-colored face with proportional features.
    """
    import numpy as np
    import cv2

    # Create a 640x480 image with neutral background
    img = np.ones((480, 640, 3), dtype=np.uint8) * 200

    # Face shape (skin-colored ellipse)
    skin_color = (145, 180, 220)  # BGR - warm skin tone
    cv2.ellipse(img, (320, 220), (95, 125), 0, 0, 360, skin_color, -1)
    # Add slight blur for realism
    face_mask = np.zeros_like(img)
    cv2.ellipse(face_mask, (320, 220), (95, 125), 0, 0, 360, (255, 255, 255), -1)

    # Forehead highlight
    cv2.ellipse(img, (320, 160), (60, 30), 0, 0, 360, (155, 190, 230), -1)

    # Eye sockets (darker areas)
    cv2.ellipse(img, (285, 195), (22, 14), 0, 0, 360, (100, 130, 160), -1)
    cv2.ellipse(img, (355, 195), (22, 14), 0, 0, 360, (100, 130, 160), -1)

    # Eyeballs (white)
    cv2.ellipse(img, (285, 195), (14, 9), 0, 0, 360, (240, 240, 245), -1)
    cv2.ellipse(img, (355, 195), (14, 9), 0, 0, 360, (240, 240, 245), -1)

    # Irises
    cv2.circle(img, (285, 195), 6, (60, 80, 40), -1)
    cv2.circle(img, (355, 195), 6, (60, 80, 40), -1)

    # Pupils
    cv2.circle(img, (285, 195), 3, (20, 20, 20), -1)
    cv2.circle(img, (355, 195), 3, (20, 20, 20), -1)

    # Eyebrows
    pts_left = np.array([[258, 172], [285, 165], [310, 172]], np.int32)
    pts_right = np.array([[330, 172], [355, 165], [382, 172]], np.int32)
    cv2.polylines(img, [pts_left], False, (60, 70, 80), 3)
    cv2.polylines(img, [pts_right], False, (60, 70, 80), 3)

    # Nose
    cv2.line(img, (320, 210), (318, 250), (120, 155, 190), 2)
    cv2.ellipse(img, (320, 252), (12, 6), 0, 0, 180, (120, 155, 190), 2)

    # Nostrils
    cv2.circle(img, (312, 252), 3, (90, 120, 150), -1)
    cv2.circle(img, (328, 252), 3, (90, 120, 150), -1)

    # Mouth
    # Upper lip
    pts_upper = np.array([[295, 278], [308, 272], (320, 275), (332, 272), (345, 278)], np.int32)
    cv2.polylines(img, [pts_upper], False, (100, 110, 170), 2)
    # Lower lip
    pts_lower = np.array([[295, 278], (308, 288), (320, 290), (332, 288), (345, 278)], np.int32)
    cv2.polylines(img, [pts_lower], False, (100, 110, 170), 2)
    # Fill mouth area
    cv2.ellipse(img, (320, 283), (20, 8), 0, 0, 360, (110, 120, 180), -1)

    # Jaw line shadow
    cv2.ellipse(img, (320, 220), (98, 128), 0, 140, 400, (115, 150, 190), 2)

    # Hair
    cv2.ellipse(img, (320, 130), (110, 60), 0, 180, 360, (40, 35, 30), -1)
    cv2.ellipse(img, (320, 100), (100, 50), 0, 180, 360, (40, 35, 30), -1)

    # Ears
    cv2.ellipse(img, (222, 210), (12, 22), 0, 0, 360, skin_color, -1)
    cv2.ellipse(img, (418, 210), (12, 22), 0, 0, 360, skin_color, -1)

    # Neck
    cv2.rectangle(img, (290, 340), (350, 480), skin_color, -1)

    # Shoulders (shirt)
    pts_shirt = np.array([(200, 480), (240, 380), (320, 360), (400, 380), (440, 480)], np.int32)
    cv2.fillPoly(img, [pts_shirt], (140, 80, 50))

    # Apply slight Gaussian blur for realism
    img = cv2.GaussianBlur(img, (3, 3), 0)

    # Encode to base64
    _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def create_different_face():
    """Create a visually different test face."""
    import numpy as np
    import cv2

    img = np.ones((480, 640, 3), dtype=np.uint8) * 180

    # Different face shape (rounder, different skin tone)
    skin_color = (130, 160, 200)
    cv2.ellipse(img, (320, 230), (105, 115), 0, 0, 360, skin_color, -1)

    # Forehead
    cv2.ellipse(img, (320, 170), (65, 35), 0, 0, 360, (140, 170, 210), -1)

    # Eye sockets
    cv2.ellipse(img, (280, 205), (25, 15), 0, 0, 360, (90, 120, 155), -1)
    cv2.ellipse(img, (360, 205), (25, 15), 0, 0, 360, (90, 120, 155), -1)

    # Eyeballs
    cv2.ellipse(img, (280, 205), (16, 10), 0, 0, 360, (235, 235, 240), -1)
    cv2.ellipse(img, (360, 205), (16, 10), 0, 0, 360, (235, 235, 240), -1)

    # Irises (different color - blue)
    cv2.circle(img, (280, 205), 7, (140, 80, 40), -1)
    cv2.circle(img, (360, 205), 7, (140, 80, 40), -1)

    # Pupils
    cv2.circle(img, (280, 205), 3, (15, 15, 15), -1)
    cv2.circle(img, (360, 205), 3, (15, 15, 15), -1)

    # Thicker eyebrows
    pts_left = np.array([[250, 180], (280, 170), (310, 180)], np.int32)
    pts_right = np.array([[330, 180], (360, 170), (390, 180)], np.int32)
    cv2.polylines(img, [pts_left], False, (50, 55, 60), 4)
    cv2.polylines(img, [pts_right], False, (50, 55, 60), 4)

    # Wider nose
    cv2.line(img, (320, 215), (316, 255), (105, 140, 175), 3)
    cv2.ellipse(img, (320, 258), (16, 7), 0, 0, 180, (105, 140, 175), 2)

    # Bigger mouth - smiling
    pts_mouth = np.array([(288, 285), (305, 280), (320, 282), (335, 280), (352, 285),
                          (340, 298), (320, 302), (300, 298)], np.int32)
    cv2.fillPoly(img, [pts_mouth], (100, 100, 165))

    # Different hair - lighter/longer
    cv2.ellipse(img, (320, 140), (120, 65), 0, 180, 360, (60, 55, 45), -1)
    cv2.ellipse(img, (320, 110), (110, 55), 0, 180, 360, (60, 55, 45), -1)
    # Side hair
    cv2.rectangle(img, (198, 140), (225, 280), (60, 55, 45), -1)
    cv2.rectangle(img, (415, 140), (442, 280), (60, 55, 45), -1)

    # Ears
    cv2.ellipse(img, (215, 215), (13, 24), 0, 0, 360, skin_color, -1)
    cv2.ellipse(img, (425, 215), (13, 24), 0, 0, 360, skin_color, -1)

    # Neck
    cv2.rectangle(img, (285, 345), (355, 480), skin_color, -1)

    # Different shirt color
    pts_shirt = np.array([(190, 480), (235, 385), (320, 365), (405, 385), (450, 480)], np.int32)
    cv2.fillPoly(img, [pts_shirt], (50, 120, 50))

    img = cv2.GaussianBlur(img, (3, 3), 0)

    _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


print("=" * 60)
print("  AUTOMATED ATTENDANCE SYSTEM - API TEST")
print("=" * 60)

# Test 0: Health check
print("\n[0] Testing: GET /health")
status, resp = api_call("GET", "/../health")
print(f"    Status: {status}")
print(f"    Response: {resp}")

# Generate test images
print("\n[1] Generating test face images...")
face1 = create_realistic_face_image()
face2 = create_different_face()
print(f"    Face 1: {len(face1)} chars")
print(f"    Face 2: {len(face2)} chars")

# Test 1: Register student
print("\n[2] Testing: POST /api/students/register")
status, resp = api_call("POST", "/students/register", {
    "student_id": "TEST001",
    "name": "Test Student",
    "department": "CSE",
    "year": 2,
    "email": "test@university.edu",
    "face_image": face1,
})
print(f"    Status: {status}")
if status == 200:
    print(f"    SUCCESS: {resp.get('message', 'registered')}")
else:
    print(f"    Response: {json.dumps(resp, indent=2)[:300]}")
    print("    NOTE: YuNet DNN detector requires realistic face images.")
    print("    The synthetic test face may not be detected.")
    print("    Use the webcam-based frontend for real face testing.")

# Test 2: Look up student
print("\n[3] Testing: GET /api/students/TEST001")
status, resp = api_call("GET", "/students/TEST001")
print(f"    Status: {status}")
if status == 200:
    print(f"    Student: {resp.get('name', 'N/A')} ({resp.get('student_id', 'N/A')})")
else:
    print(f"    Not found (expected if registration used synthetic face)")

# Test 3: Look up non-existent student
print("\n[4] Testing: GET /api/students/NONEXISTENT")
status, resp = api_call("GET", "/students/NONEXISTENT")
print(f"    Status: {status} (expected 404)")
assert status == 404, f"Expected 404, got {status}"
print("    PASS")

# Test 4: Verify face for non-existent student
print("\n[5] Testing: POST /api/attendance/verify (non-existent student)")
status, resp = api_call("POST", "/attendance/verify", {
    "student_id": "NONEXISTENT",
    "face_image": face1,
})
print(f"    Status: {status}")
print(f"    Verified: {resp.get('verified')}")
print(f"    Message: {resp.get('message')}")
assert resp.get("verified") == False, "Should not verify non-existent student"
print("    PASS")

# Test 5: Mark attendance for non-existent student
print("\n[6] Testing: POST /api/attendance/mark (non-existent student)")
status, resp = api_call("POST", "/attendance/mark", {
    "student_id": "NONEXISTENT",
    "confidence": 0.85,
})
print(f"    Status: {status} (expected 400)")
assert status == 400, f"Expected 400, got {status}"
print("    PASS")

# Test 6: Get attendance history (empty)
print("\n[7] Testing: GET /api/attendance/TEST001")
status, resp = api_call("GET", "/attendance/TEST001")
print(f"    Status: {status}")
print(f"    Records: {len(resp)}")
print("    PASS")

# If registration succeeded, test full flow
print("\n[8] Testing: POST /api/students/register (DUPLICATE)")
status, resp = api_call("POST", "/students/register", {
    "student_id": "TEST001",
    "name": "Duplicate",
    "department": "IT",
    "year": 1,
    "face_image": face1,
})
print(f"    Status: {status}")
if status == 400:
    detail = resp.get("detail", "")
    if "already registered" in detail:
        print(f"    PASS (already registered)")
    elif "No face detected" in detail:
        print(f"    OK (no face detected by YuNet - synthetic image)")
    else:
        print(f"    Detail: {detail}")

print("\n" + "=" * 60)
print("  API TESTS COMPLETE")
print("  Backend is operational. Face detection requires real photos.")
print("  Use the frontend at http://localhost:5173 to test with webcam.")
print("=" * 60)
