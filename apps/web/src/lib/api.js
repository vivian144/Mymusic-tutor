import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Interceptors ─────────────────────────────────────────── */

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('mmt-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mmt-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ── Auth ─────────────────────────────────────────────────── */

export const auth = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  loginWithOTP: (phone, otp) =>
    api.post('/auth/login/otp', { phone, otp }),

  sendOTP: (phone) =>
    api.post('/auth/otp/send', { phone }),

  loginWithGoogle: () =>
    api.get('/auth/google'),

  register: (userData) =>
    api.post('/auth/register', userData),

  forgotPassword: (phone) =>
    api.post('/auth/forgot-password', { phone }),

  resetPassword: (phone, otp, newPassword) =>
    api.post('/auth/reset-password', { phone, otp, newPassword }),

  verifyEmail: (token) =>
    api.get(`/auth/verify-email/${token}`),

  getMe: () =>
    api.get('/auth/me'),
};

/* ── Teachers ─────────────────────────────────────────────── */

export const teachers = {
  searchTeachers: (filters) =>
    api.get('/teachers/search', { params: filters }),

  getTeacherProfile: (id) =>
    api.get(`/teachers/${id}`),

  updateTeacherProfile: (data) =>
    api.put('/teachers/profile', data),

  setAvailability: (data) =>
    api.put('/teachers/availability', data),

  getEarnings: () =>
    api.get('/teachers/earnings'),

  getSessions: () =>
    api.get('/teachers/sessions'),
};

/* ── Students ─────────────────────────────────────────────── */

export const students = {
  getStudentProfile: () =>
    api.get('/students/profile'),

  updateStudentProfile: (data) =>
    api.put('/students/profile', data),

  getProgress: () =>
    api.get('/students/progress'),

  getPackages: () =>
    api.get('/students/packages'),

  bookFirstClass: (data) =>
    api.post('/students/book-first-class', data),
};

/* ── Bookings ─────────────────────────────────────────────── */

export const bookings = {
  createFirstClass: (data) =>
    api.post('/bookings/first-class', data),

  createPackage: (data) =>
    api.post('/bookings/package', data),

  getUpcoming: () =>
    api.get('/bookings/upcoming'),

  reschedule: (sessionId, newDate) =>
    api.put(`/bookings/${sessionId}/reschedule`, { newDate }),

  completeSession: (sessionId, data) =>
    api.put(`/bookings/${sessionId}/complete`, data),
};

export default api;
