import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register:           data  => API.post("/auth/register", data),
  login:              data  => API.post("/auth/login", data),
  verifyEmail:        token => API.get(`/auth/verify-email?token=${token}`),
  resendVerification: email => API.post("/auth/resend-verification", { email }),
  forgotPassword:     email => API.post("/auth/forgot-password", { email }),
  resetPassword:      data  => API.post("/auth/reset-password", data),
  changePassword:     data  => API.post("/auth/change-password", data),
  me:                 ()    => API.get("/auth/me"),
};

// ── Vendor ────────────────────────────────────────────────
export const vendorAPI = {
  createProfile:  data => API.post("/vendor/profile", data),
  getMyProfile:   ()   => API.get("/vendor/profile/me"),
  updateProfile:  data => API.patch("/vendor/profile/me", data),
  listVendors:    params => API.get("/vendor/", { params }),
  getVendor:      id => API.get(`/vendor/${id}`),
  getRanked:      ()   => API.get("/vendor/ranked/list"),
  addService:     data => API.post("/vendor/services", data),
  getMyServices:  ()   => API.get("/vendor/services/mine"),
  updateService:  (id, data) => API.patch(`/vendor/services/${id}`, data),
  deleteService:  id => API.delete(`/vendor/services/${id}`),
  uploadDocument: (formData) => API.post("/vendor/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  getMyDocuments: () => API.get("/vendor/documents/mine"),
  deleteDocument: id => API.delete(`/vendor/documents/${id}`),
  addESG:         data => API.post("/vendor/esg", data),
  getESG:         id => API.get(`/vendor/esg/${id}`),
};

// ── Buyer ─────────────────────────────────────────────────
export const buyerAPI = {
  createRequest:    data => API.post("/buyer/requests", data),
  getMyRequests:    params => API.get("/buyer/requests/mine", { params }),
  listRequests:     params => API.get("/buyer/requests", { params }),
  getRequest:       id => API.get(`/buyer/requests/${id}`),
  updateRequest:    (id, data) => API.patch(`/buyer/requests/${id}`, data),
  closeRequest:     (id, data) => API.post(`/buyer/requests/${id}/close`, data),
  deleteRequest:    id => API.delete(`/buyer/requests/${id}`),
  rateVendor:       data => API.post("/buyer/rate", data),
  getRating:        vendorId => API.get(`/buyer/rating/${vendorId}`),
  aiMatch:          requestId => API.get(`/buyer/requests/${requestId}/ai-match`),
  getNotifications: () => API.get("/buyer/notifications"),
  markRead:         id => API.patch(`/buyer/notifications/${id}/read`),
  markAllRead:      () => API.post("/buyer/notifications/mark-all-read"),
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  listUsers:          params => API.get("/admin/users", { params }),
  getUser:            id => API.get(`/admin/users/${id}`),
  updateUser:         (id, data) => API.patch(`/admin/users/${id}`, data),
  deactivateUser:     id => API.delete(`/admin/users/${id}`),
  pendingVendors:     () => API.get("/admin/vendors/pending"),
  verifyVendor:       id => API.post(`/admin/vendors/${id}/verify`),
  unverifyVendor:     id => API.post(`/admin/vendors/${id}/unverify`),
  vendorDocuments:    id => API.get(`/admin/vendors/${id}/documents`),
  downloadDocument:   id => `http://127.0.0.1:8000/admin/documents/${id}/download`,
  impact:             () => API.get("/admin/impact"),
  esgBreakdown:       () => API.get("/admin/impact/esg-breakdown"),
  stats:              () => API.get("/admin/stats"),
  rejectVendor: (id, reason) => API.post(`/admin/vendors/${id}/reject`, { reason }),
  sendNotification: (data) => API.post("/admin/notifications/send", data),
};

// ── Chatbot ───────────────────────────────────────────────
export const chatAPI = {
  chat:     data => API.post("/chatbot/chat", data),
  listFAQs: ()   => API.get("/chatbot/faqs"),
};

export default API;
