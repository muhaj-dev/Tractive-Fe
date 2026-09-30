"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { AdminAsideNav } from "../../../components/nav/AdminNav/AdminAsideNav";
import { AdminNavbar } from "../../../components/nav/AdminNav/AdminNavbar";
import { AdminAsideNavMobile } from "../../../components/nav/AdminNav/AdminAsideNavMobile";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<"xs" | "sm" | "lg">("xs");

  useEffect(() => {
    const updateBreakpoint = () => {
      if (window.innerWidth >= 1024) {
        setBreakpoint("lg");
      } else if (window.innerWidth >= 640) {
        setBreakpoint("sm");
      } else {
        setBreakpoint("xs");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breakpoint = useBreakpoint();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use role guard
  const { isAuthorized, isLoading, session } = useRoleGuard("admin");
  const user = session?.user;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    setIsDropdownOpen(false);
  };

  const handleUserDropdownClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const marginLeft = {
    xs: "0rem",
    sm: "6rem",
    lg: "12.5rem",
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      <AdminAsideNav />
      <motion.div
        className="flex-1 flex flex-col"
        animate={{ marginLeft: marginLeft[breakpoint] }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <nav className="w-full">
          <AdminNavbar />
        </nav>
        <div className="flex flex-col">
          <AdminAsideNavMobile
            user={user}
            isDropdownOpen={isDropdownOpen}
            handleUserDropdownClick={handleUserDropdownClick}
            handleLogout={handleLogout}
            closeDropdown={closeDropdown}
          />
          <main className="pt-[1rem] lg:pt-[2rem] w-full">{children}</main>
        </div>
      </motion.div>
    </div>
  );
}
