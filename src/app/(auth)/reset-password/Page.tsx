"use client";
import { Button } from "../../../components/Button";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChangePasswordFormData, ChangePasswordSchema } from "../../../schemas/changePasswordSchema";
import { resetPassword } from "../../../utils/resetPasswordAuthApi";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}

function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(data, token);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message || "Password reset successfully!");
      reset();
      // Optionally redirect after a delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }

    setIsLoading(false);
  };

  return (
    <div className="w-[100%] bg-[#f1f1f1] md:bg-[#fefefe] lg:flex">
      <div className="hidden lg:block w-[868px] h-screen">
        <Image
          src="/images/callingWoman.png"
          alt="calling Woman"
          width={868}
          height={1080}
          className="w-[868px] h-full"
        />
      </div>

      <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center lg:my-auto h-screen">
        <div className="w-[90%] md:w-[70%] mx-auto flex flex-col">
          <div className="flex flex-col mb-10">
            <h1 className="text-[22px] py-4 text-center font-montserrat text-[#2b2b2b] font-normal">
              Reset Password
            </h1>
            <div className="hidden lg:flex w-[80px] h-[70px] mx-auto items-center justify-center">
              <Image
                src="/images/Lock.png"
                alt="Lock"
                width={127}
                height={127}
                className="w-[127px] h-[80px]"
              />
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6 pb-10"
          >
            {/* Password */}
            <div className="relative">
              <label
                htmlFor="password"
                className="font-montserrat block mb-1 text-[13px] font-normal text-[#2b2b2b]"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...register("password")}
                placeholder="xxxxxxxxx"
                className={`font-montserrat w-full py-2 px-3 pr-10 rounded-md border ${
                  errors.password ? "border-red-500" : "border-[#ccc]"
                } text-[13px] text-[#808080] placeholder-[#808080] placeholder:text-[12px] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]`}
                disabled={isLoading}
              />
              <div
                className="absolute top-[36px] right-3 cursor-pointer text-[#808080]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="font-montserrat block mb-1 text-[13px] font-normal text-[#2b2b2b]"
              >
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                {...register("confirmPassword")}
                placeholder="xxxxxxxxx"
                className={`font-montserrat w-full py-2 px-3 pr-10 rounded-md border ${
                  errors.confirmPassword ? "border-red-500" : "border-[#ccc]"
                } text-[13px] text-[#808080] placeholder-[#808080] placeholder:text-[12px] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]`}
                disabled={isLoading}
              />
              <div
                className="absolute top-[36px] right-3 cursor-pointer text-[#808080]"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              text={isLoading ? "Submitting..." : "Done"}
              className="w-full justify-center"
              onClick={() => handleSubmit(onSubmit)()}
              disabled={isLoading}
            />
          </form>
        </div>
      </div>
    </div>
  );
}