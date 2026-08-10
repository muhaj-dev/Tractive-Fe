"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons/Icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  OverviewIcon,
  UserIcon,
  Bag2Icon,
  Profile2User,
  moneyChange,
  userRemoveIcon,
  UserTickIcons,
  userMinusIcon,
  SettingIcon,
} from "@/app/(main)/admin/_components/icons/AdminIcons";
import { Admin_ProfileDropDownMobile } from "@/components/Profile_dropdowns/AdminProfile_dropdown/Admin_ProfileDropDownMobile";

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

interface AdminAsideNavMobileProps {
  user: { name: string; email: string } | null;
  isDropdownOpen: boolean;
  handleUserDropdownClick: () => void;
  handleLogout: () => void;
  closeDropdown: () => void;
}

export const AdminAsideNavMobile = ({
  user,
  isDropdownOpen,
  handleUserDropdownClick,
  handleLogout,
  closeDropdown,
}: AdminAsideNavMobileProps) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    Store: false,
    Bookings: false,
    Transactions: false,
    Customers: false,
    Others: false,
  });
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Now used for modal
  const profileRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  const toggleSection = (section: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle opening/closing the modal
  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  // Close modal when clicking outside
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
      if (
        modalRef.current &&
        !modalRef.current.contains(target) &&
        isModalOpen
      ) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown, isModalOpen]);

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
    // "Reports" (/admin/query, /admin/live-chat) removed, and /admin/chat
    // dropped from "Others": none of those routes exist, so every link 404'd.
    {
      title: "Others",
      items: [
        // `/admin/track-orders` has no page of its own — only `track-agent` and
        // `track-transporter` children — so the bare parent 404s. The desktop nav
        // already points at the child; this one did not.
        {
          href: "/admin/track-orders/track-agent",
          icon: Bag2Icon,
          label: "Track Orders",
        },
        {
          icon: Bag2Icon, // Example icon, replace with appropriate icon
          label: "Add to store",
          onClick: toggleModal, // Toggle modal on click
          hasDot: true,
        },
        { href: "/admin/settings", icon: SettingIcon, label: "Settings" },
      ],
    },
  ];

  const sectionVariants: Variants = {
    initial: { height: 0, opacity: 0 },
    animate: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
    },
  };

  const itemVariants: Variants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 10, opacity: 0 },
  };

  const modalVariants: Variants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <aside className="w-[95%] rounded-[0.4rem] mx-auto block sm:hidden pb-6 shadow-md mt-[1.3rem] z-20">
      {user && (
        <div className="relative px-2 pt-4" ref={profileRef}>
          <div className="flex items-center justify-between gap-2 cursor-pointer bg-[#3a3a3a] p-1.5 px-2.5 rounded-[4px] hover:bg-[#4a4a4a] transition">
            <button
              className="flex items-center gap-2"
              onClick={handleUserDropdownClick}
            >
              <Image
                src="/images/profile_image.png"
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
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
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                className="w-full rounded-[4px] mt-2 z-30 bg-[#fefefe] shadow-lg"
              >
                <Admin_ProfileDropDownMobile onLogout={handleLogout} />
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
            <div className="flex flex-col gap-10">
              <div className="flex flex-col px-1">
                <ul className="mt-4 px-2">
                  <li>
                    <Link
                      href="/admin"
                      className={`flex items-start w-16 flex-col bg-[#3a3a3a] gap-2 py-2 px-2 rounded-md transition-colors duration-200 ${
                        pathname === "/admin"
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
                    <button
                      onClick={(e) => toggleSection(section.title, e)}
                      className="flex items-center justify-between w-full rounded-md cursor-pointer py-2 px-2.5 text-left font-montserrat text-[#fefefe] text-[11px] font-normal bg-[#3a3a3a] transition-colors duration-200 hover:bg-[#4a4a4a]"
                    >
                      <p className="truncate">{section.title}</p>
                      <div className="flex items-center gap-2">
                        {openSections[section.title] ? (
                          <ArrowUpIcon stroke="#fefefe" />
                        ) : (
                          <ArrowDownIcon stroke="#fefefe" />
                        )}
                      </div>
                    </button>
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
                                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                                }}
                            >
                              {item.href ? (
                                <Link
                                  href={item.href}
                                  className={`flex flex-col items-start gap-2.5 py-2 px-3.5 rounded-md transition-colors duration-200 ${
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

      {/* Modal for "Add to store" */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              ref={modalRef}
              className="bg-[#fefefe] rounded-[8px] p-6 w-[90%] max-w-[400px] shadow-lg"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="text-[16px] font-montserrat font-medium text-[#2b2b2b] mb-4">
                Add to Store
              </h2>
              <p className="text-[14px] font-montserrat text-[#2b2b2b] mb-6">
                This is a placeholder for the &quot;Add to store&quot; modal. Add your
                form or content here.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={toggleModal}
                  className="px-4 py-2 bg-[#e0e0e0] text-[#2b2b2b] rounded-[4px] font-montserrat text-[14px] hover:bg-[#d0d0d0]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log("Add to store submitted");
                    toggleModal();
                  }}
                  className="px-4 py-2 bg-[#538e53] text-[#fefefe] rounded-[4px] font-montserrat text-[14px] hover:bg-[#468246]"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
