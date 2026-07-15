import axios from "axios";
import { getToken, removeToken } from "./authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Request deduplication: map of pending requests by key (method + url)
const pendingRequests = new Map<string, Promise<any>>();

api.interceptors.request.use((config) => {
  try {
    const token = getToken();
    const method = config.method?.toUpperCase() || "GET";
    const url = config.url || "";

    console.log(`[AXIOS] ${method} ${url} - token present: ${!!token}`);

    // ensure headers object exists
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config.headers = config.headers || {};

    if (token) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[AUTH] Authorization header added');
    } else {
      console.log('[AUTH] No token - request will likely fail with 401');
    }
  } catch (e) {
    console.error('[AXIOS] request interceptor error', e);
  }

  return config;
});

let last401Dispatch = 0;

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase() || "GET";
    const url = response.config.url || "";
    const status = response.status;
    console.log(`[AXIOS] ✓ ${method} ${url} - status: ${status}`);
    
    // Clear pending request after success
    const key = `${method}:${url}`;
    pendingRequests.delete(key);
    
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const method = error?.config?.method?.toUpperCase() || "GET";
    const url = error?.config?.url || "";
    const key = `${method}:${url}`;

    console.error(`[AXIOS] ✗ ${method} ${url} - status: ${status || "no response"}`);

    // Clear pending request after error
    pendingRequests.delete(key);

    const reqUrl = error?.config?.url || '';
    if (status === 401) {
      console.log('[AUTH] 401 Unauthorized - URL:', reqUrl);
      // Only clear token for auth/user endpoints to avoid logging out on unrelated 401s
      if (reqUrl && (reqUrl.includes('/users/me') || reqUrl.includes('/auth') || reqUrl.includes('/login'))) {
        console.log('[AUTH] Clearing token due to 401 on auth/user endpoint');
        removeToken();
        const now = Date.now();
        // throttle dispatch to avoid event storm
        if (now - last401Dispatch > 1000) {
          last401Dispatch = now;
          try { window.dispatchEvent(new Event("stockflow-auth")); } catch (e) {}
        } else {
          console.log('[AXIOS] Skipping duplicate 401 dispatch to prevent loop');
        }
      } else {
        console.log('[AUTH] 401 on non-auth endpoint - not clearing token to avoid logout loop');
      }
    }

    return Promise.reject(error);
  }
);

// Export deduplication wrapper for GET requests to prevent duplicate API calls
export const dedupedGet = async (url: string, config?: any): Promise<any> => {
  const key = `GET:${url}`;
  
  // If a request is already pending for this URL, return the pending promise
  if (pendingRequests.has(key)) {
    console.log(`[AXIOS] Deduped GET ${url} - reusing pending request`);
    return pendingRequests.get(key);
  }

  // Create a new request and store it
  const promise = api.get(url, config).finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
};

export default api;