import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/config";

export type StoredUser = {
  name: string;
  email: string;
  id?: string;
};

// Define response data interfaces
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

interface RegisterResponse {
  user?: {
    name: string;
    email: string;
    id?: string;
    _id?: string;
  };
  message?: string;
}

interface VerifyResponse {
  success?: boolean;
  message?: string;
  token?: string;
  user?: StoredUser;
}

/** `POST /api/auth/resend-verification` answers `{ ok, resent, emailSent,
 * message }` (verified against the live API 30 Sep 2026). `success` is kept in
 * case an older deployment still sends it. */
interface ResendResponse {
  ok?: boolean;
  resent?: boolean;
  success?: boolean;
  message?: string;
}

// Register user with backend API
export const registerUserWithOtp = async (
  name: string,
  email: string,
  password: string,
): Promise<{ newUser: StoredUser | null; otpSentTo?: string }> => {
  const toastId = toast.loading("Signing you up...");

  try {
    const response = await axios.post<RegisterResponse>(
      `${API_BASE_URL}/api/auth/register`,
      {
        name,
        email,
        password,
      },
    );

    // Extract user data from API response
    const { user, message } = response.data;

    if (!user) {
      throw new Error("No user data received from server");
    }

    const newUser: StoredUser = {
      name: user.name,
      email: user.email,
      id: user.id || user._id, // Handle both id formats
    };

    toast.dismiss(toastId);
    toast.success(message || `OTP sent to ${newUser.email}`);

    return { newUser, otpSentTo: newUser.email };
  } catch (err) {
    console.error("Registration failed:", err);
    toast.dismiss(toastId);

    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const responseData = axiosError.response.data;

        if (status === 400) {
          toast.error(responseData?.message || "Invalid registration data");
        } else if (status === 409) {
          toast.error("User already exists. Please login instead.");
        } else if (status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          const errorMessage =
            responseData?.message ||
            responseData?.error ||
            `Registration failed (${status})`;
          toast.error(errorMessage);
        }
      } else if (axiosError.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Request failed to send. Please try again.");
      }
    } else if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("Registration failed. Please try again.");
    }

    return { newUser: null };
  }
};

// Verify OTP code with backend API
export const verifyOtpCode = async (
  email: string,
  otp: string,
): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: StoredUser | null;
}> => {
  const toastId = toast.loading("Verifying code...");

  try {
    const response = await axios.post<VerifyResponse>(
      `${API_BASE_URL}/api/auth/verify-code`,
      {
        email,
        code: otp, // or 'otp' depending on your backend expectation
      },
    );

    const { success, message, token, user } = response.data;

    toast.dismiss(toastId);

    // FIXED: Check for successful verification based on message content
    // If the message contains "verified" or "success", treat it as successful
    const isSuccessful =
      success ||
      (message &&
        (message.toLowerCase().includes("verified") ||
          message.toLowerCase().includes("success"))) ||
      response.status === 200; // HTTP 200 usually means success

    if (isSuccessful) {
      toast.success(message || "Account verified successfully!");
      return { success: true, message, token, user };
    } else {
      toast.error(message || "Verification failed");
      return { success: false, message };
    }
  } catch (err) {
    console.error("Verification failed:", err);
    toast.dismiss(toastId);

    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const responseData = axiosError.response.data;

        if (status === 400) {
          toast.error(responseData?.message || "Invalid verification code");
        } else if (status === 404) {
          toast.error("User not found or code expired");
        } else if (status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          const errorMessage =
            responseData?.message ||
            responseData?.error ||
            `Verification failed (${status})`;
          toast.error(errorMessage);
        }
      } else if (axiosError.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Request failed to send. Please try again.");
      }
    } else if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("Verification failed. Please try again.");
    }

    return { success: false, message: "Verification failed" };
  }
};

// Resend OTP code
export const resendOtpCode = async (
  email: string,
): Promise<{ success: boolean; message?: string }> => {
  const toastId = toast.loading("Resending code...");

  try {
    const response = await axios.post<ResendResponse>(
      `${API_BASE_URL}/api/auth/resend-verification`,
      { email },
    );

    const { ok, resent, success, message } = response.data;

    toast.dismiss(toastId);

    if (ok || resent || success) {
      toast.success(message || "Code resent successfully!");
      return { success: true, message };
    } else {
      toast.error(message || "Failed to resend code");
      return { success: false, message };
    }
  } catch (err) {
    console.error("Resend failed:", err);
    toast.dismiss(toastId);
    toast.error("Failed to resend code. Please try again.");
    return { success: false, message: "Resend failed" };
  }
};
