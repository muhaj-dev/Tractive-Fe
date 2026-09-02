import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { tokenManager } from "./tokenManager";
import { toast } from "sonner";
import { API_BASE_URL } from "./config";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  // 1. Try to get token from memory first (fastest)
  let token = tokenManager.getToken();

  // 2. Fallback to session if memory is empty (race condition on load)
  if (!token) {
    const session = await getSession();
    token = session?.accessToken || session?.user?.token || null;
    if (token) {
      tokenManager.setToken(token);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const forceLogout = async () => {
  tokenManager.clearToken();
  await signOut({ redirect: false });

  const current = window.location.pathname + window.location.search;
  const isOnAuthPage =
    current.startsWith("/login") || current.startsWith("/signup");
  const redirectParam = !isOnAuthPage
    ? `?redirect=${encodeURIComponent(current)}`
    : "";

  window.location.href = `/login${redirectParam}`;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await tokenManager.getRefreshTokenHelper(async () => {
          // The backend accepts the refresh token either as an httpOnly cookie
          // on its own origin or in the request body. The cookie is set during
          // the server-side NextAuth login and is SameSite=Lax, so the browser
          // has neither a copy of it nor permission to send it cross-site —
          // posting an empty body here always came back 400. Send the token the
          // session carries instead.
          const session = await getSession();
          const refreshToken = session?.refreshToken;
          if (!refreshToken) return null;

          const res = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken },
            {
              withCredentials: true,
            },
          );

          return res.data?.token || res.data?.accessToken || null;
        });

        if (newToken) {
          tokenManager.setToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // Refresh returned no token — force logout
        await forceLogout();
        return Promise.reject(error);
      } catch (refreshError) {
        // Refresh call failed — force logout
        await forceLogout();
        return Promise.reject(refreshError);
      }
    }

    // Already retried and still 401 — force logout
    if (error.response?.status === 401 && originalRequest._retry) {
      await forceLogout();
      return Promise.reject(error);
    }

    // Handle other errors gracefully
    if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  },
);

export default api;
