import axios from "axios";
import type { TokenResponse, User, Job, DashboardStats } from "@/types";

const BASE = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach access token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post<TokenResponse>(
            `${BASE}/api/v1/auth/refresh`,
            { refresh_token: refresh }
          );
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    api.post<User>("/auth/register", { email, password, full_name }),

  login: async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>("/auth/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// ── User ─────────────────────────────────────────────────────
export const userApi = {
  me: () => api.get<User>("/users/me").then((r) => r.data),
  update: (data: { full_name?: string; email?: string }) =>
    api.patch<User>("/users/me", data).then((r) => r.data),
};

// ── Jobs ─────────────────────────────────────────────────────
export const jobsApi = {
  create: (payload: {
    title?: string;
    content_type: string;
    original_content?: string;
    original_url?: string;
    platforms: string[];
    tone: string;
    target_audience?: string;
    keywords?: string[];
  }) => api.post<Job>("/jobs/", payload).then((r) => r.data),

  upload: (form: FormData) =>
    api.post<Job>("/jobs/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  list: (skip = 0, limit = 20) =>
    api.get<Job[]>("/jobs/", { params: { skip, limit } }).then((r) => r.data),

  get: (id: number) => api.get<Job>(`/jobs/${id}`).then((r) => r.data),

  retry: (id: number) => api.post<Job>(`/jobs/${id}/retry`).then((r) => r.data),

  delete: (id: number) => api.delete(`/jobs/${id}`),

  editOutput: (jobId: number, outputId: number, content: string) =>
    api.patch(`/jobs/${jobId}/outputs/${outputId}`, { content }).then((r) => r.data),

  regenerateOutput: (jobId: number, outputId: number) =>
    api.post(`/jobs/${jobId}/outputs/${outputId}/regenerate`).then((r) => r.data),

  stats: () => api.get<DashboardStats>("/jobs/stats").then((r) => r.data),
};

// ── Billing ──────────────────────────────────────────────────
export const billingApi = {
  checkout: (plan: string) =>
    api.post<{ checkout_url: string }>("/billing/checkout", {
      plan,
      // Paystack will append ?reference=xxx to this URL on success
      success_url: `${window.location.origin}/dashboard/payment-success`,
      cancel_url: `${window.location.origin}/dashboard/pricing`,
    }).then((r) => r.data),

  verify: (reference: string) =>
    api.get<{ status: string; plan: string; credits: number; message: string }>(
      `/billing/verify?reference=${reference}`
    ).then((r) => r.data),

  portal: () =>
    api.post<{ portal_url: string }>("/billing/portal", {
      return_url: `${window.location.origin}/dashboard`,
    }).then((r) => r.data),
};
