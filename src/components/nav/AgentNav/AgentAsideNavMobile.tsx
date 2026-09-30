"use client";
import {
  AddToStoreIcon,
  Bag2Icon,
  BidsIcon,
  FarmersIcon,
  MessageQuestionIcon,
  MessagesIcon,
  MessageStarIcon,
  MoneyReceive2Icon,
  MoneyReceiveIcon,
  OverviewIcon,
  ProduceListIcon,
  Profile2UserIcon,
} from "../../../icons/DashboardIcons";
import { ArrowDownIcon, ArrowUpIcon } from "../../../icons/Icons";
import { CurrentUserAvatar } from "@/components/CurrentUserAvatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AddToStore } from "../../../app/(main)/agent/_components/AddToStore";
import { Agent_ProfileDropDownMobile } from "../../Profile_dropdowns/ProfileDropDown/Agent_ProfileDropDownMobile";

interface NavSection {
  title: string;
  items: {
    href?: string;
    icon: React.ComponentType<{ stroke?: string; fill?: string }>;
    label: string;
    hasDot?: boolean;
    onClick?: () => void;
  }[];
}

interface AgentAsideNavMobileProps {
  user: { name: string; email: string } | null;
  isDropdownOpen: boolean;
  handleUserDropdownClick: () => void;
  handleLogout: () => void;
  closeDropdown: () => void;
}

export const AgentAsideNavMobile = ({
  user,
  isDropdownOpen,
  handleUserDropdownClick,
  handleLogout,
  closeDropdown,
}: AgentAsideNavMobileProps) => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        profileRef.current &&
        !profileRef.current.contains(target) &&
        navRef.current &&
        !navRef.current.contains(target) &&
        isDropdownOpen
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

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

  const sectionVariants: Variants = {
    initial: { height: 0, opacity: 0 },
    animate: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  };

  const itemVariants: Variants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 10, opacity: 0 },
  };

  const isActive = (label: string, href?: string) => {
    if (label === "Orders") {
      return ["/agent/new", "/agent/packed", "/agent/delivered"].some((r) =>
        pathname.startsWith(r),
      );
    }
    return pathname === href;
  };

  return (
    <aside className="w-[95%] rounded-[0.4rem] mx-auto block sm:hidden pb-6 shadow-md mt-[1.3rem] z-20">
      <AddToStore isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {user && (
        <div className="relative px-[0.5rem] pt-[1rem]" ref={profileRef}>
          <div className="flex items-center justify-between gap-2 cursor-pointer bg-[#3a3a3a] p-1.5 px-2.5 rounded-[4px] hover:bg-[#4a4a4a] transition">
            <button
              className="flex items-center gap-2"
              onClick={handleUserDropdownClick}
            >
              <CurrentUserAvatar size={32} />
              <div className="flex flex-col">
                <span className="text-[#fefefe] text-[0.7rem] text-left font-montserrat font-normal">
                  {user.name}
                </span>
                <span className="text-[#fefefe] text-[0.7rem] text-left font-montserrat font-normal">
                  {user.email}
                </span>
              </div>
            </button>
            <button onClick={toggleNav}>
              {isNavOpen ? (
                <ArrowUpIcon stroke="#fefefe" className="h-4 w-4" />
              ) : (
                <ArrowDownIcon stroke="#fefefe" className="h-4 w-4" />
              )}
            </button>
          </div>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="w-full rounded-[4px] mt-2 z-30 bg-[#fefefe] shadow-lg"
              >
                <Agent_ProfileDropDownMobile onLogout={handleLogout} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            ref={navRef}
            className="flex flex-col gap-[2.5rem]"
          >
            <div className="flex flex-col gap-[2.5rem]" ref={navRef}>
              <div className="flex flex-col px-1">
                {/* Overview */}
                <ul className="mt-[1rem] px-[0.5rem]">
                  <li>
                    <Link
                      href="/agent"
                      className={`flex items-start w-[4rem] flex-col bg-[#3a3a3a] gap-2 py-2 px-2 rounded-md transition-colors duration-200 ${
                        pathname === "/agent"
                          ? "bg-[#3a3a3a]"
                          : "hover:bg-[#4a4a4a]"
                      }`}
                    >
                      <OverviewIcon fill="#fefefe" stroke="#fefefe" />
                      <span className="font-montserrat text-[#fefefe] text-[11px] font-medium">
                        Overview
                      </span>
                    </Link>
                  </li>
                </ul>

                <span className="bg-[#e2e2e2] w-full h-[1px] my-1"></span>

                {/* Sections — always visible, no per-section accordion */}
                {navSections.map((section, idx) => (
                  <div key={section.title} className="px-[0.5rem]">
                    {/* Section label */}
                    <p className="font-montserrat text-[#fefefe] text-[11px] font-normal py-2 px-2.5 bg-[#3a3a3a] rounded-md">
                      {section.title}
                    </p>
                    <div className="block lg:hidden bg-[#e2e2e2] w-full h-[1px] my-1"></div>

                    {/* Items */}
                    <ul className="grid grid-cols-4 gap-1.5">
                      {section.items.map((item, index) => (
                        <motion.li
                          key={item.href || item.label}
                          variants={itemVariants}
                          transition={{
                            delay: index * 0.1,
                            duration: 0.3,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                        >
                          {item.href ? (
                            <Link
                              href={item.href}
                              className={`flex flex-col items-start gap-2.5 py-2 px-3.5 rounded-md transition-colors duration-200 ${
                                isActive(item.label, item.href)
                                  ? "bg-[#3a3a3a] text-[#fefefe]"
                                  : "bg-[#2b2b2b] text-[#fefefe] hover:bg-[#4a4a4a]"
                              }`}
                            >
                              <item.icon stroke="#fefefe" fill="#fefefe" />
                              <div className="flex items-center gap-1.5">
                                <span className="font-montserrat text-[#fefefe] text-left text-[11px] font-normal">
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
                              className={`flex flex-col items-start gap-2.5 py-2 px-3.5 rounded-md transition-colors duration-200 ${
                                isModalOpen && item.label === "Add to store"
                                  ? "bg-[#3a3a3a] text-[#fefefe]"
                                  : "bg-[#2b2b2b] text-[#fefefe] hover:bg-[#4a4a4a]"
                              }`}
                            >
                              <item.icon stroke="#fefefe" fill="#fefefe" />
                              <div className="flex items-center gap-1.5">
                                <span className="font-montserrat text-[#fefefe] text-left text-[11px] font-normal">
                                  {item.label}
                                </span>
                                {item.hasDot && (
                                  <span className="bg-[#538e53] rounded-full w-1 lg:w-2 h-1 lg:h-2"></span>
                                )}
                              </div>
                            </button>
                          )}
                        </motion.li>
                      ))}
                    </ul>

                    {idx < navSections.length - 1 && (
                      <div className="bg-[#e2e2e2] w-full h-[1px] my-1"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
