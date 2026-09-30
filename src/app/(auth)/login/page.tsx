"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { FaEye, FaEyeSlash, FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { LoginSchema, LoginSchemaType } from "../../../schemas/LoginSchema";
import { Button } from "../../../components/Button";
import { useEmailUser } from "../../../hooks/userEmailContext";
import { resendOtpCode } from "../../../utils/signupAuth";

// `POST /api/auth/login` answers 403 { error: "Please verify your email before
// logging in." } for an unverified account. NextAuth passes only that string
// through to signIn(), so the message text is the only way to tell this case
// apart from a wrong password.
const isUnverifiedError = (message: string) => /verify your email/i.test(message);

const Spinner = () => (
  <div className="w-4 h-4 border-4 border-b-2 border-[#a0dfa0] border-t-[#538e53] rounded-full animate-spin" />
);

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { setEmail } = useEmailUser();

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user) {
        // `redirect` comes from the API client after a 401; `callbackUrl` is what
        // the middleware adds when a logged-out user opens a protected link.
        const redirect =
          searchParams.get("redirect") ?? searchParams.get("callbackUrl");
        const isSafeInternalPath =
          !!redirect &&
          redirect.startsWith("/") &&
          !redirect.startsWith("//") &&
          !redirect.startsWith("/\\");

        if (isSafeInternalPath) {
             router.replace(redirect);
             return;
        }

        const { activeRole, role: roles } = session.user;
        if (activeRole) {
             router.replace(`/${activeRole}`);
        } else if (roles && roles.length > 0) {
             router.replace("/register-as");
        } else {
             router.replace("/register-as");
        }
    }
  }, [session, router, searchParams]);

  // Arriving from /email-confirmation: the address was just verified, so it is
  // prefilled rather than asked for again, and the success is acknowledged here
  // because the verification page unmounts before a toast on it could be read.
  const verifiedEmail = searchParams.get("email") ?? "";
  const justVerified = searchParams.get("verified") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: verifiedEmail },
  });

  useEffect(() => {
    if (justVerified) {
      toast.success("Email verified. Log in to finish setting up your account.");
    }
  }, [justVerified]);

  // Sent here by the API client after a 401 it could not recover from.
  const sessionExpired = searchParams.get("reason") === "session-expired";
  useEffect(() => {
    if (sessionExpired) {
      toast.info("Your session has expired. Please log in again to continue.", {
        id: "session-expired",
        duration: 8000,
      });
    }
  }, [sessionExpired]);

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    const toastId = toast.loading("Logging in...");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        toast.dismiss(toastId);
        toast.success("Login successful!");
        // Redirect logic is handled by the useEffect above once session updates
        // But to feel distinct, we can force a router refresh or wait
        router.refresh();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Login error:", err);
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to login", {
        duration: 5000,
        position: "top-center",
      });

      // Unverified account: send a fresh code and take them to the page where
      // it can be entered. /email-confirmation reads the address from the
      // email context, the same way signup hands it over.
      if (isUnverifiedError(err.message || "")) {
        setEmail(data.email);
        await resendOtpCode(data.email);
        router.push("/email-confirmation");
        return;
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#f1f1f1] md:bg-[#fefefe] lg:flex">
      <div className="hidden lg:block w-[868px] h-screen">
        <Image
          src="/images/signinLogin.png"
          alt="signin Login"
          width={868}
          height={1080}
          className="w-[868px] h-full"
        />
      </div>

      <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center h-screen">
        <div className="w-[90%] md:w-[70%] mx-auto flex flex-col">
          <div className="hidden lg:flex w-[80px] h-[70px] mx-auto items-center justify-center">
            <Image
              src="/images/signinloginlogo.png"
              alt="signin Login"
              width={127}
              height={127}
              className="w-[127px] h-[80px]"
            />
          </div>
          <h1 className="text-[24px] lg:text-[17px] py-4 text-center font-montserrat text-[#2b2b2b] md:text-[#538e53] font-normal">
            Login
          </h1>

          <form
            method="post"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 pb-10"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-montserrat text-[#2b2b2b] mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                placeholder="example@gmail.com"
                className="w-full py-2 px-3 rounded-md border border-[#ccc] text-[12px] text-[#808080] placeholder-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-[13px] font-montserrat text-[#2b2b2b] mb-1"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...register("password")}
                placeholder="xxxxxxxxx"
                className="w-full py-2 px-3 pr-10 rounded-md border border-[#ccc] text-[12px] text-[#808080] placeholder-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
              />
              <button
                type="button"
                className="absolute top-[36px] right-3 cursor-pointer text-[#808080]"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Link
              href="/forget-password"
              className="flex justify-end text-[#538e53] text-[12px]"
            >
              Forget password
            </Link>

            <div>
              {/* type="submit" so the form submits on Enter too. Button defaults
                  to type="button", and with submission wired only through onClick
                  this form had no submit control at all — pressing Enter in the
                  email or password field did nothing. */}
              <Button
                type="submit"
                text={
                  loading ? (
                    <div className="flex items-center justify-center gap-2.5">
                      <Spinner />
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    "Login"
                  )
                }
                disabled={loading}
                className="w-full justify-center"
              />
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center">
                <div className="flex-grow h-px bg-[#ccc]" />
                <span className="px-4 text-[13px] text-[#808080] font-montserrat whitespace-nowrap">
                  Or Login with
                </span>
                <div className="flex-grow h-px bg-[#ccc]" />
              </div>

              <div className="flex items-center justify-center gap-6 mt-2 text-[24px]">
                <FaFacebook
                  size={37}
                  className="cursor-pointer text-[#1877F2]"
                />
                <FcGoogle size={37} className="cursor-pointer" />
              </div>

              <div className="mt-2 mb-10">
                <p className="font-montserrat text-[13px] text-center text-[#2b2b2b]">
                  Don&apos;t have an account?{" "}
                  <Link className="text-[#538e53]" href="/signup">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
