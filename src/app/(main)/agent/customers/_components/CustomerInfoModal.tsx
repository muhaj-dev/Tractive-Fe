"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Customer } from "@/services/customerService";

interface CustomerInfoModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen || !customer) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-[200]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          ref={modalRef}
          className="bg-[#fefefe] rounded-[10px] shadow-lg w-[90%] max-w-[500px] p-6 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-montserrat font-semibold text-[#2b2b2b]">
              Customer Information
            </h2>
            <button
              onClick={onClose}
              className="text-[#808080] hover:text-[#2b2b2b] text-[20px] font-montserrat transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Customer Image */}
          <div className="flex justify-center mb-6">
            <Avatar
              src={customer.image}
              alt={customer.name}
              size={80}
              className="rounded-full w-[80px] h-[80px] object-cover border-2 border-gray-200"
            />
          </div>

          {/* Customer Details */}
          <div className="space-y-4">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                Full Name
              </span>
              <span className="text-[13px] font-montserrat text-[#2b2b2b]">
                {customer.name}
              </span>
            </div>

            {/* Email */}
            {customer.email && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                  Email Address
                </span>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-[13px] font-montserrat text-[#538e53] hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            )}

            {/* Mobile */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                Mobile Number
              </span>
              <a
                href={`tel:${customer.mobile}`}
                className="text-[13px] font-montserrat text-[#538e53] hover:underline"
              >
                {customer.mobile}
              </a>
            </div>

            {/* State/Location */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                State/Location
              </span>
              <span className="text-[13px] font-montserrat text-[#2b2b2b]">
                {customer.state || "—"}
              </span>
            </div>

            {/* Address */}
            {customer.address && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                  Address
                </span>
                <span className="text-[13px] font-montserrat text-[#2b2b2b]">
                  {customer.address}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#e2e2e2] my-4"></div>

            {/* Statistics Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Revenue */}
              <div className="flex flex-col gap-1 bg-[#f9f9f9] p-3 rounded-[6px]">
                <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                  Total Revenue
                </span>
                <span className="text-[15px] font-montserrat font-semibold text-[#538e53]">
                  {formatCurrency(customer.revenue)}
                </span>
              </div>

              {/* Orders */}
              <div className="flex flex-col gap-1 bg-[#f9f9f9] p-3 rounded-[6px]">
                <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                  Total Orders
                </span>
                <span className="text-[15px] font-montserrat font-semibold text-[#2b2b2b]">
                  {customer.orders}
                </span>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                Registration Date
              </span>
              <span className="text-[13px] font-montserrat text-[#2b2b2b]">
                {formatDate(customer.date)}
              </span>
            </div>

            {/* Last Order */}
            {customer.lastOrderAt && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                  Last Order
                </span>
                <span className="text-[13px] font-montserrat text-[#2b2b2b]">
                  {formatDate(customer.lastOrderAt)}
                </span>
              </div>
            )}

            {/* Timestamps */}
            {(customer.createdAt || customer.updatedAt) && (
              <>
                <div className="w-full h-[1px] bg-[#e2e2e2] my-4"></div>

                {customer.createdAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                      Account Created
                    </span>
                    <span className="text-[12px] font-montserrat text-[#2b2b2b]">
                      {formatDate(customer.createdAt)}
                    </span>
                  </div>
                )}

                {customer.updatedAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-montserrat font-medium text-[#808080] uppercase">
                      Last Updated
                    </span>
                    <span className="text-[12px] font-montserrat text-[#2b2b2b]">
                      {formatDate(customer.updatedAt)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-6 w-full bg-[#538e53] text-[#fefefe] text-[13px] font-montserrat py-2.5 rounded-[6px] hover:bg-[#467746] transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
