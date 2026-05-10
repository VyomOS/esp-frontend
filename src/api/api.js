import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
});

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

export const vendorAPI = {
  createProfile:    data     => API.post("/vendor/profile", data),
  getMyProfile:     ()       => API.get("/vendor/profile/me"),
  updateProfile:    data     => API.patch("/vendor/profile/me", data),
  listVendors:      params   => API.get("/vendor/", { params }),
  getVendor:        id       => API.get(`/vendor/${id}`),
  getRanked:        ()       => API.get("/vendor/ranked/list"),
  completeness:     ()       => API.get("/vendor/profile/completeness"),
  esgCompliance:    ()       => API.get("/vendor/esg/compliance"),
  getCertGaps:      ()       => API.get("/vendor/certification/gaps"),
  dismissGap:       type     => API.post(`/vendor/certification/gaps/${type}/dismiss`),
  verifyGST:        data     => API.post("/vendor/verify-gst", data),
  verifyPAN:        data     => API.post("/vendor/verify-pan", data),
  lookupCompany:    data     => API.post("/vendor/lookup-company", data),
  addService:       data     => API.post("/vendor/services", data),
  getMyServices:    ()       => API.get("/vendor/services/mine"),
  deleteService:    id       => API.delete(`/vendor/services/${id}`),
  uploadDocument:   fd       => API.post("/vendor/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  getMyDocuments:   ()       => API.get("/vendor/documents/mine"),
  deleteDocument:   id       => API.delete(`/vendor/documents/${id}`),
  uploadCatalogue:  fd       => API.post("/vendor/catalogue/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  getMyCatalogues:  ()       => API.get("/vendor/catalogue/mine"),
  deleteCatalogue:  id       => API.delete(`/vendor/catalogue/${id}`),
  addESG:           data     => API.post("/vendor/esg", data),
  getESG:           id       => API.get(`/vendor/esg/${id}`),
};

export const buyerAPI = {
  createProfile:    data   => API.post("/buyer/profile", data),
  getMyProfile:     ()     => API.get("/buyer/profile/me"),
  createRequest:    data   => API.post("/buyer/requests", data),
  getMyRequests:    p      => API.get("/buyer/requests/mine", { params: p }),
  listRequests:     p      => API.get("/buyer/requests", { params: p }),
  getRequest:       id     => API.get(`/buyer/requests/${id}`),
  closeRequest:     (id,d) => API.post(`/buyer/requests/${id}/close`, d),
  reopenRequest:    id     => API.post(`/buyer/requests/${id}/reopen`),
  deleteRequest:    id     => API.delete(`/buyer/requests/${id}`),
  rateVendor:       data   => API.post("/buyer/rate", data),
  getRating:        vid    => API.get(`/buyer/rating/${vid}`),
  aiMatch:          rid    => API.get(`/buyer/requests/${rid}/ai-match`),
  getNotifications: ()     => API.get("/buyer/notifications"),
  markRead:         id     => API.patch(`/buyer/notifications/${id}/read`),
  markAllRead:      ()     => API.post("/buyer/notifications/mark-all-read"),
  getBidsOnRequest: rid    => API.get(`/bids/request/${rid}`),
  updateBidStatus:  (id,d) => API.patch(`/bids/${id}/status`, d),
};

export const bidAPI = {
  submit:   data => API.post("/bids/submit", data),
  myBids:   ()   => API.get("/bids/mine"),
  withdraw: id   => API.delete(`/bids/${id}`),
};

export const adminAPI = {
  listUsers:        p     => API.get("/admin/users", { params: p }),
  getUser:          id    => API.get(`/admin/users/${id}`),
  updateUser:       (id,d)=> API.patch(`/admin/users/${id}`, d),
  deactivateUser:   id    => API.delete(`/admin/users/${id}`),
  pendingVendors:   ()    => API.get("/admin/vendors/pending"),
  verifyVendor:     id    => API.post(`/admin/vendors/${id}/verify`),
  rejectVendor:     (id,r)=> API.post(`/admin/vendors/${id}/reject`, { reason: r }),
  unverifyVendor:   id    => API.post(`/admin/vendors/${id}/unverify`),
  vendorDocuments:  id    => API.get(`/admin/vendors/${id}/documents`),
  updateDocStatus:  (id,d)=> API.patch(`/admin/documents/${id}/status`, d),
  downloadDocument: id    => {
    const token = localStorage.getItem("token");
    const base  = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    return `${base}/admin/documents/${id}/download?token=${token}`;
  },
  impact:           ()    => API.get("/admin/impact"),
  esgBreakdown:     ()    => API.get("/admin/impact/esg-breakdown"),
  stats:            ()    => API.get("/admin/stats"),
  sendNotification: data  => API.post("/admin/notifications/send", data),
};

export const chatAPI = {
  chat:     data => API.post("/chatbot/chat", data),
  listFAQs: ()   => API.get("/chatbot/faqs"),
};

export const taxonomyAPI = {
  categories:    () => API.get("/taxonomy/categories"),
  sdgTags:       () => API.get("/taxonomy/sdg-tags"),
  certTypes:     () => API.get("/taxonomy/certification-types"),
};

export default API;
