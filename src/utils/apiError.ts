import axios from "axios";

/**
 * Shape of the error bodies this backend returns. It is not consistent about
 * the key it puts the human-readable text under — `/api/profile/switch-role`
 * uses `error`, most other routes use `message` — so anything reading only one
 * of them silently falls back to axios' "Request failed with status code 403"
 * and the user never learns the real cause.
 */
interface ApiErrorBody {
  error?: string;
  message?: string;
  msg?: string;
  approvalRequired?: boolean;
  approvalStatus?: string;
}

export interface ApiErrorInfo {
  /** The server's own wording, so the user sees the actual cause. */
  message: string;
  /** What that cause means / what to do about it, when we can explain it. */
  description?: string;
  status?: number;
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const describeApproval = (body: ApiErrorBody): string | undefined => {
  if (!body.approvalRequired && !body.approvalStatus) return undefined;

  switch (body.approvalStatus) {
    case "pending":
      return "An admin has to approve this account before it can be used. You will be able to switch to it once that approval comes through — your current account stays active until then.";
    case "rejected":
      return "An admin rejected this account, so it cannot be used. Contact support if you think this is a mistake.";
    default:
      return "This account needs admin approval before it can be used.";
  }
};

/**
 * Pull the clearest message we can out of an API failure, plus an explanation
 * of the cause where the response gives us enough to explain it.
 */
export const getApiError = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): ApiErrorInfo => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorBody | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return { message: capitalize(data.trim()), status };
    }

    if (data && typeof data === "object") {
      const serverText = data.error || data.message || data.msg;
      if (serverText) {
        return {
          message: capitalize(serverText),
          description: describeApproval(data),
          status,
        };
      }
    }

    if (error.code === "ERR_NETWORK") {
      return {
        message: "Could not reach the server.",
        description: "Check your internet connection and try again.",
        status,
      };
    }

    return {
      message: fallback,
      description: status ? `The server responded with ${status}.` : undefined,
      status,
    };
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: fallback };
};

/** Convenience for spots that can only render a single string. */
export const getApiErrorMessage = (error: unknown, fallback?: string) => {
  const { message, description } = getApiError(error, fallback);
  return description ? `${message} ${description}` : message;
};
