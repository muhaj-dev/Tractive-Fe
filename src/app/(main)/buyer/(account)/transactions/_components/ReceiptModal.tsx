"use client";
import React, { useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useModalA11y } from "@/hooks/useModalA11y";
import type { BuyerTransactionRow } from "./transactionsData";

interface Props {
  open: boolean;
  onClose: () => void;
  transaction: BuyerTransactionRow | null;
}

const statusLabel: Record<BuyerTransactionRow["status"], string> = {
  pending: "Pending",
  approved: "Approved",
};

const statusTone: Record<BuyerTransactionRow["status"], string> = {
  pending: "bg-[#fff4e5] text-[#b26a00]",
  approved: "bg-[#eaf6ea] text-[#2a6b2a]",
};

const Line: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="font-montserrat text-[12px] text-[#808080]">{label}</span>
    <span className="font-montserrat text-[12px] text-[#2b2b2b] text-right">
      {value}
    </span>
  </div>
);

export const ReceiptModal: React.FC<Props> = ({
  open,
  onClose,
  transaction,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(open && !!transaction, dialogRef, { onEscape: onClose });

  return (
    <AnimatePresence>
      {open && transaction && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Transaction receipt"
            className="relative bg-[#fefefe] rounded-[12px] shadow-lg w-full max-w-[400px] px-6 pt-6 pb-5"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close receipt"
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#f1f1f1] hover:bg-[#e0e0e0] flex items-center justify-center cursor-pointer text-[#2b2b2b]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 3l8 8M11 3l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <h3 className="font-montserrat font-medium text-[15px] text-[#2b2b2b]">
              Receipt
            </h3>
            <p className="font-montserrat text-[11px] text-[#808080] mt-0.5">
              Transaction ID: {transaction.id}
            </p>

            <div className="flex items-center gap-3 mt-4 pb-4 border-b border-[#eeeeee]">
              <div className="w-[54px] h-[44px] rounded-[6px] overflow-hidden bg-[#f1f1f1] flex-shrink-0">
                <Image
                  src={transaction.image}
                  alt={transaction.item}
                  width={54}
                  height={44}
                  className="object-cover w-[54px] h-[44px]"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-montserrat text-[13px] text-[#2b2b2b]">
                  {transaction.item}
                </span>
                <span className="font-montserrat text-[10px] text-[#808080]">
                  Product ID: {transaction.productId.slice(0, 8)}
                </span>
              </div>
              <span
                className={`ml-auto font-montserrat text-[10px] px-2 py-1 rounded-full ${statusTone[transaction.status]}`}
              >
                {statusLabel[transaction.status]}
              </span>
            </div>

            <div className="mt-2 divide-y divide-[#f3f3f3]">
              <Line label="Quantity" value={transaction.quantity} />
              <Line label="Seller" value={transaction.seller} />
              <Line label="Payment method" value={transaction.method} />
              <Line label="Date" value={transaction.date} />
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#eeeeee]">
              <span className="font-montserrat font-medium text-[13px] text-[#2b2b2b]">
                Total
              </span>
              <span className="font-montserrat font-semibold text-[15px] text-[#538e53]">
                ₦{transaction.amount.toLocaleString()}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
