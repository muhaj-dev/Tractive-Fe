"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { TransporterCustomer } from "@/services/transporterService";
import { formatCurrency } from "@/lib/format";
import { useModalA11y } from "@/hooks/useModalA11y";

interface CustomerInfoModalProps {
  customer: TransporterCustomer | null;
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

  useModalA11y(isOpen && !!customer, modalRef, { onEscape: onClose });

  if (!isOpen || !customer) return null;

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
          role="dialog"
          aria-modal="true"
          aria-labelledby="transporter-customer-info-title"
          className="bg-[#fefefe] rounded-[10px] shadow-md w-[90%] max-w-[400px] p-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              id="transporter-customer-info-title"
              className="text-[16px] font-montserrat font-medium text-[#2b2b2b]"
            >
              Customer Information
            </h2>
            <button
              onClick={onClose}
              className="text-[#808080] hover:text-[#2b2b2b] text-[14px] font-montserrat"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {customer.image && (
              <Image
                src={customer.image}
                alt={customer.name}
                width={60}
                height={60}
                className="rounded-full w-[60px] h-[60px] object-cover mx-auto"
              />
            )}
            <div className="text-[12px] font-montserrat text-[#2b2b2b]">
              <p>
                <span className="font-medium">Name:</span> {customer.name}
              </p>
              <p>
                <span className="font-medium">State:</span> {customer.state}
              </p>
              <p>
                <span className="font-medium">Revenue:</span>{" "}
                {typeof customer.revenue === "number"
                  ? formatCurrency(customer.revenue, { decimals: 2 })
                  : customer.revenue}
              </p>
              <p>
                <span className="font-medium">Orders:</span> {customer.orders}
              </p>
              <p>
                <span className="font-medium">Mobile:</span> {customer.mobile}
              </p>
              <p>
                <span className="font-medium">Date:</span> {customer.date}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-[#538e53] text-[#fefefe] text-[12px] font-montserrat py-2 rounded-[4px] hover:bg-[#467746] transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
