import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://securebank-7hv8.onrender.com/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Persistent token storage with cross-tab and refresh persistence (localStorage + fallback)
const getStored = (key) => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch {
    return null;
  }
};

let currentAccessToken = getStored('sb_access_token');
let currentRefreshToken = getStored('sb_refresh_token');

// Listen for storage changes across tabs to stay synced
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'sb_access_token') {
      currentAccessToken = event.newValue;
    }
    if (event.key === 'sb_refresh_token') {
      currentRefreshToken = event.newValue;
    }
  });
}

export const setAuthTokens = (accessToken, refreshToken) => {
  currentAccessToken = accessToken;
  try {
    if (accessToken) {
      localStorage.setItem('sb_access_token', accessToken);
    } else {
      localStorage.removeItem('sb_access_token');
      sessionStorage.removeItem('sb_access_token');
    }

    if (refreshToken !== undefined) {
      currentRefreshToken = refreshToken;
      if (refreshToken) {
        localStorage.setItem('sb_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('sb_refresh_token');
        sessionStorage.removeItem('sb_refresh_token');
      }
    }
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
};

export const getAccessToken = () => currentAccessToken || getStored('sb_access_token');
export const getRefreshToken = () => currentRefreshToken || getStored('sb_refresh_token');

export const clearAuthTokens = () => {
  currentAccessToken = null;
  currentRefreshToken = null;
  try {
    localStorage.removeItem('sb_access_token');
    localStorage.removeItem('sb_refresh_token');
    localStorage.removeItem('sb_user');
    sessionStorage.removeItem('sb_access_token');
    sessionStorage.removeItem('sb_refresh_token');
    sessionStorage.removeItem('sb_user');
  } catch (e) {
    console.warn('Storage clear failed:', e);
  }
};

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle automatic token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying and not an auth endpoint
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        isRefreshing = false;
        clearAuthTokens();
        window.dispatchEvent(new CustomEvent('sb:session_expired'));
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
        setAuthTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Only trigger session expired if the backend explicitly rejects the refresh token (401 or 403)
        // Do NOT log out on network loss, CORS delays, or 500 server errors!
        const status = refreshErr.response?.status;
        if (status === 401 || status === 403) {
          clearAuthTokens();
          window.dispatchEvent(new CustomEvent('sb:session_expired'));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper for extracting consistent error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

export default api;
