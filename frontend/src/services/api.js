const API_BASE = 'http://localhost:8003/api';

// ── Auth Token Management ──

export function getAuthToken() {
  return localStorage.getItem('smartattend_token');
}

export function setAuthToken(token) {
  localStorage.setItem('smartattend_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('smartattend_token');
  localStorage.removeItem('smartattend_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('smartattend_user'));
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem('smartattend_user', JSON.stringify(user));
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── Auth API ──

export async function adminLogin(email, password) {
  const response = await fetch(`${API_BASE}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || 'Login failed');
  }
  setAuthToken(result.token);
  setStoredUser({ role: result.role, admin_id: result.admin_id, name: result.name });
  return result;
}

export async function studentLogin(studentId) {
  const response = await fetch(`${API_BASE}/auth/student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || 'Login failed');
  }
  setAuthToken(result.token);
  setStoredUser({ role: result.role, student_id: result.student_id, name: result.name });
  return result;
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { ...authHeaders() },
    });
  } catch { /* ignore */ }
  clearAuthToken();
}

export async function getMe() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    clearAuthToken();
    throw new Error('Session expired');
  }
  return response.json();
}

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

/**
 * Get dashboard summary statistics.
 */
export async function getDashboardStats() {
  const response = await fetch(`${API_BASE}/dashboard/stats`);

  if (!response.ok) {
    throw new Error('Failed to load dashboard stats');
  }

  return response.json();
}

/**
 * Get today's attendance records with student info.
 */
export async function getTodayAttendance() {
  const response = await fetch(`${API_BASE}/dashboard/today`);

  if (!response.ok) {
    throw new Error('Failed to load today\'s attendance');
  }

  return response.json();
}

/**
 * List all registered students with optional filters.
 */
export async function listStudents({ search, department } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (department) params.set('department', department);

  const url = `${API_BASE}/students/list${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load students');
  }

  return response.json();
}

/**
 * List attendance records with optional filters.
 */
export async function listAttendanceRecords({ search, date, department } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (date) params.set('record_date', date);
  if (department) params.set('department', department);

  const url = `${API_BASE}/attendance/records${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load attendance records');
  }

  return response.json();
}

/**
 * Get personalized attendance summary for a student.
 */
export async function getAttendanceSummary(studentId) {
  const response = await fetch(`${API_BASE}/students/${studentId}/attendance-summary`);

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || 'Failed to load attendance summary');
  }

  return response.json();
}

/**
 * Get student preferences.
 */
export async function getStudentPreferences(studentId) {
  const response = await fetch(`${API_BASE}/students/${studentId}/preferences`);

  if (!response.ok) {
    throw new Error('Failed to load preferences');
  }

  return response.json();
}

/**
 * Update student preferences.
 */
export async function updateStudentPreferences(studentId, preferences) {
  const response = await fetch(`${API_BASE}/students/${studentId}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || 'Failed to update preferences');
  }

  return result;
}
