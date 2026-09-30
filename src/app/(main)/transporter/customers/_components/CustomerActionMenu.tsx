"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TransportActionMenuProps } from "../../_components/TransportActionMenuProps";
import { ThreeDotIcon } from "../../fleet-list/_components/table/ActionMenu";

export const CustomerActionMenu: React.FC<TransportActionMenuProps> = ({
  driverId,
  activeMenu,
  setActiveMenu,
  handleCustomerInfo,
  handleSupport,
}) => {
  const isActive = activeMenu === driverId;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveMenu]);

  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        title="Open action menu"
        aria-label="Open action menu"
        onClick={() => setActiveMenu(isActive ? null : driverId)}
        className="bg-[#f1f1f1] rounded-full cursor-pointer p-1.5 w-[30px] h-[30px] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors duration-200"
      >
        <ThreeDotIcon />
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute w-[8rem] py-1 px-1 -bottom-[0.4rem] -left-[8.4rem] bg-[#fefefe] rounded-[5px] shadow-lg pointer-events-auto z-[100]"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/transporter/chat"
              className="block w-full text-left px-2 text-[12px] font-montserrat text-[#2b2b2b] hover:bg-gray-100"
            >
              Chat
            </Link>
            <button
              onClick={() => {
                handleCustomerInfo?.(driverId);
                setActiveMenu(null);
              }}
              className="block w-full text-left px-2 cursor-pointer text-[12px] font-montserrat text-[#2b2b2b] hover:bg-gray-100"
            >
              Customer Info
            </button>
            <button
              onClick={() => {
                handleSupport?.(driverId);
                setActiveMenu(null);
              }}
              className="block w-full text-left px-2 cursor-pointer text-[12px] font-montserrat text-[#2b2b2b] hover:bg-gray-100"
            >
              Support
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
