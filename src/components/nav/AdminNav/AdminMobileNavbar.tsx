"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useNotificationCenter } from "@/hooks/queries/useNotificationQueries";
import { MenuIcon, NotificationIcon, SearchIcon } from "@/icons/Icons";
import { Notifications } from "../../Notifications";

export const ATMobileNavbar = () => {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const { data: notificationsData } = useNotificationCenter(isLoggedIn);
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const hasNotifications = unreadCount > 0;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuIconRef = useRef<HTMLDivElement>(null);

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
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuIconRef.current &&
        !menuIconRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleMobileMenuToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsNotificationOpen(false);
  };

  return (
    <>
      <div
        className={`w-[100%] px-4 py-2 pb-5 rounded-b-[1rem] flex md:hidden justify-between font-montserrat items-center ${
          isLoggedIn ? "bg-[#cce5cc]" : ""
        }`}
      >
        {/* Logo */}
        <div className="flex flex-col md:hidden items-center justify-between w-[100%] md:w-[75%] lg:w-[60%]">
          <div className="flex items-center justify-between w-[100%] md:w-[75%] lg:w-[60%]">
            <Link href="/admin" className="flex items-center">
              <Image
                src="/images/navLogo.png"
                alt="Agrictech Logo"
                width={45}
                height={45}
              />
            </Link>
            {isLoggedIn ? (
              <>
                <div className="flex flex-col gap-[0.5rem]">
                  {/* Notification Icon */}
                  <div className="relative" ref={notificationRef}>
                    <div
                      className="flex items-center flex-row-reverse gap-[0.7rem] cursor-pointer"
                      onClick={handleNotificationClick}
                    >
                      <div className="relative">
                        <NotificationIcon />
                        {hasNotifications && (
                          <span className="absolute top-0 right-[2px] h-2 w-2 rounded-full bg-[#538E53]" />
                        )}
                      </div>
                    </div>
                    {isNotificationOpen && (
                      <div className="absolute top-10 right-0 z-50 w-[92vw] max-w-[420px] overflow-hidden rounded-[8px] border border-[#e2e2e2] bg-[#fefefe] shadow-lg">
                        <ul className="py-2">
                          {hasNotifications ? (
                            <>
                              <Notifications />
                            </>
                          ) : (
                            <li className="px-4 py-2 text-[0.89rem] text-gray-500">
                              No new notifications
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="cursor-pointer" ref={menuIconRef}>
                  <MenuIcon onClick={handleMobileMenuToggle} />
                </div>
              </>
            )}
          </div>

          {/* Search Box */}
          {isLoggedIn && (
            <div className="relative flex items-center w-[100%] mt-2">
              <input
                type="text"
                placeholder="I am looking for..."
                className="pl-4 pr-4 py-2 w-[100%] rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[0] rounded-br-[0] bg-[#f1f1f1] focus:outline-none focus:border-[#538E53] placeholder:text-[0.78rem] text-[0.78rem]"
              />
              <div className="bg-[#538e53] w-[45px] h-[38px] py-[5px] px-[5px] flex flex-col justify-center items-center rounded-tl-[0] rounded-bl-[0] rounded-tr-[4px] rounded-br-[4px] cursor-pointer">
                <SearchIcon />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="absolute flex flex-col gap-[1rem] top-[7rem] right-0 p-[2rem] w-[20rem] bg-white border-b border-gray-200 shadow-lg z-99 md:hidden"
          ref={mobileMenuRef}
        >
          <>
            Main Links
            <ul className="flex flex-col gap-6 text-gray-700 font-normal">
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
            {!isLoggedIn && (
              <ul className="flex flex-col gap-4">
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
            )}
          </>
        </div>
      )}
    </>
  );
};
