/**
 * Central, env-driven app configuration.
 *
 * All backend access goes through `API_BASE_URL` so the entire app can be
 * repointed by changing a single env var (`NEXT_PUBLIC_API_URL`). No service,
 * util, or auth file should hardcode the backend host directly.
 *
 * The fallback below is the documented production backend and exists only so a
 * misconfigured environment degrades to a known host instead of `undefined/...`
 * URLs. It is the one and only place a host literal may appear.
 *
 * A trailing slash on the env var is stripped: every call site builds URLs as
 * `${API_BASE_URL}/api/...`, so `https://host/` would emit `https://host//api/...`.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://tractive-be.vercel.app"
).replace(/\/+$/, "");
