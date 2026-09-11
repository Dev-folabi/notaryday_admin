import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

export const ADMIN_TOKEN_KEY = "admin_token";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

const baseConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
};

function attachToken(config: InternalAxiosRequestConfig) {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
}

function handle401(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path !== "/login") {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.localStorage.removeItem("admin-auth");
      document.cookie = "admin_token=; Path=/; Max-Age=0; SameSite=Lax";
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }
  return Promise.reject(
    (error as { response?: { data?: { error?: unknown } } })?.response?.data
      ?.error ?? error
  );
}

// Unwraps `response.data.data` on success (matches the main app's API client).
const client = axios.create(baseConfig);
client.interceptors.request.use(attachToken);
client.interceptors.response.use(
  (response) => response.data.data,
  (error) => handle401(error)
);

// Keeps the full `{ success, data, meta }` envelope for paginated endpoints.
export const envelopeClient = axios.create(baseConfig);
envelopeClient.interceptors.request.use(attachToken);
envelopeClient.interceptors.response.use(
  (response) => response.data,
  (error) => handle401(error)
);

// Resolved value at runtime is the full envelope (see interceptor above).
export const envelopeGet = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> =>
  envelopeClient.get<ApiResponse<T>>(url, config) as unknown as Promise<
    ApiResponse<T>
  >;

// The response interceptor already unwraps `response.data.data`, so the
// resolved value at runtime is the payload itself (typed here as T).
const api = {
  get: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => client.get<ApiResponse<T>>(url, config) as Promise<T>,
  post: <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    client.post<ApiResponse<T>>(url, body, config) as Promise<T>,
  patch: <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    client.patch<ApiResponse<T>>(url, body, config) as Promise<T>,
  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    client.delete<ApiResponse<T>>(url, config) as Promise<T>,
};

export default api;
