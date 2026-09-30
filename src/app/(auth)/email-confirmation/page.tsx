"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OtpInput from "react-otp-input";
import { toast } from "sonner";
import { useEmailUser } from "../../../hooks/userEmailContext";
import { resendOtpCode, verifyOtpCode } from "../../../utils/signupAuth";

export default function EmailVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  // `emailLoading` matters: the provider hydrates `email` from localStorage in an
  // effect, so the first render after a refresh always has an empty email. Acting
  // on that would bounce a reloading user back to /signup.
  const { email, loading: emailLoading } = useEmailUser();

  // Redirect if no email is set
  useEffect(() => {
    if (emailLoading) return;
    if (!email) {
      toast.error("No email found. Please sign up first.");
      router.push("/signup");
    }
  }, [email, emailLoading, router]);

  // Auto-verify when OTP is complete
  const handleOtpChange = async (otpValue: string) => {
    setOtp(otpValue);

    // Auto-verify when 6 digits are entered
    if (otpValue.length === 6) {
      if (!email) {
        toast.error("Email not found. Please try signing up again.");
        router.push("/signup");
        return;
      }

      setLoading(true);

      try {
        const result = await verifyOtpCode(email, otpValue);


        if (result.success) {
          toast.success("Email verified successfully!");

          // verify-code issues no token, so the account still has to be signed
          // into. The email is carried across so the login form can prefill it and
          // the user is not asked to retype what they just verified. From there
          // AuthGuard takes a role-less account on to /register-as.
          // replace(), not push(), so Back does not return to a spent code.
          router.replace(`/login?email=${encodeURIComponent(email)}&verified=1`);
        } else {
          // Show error message from the result
          toast.error(result.message || "Invalid verification code");
          setOtp("");
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error("Verification failed. Please try again.");
        setOtp("");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email not found. Please try signing up again.");
      return;
    }

    setResending(true);

    try {
      // resendOtpCode shows its own success/error toast.
      await resendOtpCode(email);
      setOtp(""); // Clear current OTP input
    } catch (err) {
      console.error("Resend error:", err);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (emailLoading || !email) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></div>
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[100%] bg-[#f1f1f1] md:bg-[#fefefe] lg:flex">
      {/* Image on the left (only visible on lg screens) */}
      <div className="hidden lg:block w-[868px] h-screen">
        <Image
          src="/images/Tomato.png"
          alt="tomatoCarrot"
          width={868}
          height={1080}
          className="w-[868px] h-full"
        />
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center lg:my-auto h-screen">
        <div className="w-[90%] md:w-[70%] mx-auto flex flex-col">
          <h1 className="text-[28px] lg:text-[23px] py-4 text-center font-montserrat text-[#2b2b2b] font-normal">
            Account Verification
          </h1>
          <div className="hidden lg:flex w-[80px] h-[70px] mx-auto items-center justify-center">
            <Image
              src="/images/verificationIcon.png"
              alt="Account Verification"
              width={100}
              height={100}
              className="w-[100px] h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-3 pb-10">
            <div className="mt-4">
              <p className="text-[15px] text-center font-montserrat text-[#2b2b2b] font-normal">
                Enter the code sent to
              </p>
              <p className="text-[15px] text-center font-montserrat text-[#2b2b2b] font-[500]">
                {email}
              </p>
            </div>

            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              numInputs={6}
              renderSeparator={<span className="mx-2"></span>}
              renderInput={(props) => <input {...props} disabled={loading} />}
              containerStyle="flex justify-center gap-3 mt-5"
              inputStyle="!w-[50.931px] h-[50.931px] text-lg rounded-[1.769px] border border-[#808080] text-center outline-none focus:border-[#538e53] focus:ring-[0.2px] focus:ring-[#538e53] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Loading indicator when verifying */}
            {loading && (
              <div className="flex items-center justify-center mt-4">
                <div className="w-5 h-5 border-2 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-[13px] text-[#538e53]">
                  Verifying...
                </span>
              </div>
            )}

            <div className="mt-3">
              <p className="text-[13px] text-center font-montserrat text-[#2b2b2b] font-normal">
                I didn&apos;t receive any code.{" "}
                <button
                  type="button"
                  className={`text-[#538e53] ${
                    !resending && !loading
                      ? "cursor-pointer hover:underline"
                      : "opacity-50"
                  }`}
                  onClick={
                    !resending && !loading ? handleResendCode : undefined
                  }
                  disabled={resending || loading}
                >
                  {resending ? "Resending..." : "Resend"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
