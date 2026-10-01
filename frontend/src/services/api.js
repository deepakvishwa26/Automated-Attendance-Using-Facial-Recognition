const API_BASE = 'http://localhost:8000/api';

/**
 * Register a new student with face data.
 */
export async function registerStudent(data) {
  const response = await fetch(`${API_BASE}/students/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || 'Registration failed');
  }

  return result;
}

/**
 * Look up a student by student ID.
 */
export async function getStudent(studentId) {
  const response = await fetch(`${API_BASE}/students/${studentId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to look up student');
  }

  return response.json();
}

/**
 * Verify a student's face against their registered face.
 */
export async function verifyFace(studentId, faceImage) {
  const response = await fetch(`${API_BASE}/attendance/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentId,
      face_image: faceImage,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || 'Verification failed');
  }

  return result;
}

/**
 * Mark attendance for a verified student.
 */
export async function markAttendance(studentId, confidence) {
  const response = await fetch(`${API_BASE}/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentId,
      confidence: confidence,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    // 409 = already marked today
    if (response.status === 409) {
      return { success: false, message: result.detail, alreadyMarked: true };
    }
    throw new Error(result.detail || 'Failed to mark attendance');
  }

  return result;
}

/**
 * Get attendance history for a student.
 */
export async function getAttendanceHistory(studentId) {
  const response = await fetch(`${API_BASE}/attendance/${studentId}`);

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to fetch attendance history');
  }

  return response.json();
}
