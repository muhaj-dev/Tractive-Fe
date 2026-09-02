import { ChangePasswordFormData } from "@/schemas/changePasswordSchema";
import { API_BASE_URL as API_URL } from "@/lib/config";

interface ApiResponse {
  message?: string;
  error?: string;
}


export const resetPassword = async (
  data: ChangePasswordFormData,
  token: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // `confirmPassword` is required by the API — without it the request is
      // rejected with "Token, password, and confirm password are required"
      // before the token is even checked, so the reset could never succeed.
      body: JSON.stringify({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reset password");
    }

    const result = await response.json();
    return { message: result.message || "Password reset successfully" };
  } catch (error) {
    return { error: error.message || "An unexpected error occurred" };
  }
};