import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { tokenManager } from "./tokenManager";
import { toast } from "sonner";
import { API_BASE_URL } from "./config";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Skip the global "Server error" toast — for background lookups whose failure the UI already tolerates. */
    silentServerError?: boolean;
  }
}

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

/**
 * Fired once when the session can no longer be recovered (a 401 the refresh
 * could not fix). `SessionExpiredNotice` listens for it and covers the page, so
 * the requests that failed with 401 are never read as "there is no data" while
 * the redirect to /login is in flight. Only a genuine 401 gets here — a 404, a
 * 500, a network error or an empty list never does.
 */
export const SESSION_EXPIRED_EVENT = "tractive:session-expired";

let isForcingLogout = false;

const forceLogout = async () => {
  // Several requests usually fail together; sign out and redirect once.
  if (isForcingLogout) return;
  isForcingLogout = true;

  const current = window.location.pathname + window.location.search;
  const isOnAuthPage =
    current.startsWith("/login") || current.startsWith("/signup");

  tokenManager.clearToken();
  if (!isOnAuthPage) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  await signOut({ redirect: false });

  // Already on the login/signup page: the user is where they need to be, and
  // redirecting to it again would only reload it.
  if (isOnAuthPage) {
    isForcingLogout = false;
    return;
  }

  const params = new URLSearchParams({
    reason: "session-expired",
    redirect: current,
  });
  window.location.href = `/login?${params.toString()}`;
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
    if (error.response?.status === 500 && !originalRequest?.silentServerError) {
      // One id for every 500: several requests (or a retry) failing together
      // update the same toast instead of stacking copies of it.
      toast.error("Server error. Please try again later.", { id: "server-error" });
    }

    return Promise.reject(error);
  },
);

export default api;
