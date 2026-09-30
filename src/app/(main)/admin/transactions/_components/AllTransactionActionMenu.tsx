"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminActionMenuProps } from "../../_components/AdminActionMenuProps";
import { ThreeDotIcon } from "@/app/(main)/agent/produce-list/_components/table/ActionMenu";
import { ContactCustomerCareModal } from "./ContactCustomerCareModal";

/**
 * Action menu for the "All" transactions tab.
 *
 * The per-status menus (`TransactionActionMenu`, `ApprovedActionMenu`,
 * `RefundedActionMenu`) each gate their dropdown on a single hardcoded status —
 * e.g. `status === "Pending"`. That works on a tab where every row shares one
 * status, but on "All" the rows are mixed, so every non-pending row rendered a
 * three-dot button that opened nothing. This menu picks its actions from the
 * row's own status instead, and renders no button at all when a row has none —
 * a dead control is worse than an absent one.
 */
export const AllTransactionActionMenu: React.FC<AdminActionMenuProps> = ({
  userTypeId,
  status,
  handleApprove,
  handleDecline,
  handleRefund,
  handleProfile,
  handleViewProfile,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  // Compare case-insensitively: the pill label is title-case ("Pending") but the
  // API status is lower-case, and rows have been seen carrying either.
  const rowStatus = (status || "").toLowerCase();

  type MenuItem = { key: string; label: string; onClick: () => void };
  const items: MenuItem[] = [];

  if (
    rowStatus === "pending" ||
    rowStatus === "rejected" ||
    rowStatus === "failed"
  ) {
    if (handleApprove) {
      items.push({
        key: "approve",
        label: "Approve",
        onClick: () => handleApprove(userTypeId),
      });
    }
    if (handleDecline) {
      items.push({
        key: "decline",
        label: "Decline",
        onClick: () => handleDecline(userTypeId),
      });
    }
  }

  if (rowStatus === "approved" && handleRefund) {
    items.push({
      key: "refund",
      label: "Refund",
      onClick: () => handleRefund(userTypeId),
    });
  }

  if (rowStatus === "refunded") {
    const profile = handleProfile ?? handleViewProfile;
    if (profile) {
      items.push({
        key: "profile",
        label: "Profile",
        onClick: () => profile(userTypeId),
      });
    }
    items.push({
      key: "contact",
      label: "Contact customer care",
      onClick: () => setIsContactOpen(true),
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        title="Open action menu"
        aria-label="Open action menu"
        aria-haspopup="menu"
        aria-expanded={isActive}
        onClick={() => setIsActive(!isActive)}
        className="bg-[#f1f1f1] rounded-full cursor-pointer p-1.5 w-[30px] h-[30px] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors duration-200"
      >
        <ThreeDotIcon />
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute min-w-[170px] right-11 -top-3 bg-[#fefefe] rounded-[7px] shadow-lg z-[100]"
            role="menu"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
          >
            {items.map((item) => (
              <button
                key={item.key}
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  setIsActive(false);
                }}
                className="w-full text-left px-2 py-1 text-[13px] font-montserrat text-[#2b2b2b] cursor-pointer rounded-[4px] hover:bg-gray-100"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ContactCustomerCareModal
        isOpen={isContactOpen}
        transactionId={userTypeId}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};
