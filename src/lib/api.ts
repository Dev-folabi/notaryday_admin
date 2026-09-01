import axios from "axios";

export const ADMIN_TOKEN_KEY = "admin_token";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login") {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data?.error ?? error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

const api = {
  get: <T>(url: string, config?: Parameters<typeof client.get>[1]) =>
    unwrap<T>(client.get<ApiResponse<T>>(url, config)),
  post: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<typeof client.post>[2]
  ) => unwrap<T>(client.post<ApiResponse<T>>(url, body, config)),
  patch: <T>(
    url: string,
    body?: unknown,
    config?: Parameters<typeof client.patch>[2]
  ) => unwrap<T>(client.patch<ApiResponse<T>>(url, body, config)),
};

export default api;
