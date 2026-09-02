"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { NotificationIcon, SearchIcon } from "../../../icons/Icons";
import { Notifications } from "../../Notifications";
import { TransporterMobileNavbar } from "./TransporterMobileNavbar";
import ProfileDropDown from "../../../components/Profile_dropdowns/ProfileDropDown/ProfileDropDown";
import { useNotificationCenter } from "@/hooks/queries/useNotificationQueries";

export const TransporterNavbar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { data: notificationsData } = useNotificationCenter(isLoggedIn);
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about-us", label: "About Us" },
    { href: "/contact-us", label: "Contact Us" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    setIsDropdownOpen(false);
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false); // Close user dropdown
  };

  const handleUserDropdownClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false); // Close notification dropdown
  };

  return (
    <>
      <div className="w-full bg-[#fefefe]">
        <div
          className={`w-[95%] mx-auto py-2 hidden md:flex justify-between font-montserrat items-center ${
            isLoggedIn ? "bg-[#FEFEFE]" : ""
          }`}
        >
          {isLoggedIn ? (
            <span className="hidden md:flex items-center font-montserrat text-[#2b2b2b] text-[16px] lg:text-[1.2rem] font-medium">
              Dashboard
            </span>
          ) : (
            <>
              {/* Logo */}
              <Link
                href="/transporter"
                className="hidden md:flex items-center"
              >
                <Image
                  src="/images/navLogo.png"
                  alt="Agrictech Logo"
                  width={75}
                  height={75}
                />
              </Link>
            </>
          )}

          {/* Conditional Rendering Based on Login Status */}
          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center justify-center gap-[2rem] w-[100%] md:gap-[3rem] lg:gap-[7rem] md:w-[75%] lg:w-[60%]">
                {/* Search Box and Icons */}
                <div className="relative flex items-center w-[80%]">
                  <input
                    type="text"
                    placeholder="I am looking for..."
                    className="pl-4 pr-4 py-2 w-[100%] rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[0] rounded-br-[0] bg-[#f1f1f1] focus:outline-none focus:border-[#538E53] text-[0.89rem]"
                  />
                  <div className="bg-[#538e53] w-[45px] h-[38px] py-[5px] px-[5px] hidden md:flex flex-col justify-center items-center rounded-tl-[0] rounded-bl-[0] rounded-tr-[4px] rounded-br-[4px] cursor-pointer">
                    <SearchIcon />
                  </div>
                </div>

                {/* ========= ICONS ========= */}
                <div className="relative flex items-center gap-[0.5rem] md:gap-[3rem] lg:gap-[5rem]">
                  {/* ===================== Notification icon ========================= */}
                  <div className="relative" ref={notificationRef}>
                    {/* A real button, not a bare div: the bell was unreachable
                        by keyboard, so notifications could not be opened at all
                        without a mouse. */}
                    <button
                      type="button"
                      onClick={handleNotificationClick}
                      aria-haspopup="true"
                      aria-expanded={isNotificationOpen}
                      aria-label={
                        hasUnread
                          ? `Notifications, ${unreadCount} unread`
                          : "Notifications"
                      }
                      className="relative flex cursor-pointer items-center rounded-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#538e53]"
                    >
                      <NotificationIcon />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#d32f2f] px-1 text-[9px] font-medium text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                    {isNotificationOpen && (
                      <div className="absolute top-9 right-0 z-20 w-[92vw] max-w-[420px] overflow-hidden rounded-[8px] border border-[#e2e2e2] bg-[#fefefe] shadow-lg">
                        <Notifications />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Info and Dropdown */}
              <div className="hidden md:flex relative" ref={profileRef}>
                <div
                  className="flex items-center gap-2 cursor-pointer bg-[#f1f1f1] p-1.5 rounded-[4px] hover:bg-[#f6f6f6] transition"
                  onClick={handleUserDropdownClick}
                >
                  <Image
                    src="/images/profile_image.png" // Replace with user-uploaded image if available
                    alt="Profile"
                    width={27}
                    height={27}
                    className="rounded-full"
                  />
                  <span className="text-[#2b2b2b] hidden lg:block text-[0.89rem] font-normal">
                    {session?.user?.name}
                  </span>
                  <svg
                    className="h-4 w-4 text-[#2b2b2b]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {isDropdownOpen && <ProfileDropDown onLogout={handleLogout} />}
              </div>
            </>
          ) : (
            <>
              {/* Main Links */}
              <ul className="hidden md:flex gap-6 text-gray-700 font-normal">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`transition hover:text-[#538E53] text-[0.89rem] font-montserrat ${
                        pathname === item.href
                          ? "text-[#538E53] font-montserrat"
                          : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Auth Buttons */}
              <ul className="hidden md:flex gap-4 items-center">
                <li>
                  <a
                    href="/login"
                    className="text-[#538E53] hover:text-[#214821] text-[0.89rem] font-medium transition"
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a
                    href="/signup"
                    className="bg-[#CCE5CC] text-[#538E53] hover:text-[#214821] p-[10px] rounded-[4px] flex items-center justify-center gap-[10px] transition text-center text-[0.89rem] font-normal"
                  >
                    Get Started
                  </a>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <TransporterMobileNavbar />
    </>
  );
};
