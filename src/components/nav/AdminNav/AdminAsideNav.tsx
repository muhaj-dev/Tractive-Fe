"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons/Icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  OverviewIcon,
  UserIcon,
  Bag2Icon,
  LogoutIcon,
  Profile2User,
  moneyChange,
  userRemoveIcon,
  UserTickIcons,
  userMinusIcon,
  SettingIcon,
} from "@/app/(main)/admin/_components/icons/AdminIcons";

interface NavSection {
  title: string;
  items: {
    href?: string;
    icon: React.ComponentType<{
      className?: string;
      stroke?: string;
      fill?: string;
    }>;
    label: string;
    hasDot?: boolean;
    onClick?: () => void;
  }[];
}

export const AdminAsideNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    Managements: true,
    Approvers: true,
    Orders: true,
    Admins: true,
    Reports: true,
    Others: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      await signOut({ redirect: false });
      router.push("/login");
    } catch {
      await signOut({ redirect: false });
      router.push("/login");
    }
  };

  const navSections: NavSection[] = [
    {
      title: "Managements",
      items: [
        {
          href: "/admin/all-users",
          icon: Profile2User,
          label: "All Users",
        },
        {
          href: "/admin/transactions",
          icon: moneyChange,
          label: "Product Payment",
        },
        {
          href: "/admin/fleet-payments",
          icon: moneyChange,
          label: "Fleet Payments",
        },
      ],
    },
    {
      title: "Approvers",
      items: [
        { href: "/admin/new", icon: UserIcon, label: "New", hasDot: true },
        { href: "/admin/rejected", icon: userRemoveIcon, label: "Rejected" },
      ],
    },
    {
      title: "Orders",
      items: [
        {
          href: "/admin/track-orders/track-agent",
          icon: Bag2Icon,
          label: "Track Orders",
        },
        // The transporter half of Track Orders used to be reachable only from
        // the Agents / Transporters switch inside the agent page — no nav
        // entry, desktop or mobile, pointed at it.
        {
          href: "/admin/track-orders/track-transporter",
          icon: Bag2Icon,
          label: "Transport Orders",
        },
      ],
    },
    {
      title: "Admins",
      items: [
        {
          href: "/admin/active",
          icon: UserTickIcons,
          label: "Active",
        },
        {
          href: "/admin/suspended",
          icon: userMinusIcon,
          label: "Suspended",
        },
        {
          href: "/admin/removed",
          icon: userRemoveIcon,
          label: "Removed",
        },
      ],
    },
    // "Reports" (/admin/query, /admin/live-chat) and "Others" (/admin/chat)
    // removed: none of those routes exist, so every link 404'd.
  ];

  return (
    <aside className="w-25 lg:w-50 bg-[#fefefe] fixed h-full hidden sm:block shadow-md z-20 overflow-y-auto Aside_hide-scrollbar">
      <Link
        href="/admin"
        className="flex items-center justify-center lg:justify-start mx-auto my-2 w-[3rem] lg:w-[50%]"
      >
        <Image
          src="/images/navLogo.png"
          alt="Agrictech Logo"
          width={65}
          height={65}
          className="object-contain"
        />
      </Link>

      {/* Link List */}
      <div className="flex flex-col gap-[2.5rem]">
        <div className="flex flex-col px-1">
          <ul>
            <li>
              <Link
                href="/admin"
                className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                  pathname === "/admin"
                    ? "bg-[#cce5cc80]"
                    : "hover:bg-[#f1f1f1]"
                }`}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                <OverviewIcon className="w-5 h-5" />
                <span className="font-montserrat text-[#2b2b2b] text-[9.7px] lg:text-[11.8px] font-medium">
                  Overview
                </span>
              </Link>
            </li>
          </ul>
          <div className="bg-[#e2e2e2] w-full h-[1px] my-1"></div>
          {navSections.map((section, idx) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-center lg:justify-between w-full rounded-md cursor-pointer py-2 px-2.5 text-left font-montserrat text-[#2b2b2b] text-[11px] font-normal hover:bg-[#f1f1f1] transition-colors duration-200"
                aria-expanded={openSections[section.title]}
              >
                <span className="truncate">{section.title}</span>
                <div className="hidden lg:flex items-center gap-2">
                  {openSections[section.title] ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                </div>
              </button>
              <div className="block lg:hidden bg-[#e2e2e2] w-full h-[1px] my-1"></div>
              <AnimatePresence>
                {openSections[section.title] && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item) => (
                      <li key={item.label}>
                        {item.href && (
                          <Link
                            href={item.href}
                            className={`flex items-center gap-1.5 lg:gap-3 py-2 px-3.5 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                              pathname === item.href
                                ? "bg-[#CCE5CC80]"
                                : "hover:bg-[#f1f1f1]"
                            }`}
                            aria-current={
                              pathname === item.href ? "page" : undefined
                            }
                          >
                            <item.icon className="w-5 h-5" />
                            <div className="flex items-center gap-1.5">
                              <span className="font-montserrat text-[#2b2b2b] text-center lg:text-left text-[9px] lg:text-[11px] font-normal">
                                {item.label}
                              </span>
                              {item.hasDot && (
                                <span className="bg-[#538e53] rounded-full w-1 lg:w-2 h-1 lg:h-2"></span>
                              )}
                            </div>
                          </Link>
                        )}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              {idx < navSections.length - 1 && (
                <div className="bg-gray-200 w-full h-px my-2"></div>
              )}
            </div>
          ))}
        </div>

        <ul className="mb-[2rem]">
          <li>
            <Link
              href="/admin/settings"
              className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                pathname.startsWith("/admin/settings")
                  ? "bg-[#cce5cc80]"
                  : "hover:bg-[#f1f1f1]"
              }`}
              aria-current={
                pathname.startsWith("/admin/settings") ? "page" : undefined
              }
            >
              <SettingIcon />
              <div className="flex items-center gap-3">
                <span className="font-montserrat text-[#2b2b2b] text-[10px] lg:text-[11.8px] font-normal">
                  Settings
                </span>
              </div>
            </Link>
          </li>
          <li>
            <div
              onClick={handleLogout}
              className={`flex items-center gap-3 py-2 px-4 rounded-md hover:bg-[#f1f1f1] transition-colors duration-200 lg:flex-row flex-col cursor-pointer`}
            >
              <LogoutIcon />
              <div className="flex items-center gap-3">
                <span className="font-montserrat text-[#2b2b2b] text-[10px] lg:text-[11.8px] font-normal">
                  Logout
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
};
