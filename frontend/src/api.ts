import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",   // proxied to FastAPI root by Vite
  timeout: 15000,
});

// Log any network errors to help debugging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API ERROR]", {
      url: err?.config?.url,
      method: err?.config?.method,
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return Promise.reject(err);
  }
);
