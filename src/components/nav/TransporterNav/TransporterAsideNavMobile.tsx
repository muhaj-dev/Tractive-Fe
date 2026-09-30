"use client";
import {
  AddToStoreIcon,
  Bag2Icon,
  BidsIcon,
  BoxTickIcon,
  FarmersIcon,
  MessageQuestionIcon,
  MessagesIcon,
  MessageStarIcon,
  MoneyReceiveIcon,
  OverviewIcon,
  PackedIcon,
  ProduceListIcon,
  Profile2UserIcon,
} from "../../../icons/DashboardIcons";
import { ArrowDownIcon, ArrowUpIcon } from "../../../icons/Icons";
import { CurrentUserAvatar } from "@/components/CurrentUserAvatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Transporter_ProfileDropDownMobile } from "../../Profile_dropdowns/TransporterProfile_dropdown/Transporter_ProfileDropDownMobile";
import AddFleet from "../../../app/(main)/transporter/_components/AddFleet";

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

interface TransporterAsideNavMobileProps {
  user: { name: string; email: string } | null;
  isDropdownOpen: boolean;
  handleUserDropdownClick: () => void;
  handleLogout: () => void;
  closeDropdown: () => void;
}

export const TransporterAsideNavMobile = ({
  user,
  isDropdownOpen,
  handleUserDropdownClick,
  handleLogout,
  closeDropdown,
}: TransporterAsideNavMobileProps) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    Store: false,
    Bookings: false,
    Transactions: false,
    Customers: false,
    Others: false,
  });
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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

  return (
    <aside className="w-[95%] rounded-[0.4rem] mx-auto block sm:hidden pb-6 shadow-md mt-[1.3rem] z-20">
        <AddFleet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {user && (
        <div className="relative px-2 pt-4" ref={profileRef}>
          <div className="flex items-center justify-between w-full gap-2 cursor-pointer bg-[#3a3a3a] p-1.5 px-2.5 rounded-[4px] hover:bg-[#4a4a4a] transition">
            <button
              className="flex items-center gap-2"
              onClick={handleUserDropdownClick}
            >
              <CurrentUserAvatar size={32} />
              <div className="flex flex-col">
                <span className="text-[#fefefe] text-[0.8rem] text-left font-normal">
                  {user.name}
                </span>
                <span className="text-[#fefefe] text-[0.8rem] text-left font-normal">
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
                <Transporter_ProfileDropDownMobile onLogout={handleLogout} />
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
            className="flex flex-col gap-10"
          >
            <div className="flex flex-col gap-10" ref={navRef}>
              <div className="flex flex-col px-1">
                <ul className="mt-4 px-2">
                  <li>
                    <Link
                      href="/transporter"
                      className={`flex items-start w-16 flex-col bg-[#3a3a3a] gap-2 py-2 px-2 rounded-md transition-colors duration-200 ${
                        pathname === "/transporter"
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
                <span className="bg-[#e2e2e2] w-full h-px my-1"></span>
                {navSections.map((section, idx) => (
                  <div key={section.title} className="px-2">
                    <div className="flex items-center justify-between w-full rounded-md cursor-pointer py-2 px-2.5 bg-[#3a3a3a] transition-colors duration-200 hover:bg-[#4a4a4a]">
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="flex items-center justify-between w-full text-left font-montserrat text-[#fefefe] text-[11px] font-normal"
                      >
                        <p className="truncate">{section.title}</p>
                        {openSections[section.title] ? (
                          <ArrowUpIcon stroke="#fefefe" className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon stroke="#fefefe" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="block lg:hidden bg-[#e2e2e2] w-full h-px my-1"></div>
                    <AnimatePresence>
                      {openSections[section.title] && (
                        <motion.ul
                          variants={sectionVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="overflow-hidden grid grid-cols-4 gap-1.5"
                        >
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
                                  className={`flex flex-col gap-2.5 py-2 px-3.5 rounded-md transition-colors duration-200 ${
                                    pathname === item.href
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
                                    isModalOpen && item.label === "Add Fleet"
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
                        </motion.ul>
                      )}
                    </AnimatePresence>
                    {idx < navSections.length - 1 && (
                      <div className="bg-[#e2e2e2] w-full h-px my-1"></div>
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
