"use client";
import {
  AddToStoreIcon,
  Bag2Icon,
  BidsIcon,
  FarmersIcon,
  LogoutIcon,
  MessageQuestionIcon,
  MessagesIcon,
  MessageStarIcon,
  MoneyReceive2Icon,
  MoneyReceiveIcon,
  OverviewIcon,
  ProduceListIcon,
  Profile2UserIcon,
} from "@/icons/DashboardIcons";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import api from "@/lib/axios";
import AddToStore from "@/app/(main)/agent/_components/AddToStore";

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

export const AgentAsideNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const labelToRoute: { [key: string]: string } = {
    "Produce list": "/agent/produce-list",
    Farmers: "/agent/farmers",
    Bids: "/agent/bids",
    Orders: "/agent/new",
    Pending: "/agent/pending",
    Received: "/agent/received",
    Customers: "/agent/customers",
    Reviews: "/agent/reviews",
    Chat: "/agent/chat",
    Help: "/agent/help",
  };

  const navSections: NavSection[] = [
    {
      title: "Store",
      items: [
        {
          icon: AddToStoreIcon,
          label: "Add to store",
          onClick: () => setIsModalOpen(true),
        },
        {
          href: "/agent/produce-list",
          icon: ProduceListIcon,
          label: "Produce list",
        },
        { href: "/agent/farmers", icon: FarmersIcon, label: "Farmers" },
        { href: "/agent/bids", icon: BidsIcon, label: "Bids", hasDot: true },
      ],
    },
    {
      title: "Orders",
      items: [
        { href: "/agent/new", icon: Bag2Icon, label: "Orders", hasDot: true },
      ],
    },
    {
      title: "Transactions",
      items: [
        {
          href: "/agent/pending",
          icon: MoneyReceiveIcon,
          label: "Pending",
        },
        {
          href: "/agent/received",
          icon: MoneyReceive2Icon,
          label: "Received",
        },
      ],
    },
    {
      title: "Customers",
      items: [
        {
          href: "/agent/customers",
          icon: Profile2UserIcon,
          label: "Customers",
        },
        { href: "/agent/reviews", icon: MessageStarIcon, label: "Reviews" },
      ],
    },
    {
      title: "Others",
      items: [
        {
          href: "/agent/chat",
          icon: MessagesIcon,
          label: "Chat",
          hasDot: true,
        },
        { href: "/agent/help", icon: MessageQuestionIcon, label: "Help" },
      ],
    },
  ];

  const isActive = (label: string, href?: string) => {
    if (label === "Orders") {
      return ["/agent/new", "/agent/packed", "/agent/delivered"].some((r) =>
        pathname.startsWith(r),
      );
    }
    return pathname === (href ?? labelToRoute[label]);
  };

  return (
    <aside className="w-25 lg:w-50 bg-[#fefefe] fixed h-full hidden sm:block shadow-md z-20 overflow-y-auto Aside_hide-scrollbar">
      <AddToStore isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <Link
        href="/agent"
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
          {/* Overview */}
          <ul>
            <li>
              <Link
                href="/agent"
                className={`flex items-center gap-2 py-2 px-2 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                  pathname === "/agent"
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

          {/* Sections — always visible, no accordion */}
          {navSections.map((section, idx) => (
            <div key={section.title}>
              {/* Section label */}
              <p className="font-montserrat text-[#2b2b2b] text-[11px] font-normal py-2 px-2.5 truncate hidden lg:block">
                {section.title}
              </p>

              {/* Items */}
              <ul>
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-1.5 lg:gap-3 py-2 px-3.5 rounded-md transition-colors duration-200 lg:flex-row flex-col ${
                          isActive(item.label, item.href)
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
                          isModalOpen && item.label === "Add to store"
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
              </ul>

              {idx < navSections.length - 1 && (
                <div className="bg-[#e2e2e2] w-full h-[1px] my-1"></div>
              )}
            </div>
          ))}
        </div>

        {/* Logout */}
        <ul className="mb-[2rem]">
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-2 px-4 rounded-md hover:bg-[#f1f1f1] transition-colors duration-200 lg:flex-row flex-col cursor-pointer"
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
