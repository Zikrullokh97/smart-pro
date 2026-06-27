import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const ACCESS_TOKEN_KEY = 'edusphere_access_token';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
};

const clearSession = () => {
  clearAccessToken();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('auth-storage');
  }
};

let refreshRequest: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // login va refresh so'rovlarini retry qilmaymiz - cheksiz tsiklning oldini olish
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        refreshRequest =
          refreshRequest ||
          axios
            .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            .then((response) => {
              const token = response.data.accessToken;
              setAccessToken(token);
              return token;
            })
            .finally(() => {
              refreshRequest = null;
            });

        const token = await refreshRequest;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
