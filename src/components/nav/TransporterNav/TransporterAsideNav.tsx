"use client";
import {
  AddToStoreIcon,
  Bag2Icon,
  BidsIcon,
  BoxTickIcon,
  FarmersIcon,
  LogoutIcon,
  MessageQuestionIcon,
  MessagesIcon,
  MessageStarIcon,
  MoneyReceiveIcon,
  OverviewIcon,
  PackedIcon,
  ProduceListIcon,
  Profile2UserIcon,
} from "@/icons/DashboardIcons";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons/Icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import AddFleet from "@/app/(main)/transporter/_components/AddFleet";

interface NavSection {
  title: string;
  items: {
    href?: string;
    icon: React.ComponentType;
    label: string;
    hasDot?: boolean;
    onClick?: () => void;
  }[];
}

export const TransporterAsideNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    Store: true,
    Bookings: true,
    Transactions: true,
    Customers: true,
    Others: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Mapping of labels to their corresponding routes
  const labelToRoute: { [key: string]: string } = {
    "Fleet list": "/transporter/fleet-list",
    Drivers: "/transporter/drivers",
    Negotiations: "/transporter/negotiations",
    New: "/transporter/new",
    Picked: "/transporter/picked",
    OnTransit: "/transporter/on-transit",
    Delivered: "/transporter/delivered",
    Pending: "/transporter/pending",
    Customers: "/transporter/customers",
    Reviews: "/transporter/reviews",
    Chat: "/transporter/chat",
    Help: "/transporter/help",
  };

  const navSections: NavSection[] = [
    {
      title: "Store",
      items: [
        {
          icon: AddToStoreIcon,
          label: "Add Fleet",
          onClick: () => setIsModalOpen(true),
        },
        {
          href: "/transporter/fleet-list",
          icon: ProduceListIcon,
          label: "Fleet list",
        },
        { href: "/transporter/drivers", icon: FarmersIcon, label: "Drivers" },
        {
          href: "/transporter/negotiations",
          icon: BidsIcon,
          label: "Negotiations",
          hasDot: true,
        },
      ],
    },
    {
      title: "Bookings",
      items: [
        {
          href: "/transporter/new",
          icon: Bag2Icon,
          label: "New",
          hasDot: true,
        },
        { href: "/transporter/picked", icon: PackedIcon, label: "Picked" },
        {
          href: "/transporter/on-transit",
          icon: BoxTickIcon,
          label: "On Transit",
        },
        {
          href: "/transporter/delivered",
          icon: BoxTickIcon,
          label: "Delivered",
        },
      ],
    },
    {
      title: "Transactions",
      items: [
        {
          href: "/transporter/pending",
          icon: MoneyReceiveIcon,
          label: "Pending",
        },
      ],
    },
    {
      title: "Customers",
      items: [
        {
          href: "/transporter/customers",
          icon: Profile2UserIcon,
          label: "Customers",
        },
        {
          href: "/transporter/reviews",
          icon: MessageStarIcon,
          label: "Reviews",
        },
      ],
    },
    {
      title: "Others",
      items: [
        {
          href: "/transporter/chat",
          icon: MessagesIcon,
          label: "Chat",
          hasDot: true,
        },
        {
          href: "/transporter/help",
          icon: MessageQuestionIcon,
          label: "Help",
        },
      ],
    },
  ];

  return (
    <aside className="w-25 lg:w-50 bg-[#fefefe] fixed h-full hidden sm:block shadow-md z-20 overflow-y-auto">
      <AddFleet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <Link
        href="/transporter"
        className="flex items-center justify-center lg:justify-start mx-auto my-2 w-[3rem] lg:w-[50%]"
      >
        <Image
          src="/images/navLogo.png"
          alt="Agrictech Logo"
          width={65}
          height={65}
        />
      </Link>
      <div className="flex flex-col gap-[2.5rem]">
        <div className="flex flex-col px-1">
          <ul>
            <li>
              <Link
                href="/transporter"
                className={`flex items-center gap-2 py-2 px-2 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                  pathname === "/transporter"
                    ? "bg-[#CCE5CC80]"
                    : "hover:bg-[#f1f1f1]"
                }`}
              >
                <OverviewIcon />
                <span className="font-montserrat text-[#2b2b2b] text-[9.7px] lg:text-[11.8px] font-medium">
                  Overview
                </span>
              </Link>
            </li>
          </ul>
          <span className="bg-[#e2e2e2] w-full h-[1px] my-1"></span>
          {navSections.map((section, idx) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-center lg:justify-between w-full rounded-md cursor-pointer py-2 px-2.5 text-left font-montserrat text-[#2b2b2b] text-[11px] font-normal hover:bg-[#f1f1f1] transition-colors duration-200"
              >
                <p className="truncate">{section.title}</p>
                <div className="hidden lg:flex items-center gap-2">
                  {openSections[section.title] ? (
                    <ArrowUpIcon />
                  ) : (
                    <ArrowDownIcon />
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
                        {item.href ? (
                          <Link
                            href={item.href}
                            className={`flex items-center gap-1.5 lg:gap-3 py-2 px-3.5 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                              pathname === labelToRoute[item.label]
                                ? "bg-[#CCE5CC80]"
                                : "hover:bg-[#f1f1f1]"
                            }`}
                          >
                            <item.icon />
                            <div className="flex items-center gap-1.5">
                              <span className="font-montserrat text-[#2b2b2b] text-center lg:text-left text-[9px] lg:text-[11px] font-normal">
                                {item.label}
                              </span>
                              {item.hasDot && (
                                <span className="bg-[#538e53] rounded-full w-1 lg:w-2 h-1 lg:h-2"></span>
                              )}
                            </div>
                          </Link>
                        ) : (
                          <button
                            onClick={item.onClick}
                            className={`w-full cursor-pointer flex items-center gap-1.5 lg:gap-3 py-2 px-3.5 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                              isModalOpen && item.label === "Add Fleet"
                                ? "bg-[#CCE5CC80]"
                                : "hover:bg-[#f1f1f1]"
                            }`}
                          >
                            <item.icon />
                            <div className="flex items-center gap-1.5">
                              <span className="font-montserrat text-[#2b2b2b] text-center lg:text-left text-[9px] lg:text-[11px] font-normal">
                                {item.label}
                              </span>
                              {item.hasDot && (
                                <span className="bg-[#538e53] rounded-full w-1 lg:w-2 h-1 lg:h-2"></span>
                              )}
                            </div>
                          </button>
                        )}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              {idx < navSections.length - 1 && (
                <div className="bg-[#e2e2e2] w-full h-[1px] my-1"></div>
              )}
            </div>
          ))}
        </div>
        <ul className="mb-[2rem]">
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 py-2 px-4 rounded-md hover:bg-[#f1f1f1] transition-colors duration-200 lg:flex-row flex-col cursor-pointer`}
            >
              <LogoutIcon />
              <div className="flex items-center gap-3">
                <span className="font-montserrat text-[#2b2b2b] text-[10px] lg:text-[11.8px] font-normal">
                  Logout
                </span>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};
