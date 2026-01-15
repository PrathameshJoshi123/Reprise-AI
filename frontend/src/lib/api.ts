import axios, { AxiosHeaders } from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  ), // Adjust as needed
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // use the same storage key as AuthContext ("accessToken")
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || new AxiosHeaders();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Allow callers to opt out of the global redirect by setting
      // the request header `x-skip-auth-redirect`.
      const headers = error.config?.headers as any;
      const skipHeader =
        headers &&
        (headers["x-skip-auth-redirect"] ||
          headers["X-Skip-Auth-Redirect"] ||
          (typeof headers.get === "function" &&
            (headers.get("x-skip-auth-redirect") ||
              headers.get("X-Skip-Auth-Redirect"))));
      if (!skipHeader) {
        // Handle unauthorized globally (most requests)
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// keep named export for existing imports and add default export for AuthContext default import
export { api };
export default api;
