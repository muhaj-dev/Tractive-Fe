"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function OnboardingSuccessPage() {
  // Initialize userRole from localStorage (guard against SSR)
  const [userRole] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("userRole") || "" : "")
  );
  const router = useRouter();

  useEffect(() => {
    // Set up redirect timer
    const timer = setTimeout(() => {
      if (userRole) {
        // Redirect to the appropriate dashboard based on user role
        const dashboardRoute = `/${userRole}`;
        router.replace(dashboardRoute);
      } else {
        // Fallback to register-as if no role found
        router.replace("/register-as");
      }
    }, 5000); // Reduced from 7s to 5s for better UX

    return () => clearTimeout(timer);
  }, [router, userRole]);

  return (
    <>
      <div className="w-full bg-[#f1f1f1] md:bg-[#fefefe] lg:flex">
        <div className="hidden lg:block w-[868px] h-screen">
          <Image
            src="/images/Tomato.png"
            alt="tomatoCarrot"
            width={868}
            height={1080}
            className="w-[868px] h-full"
          />
        </div>

        <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center">
          <div className="w-[90%] md:w-[70%] mx-auto flex flex-col items-center justify-center h-screen">
            <motion.div
              className="text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3.5, duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated Circle and Checkmark */}
              <div className="relative w-[150px] h-[150px] mx-auto mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#00a91b"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="283"
                    strokeDashoffset="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  {/* Natural Checkmark */}
                  <motion.path
                    d="M32 50 L45 65 L72 35"
                    stroke="#00a91b"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeInOut", delay: 2 }}
                  />
                </svg>
              </div>

              {/* Text */}
              <motion.h1
                className="text-[50px] font-normal text-[#009418] font-montserrat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
              >
                Successful
              </motion.h1>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
