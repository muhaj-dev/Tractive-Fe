"use client";
import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FrontendTransaction } from "@/services/transactionService";

interface TransactionDetailsModalProps {
  transaction: FrontendTransaction | null;
  onClose: () => void;
}

const formatNaira = (value?: number | null) =>
  `₦${Math.round(value ?? 0).toLocaleString()}`;

// `commissionRate` is a fraction (0.1 → "10%").
const formatRate = (rate?: number | null) =>
  typeof rate === "number" && Number.isFinite(rate)
    ? ` (${Number((rate * 100).toFixed(2))}%)`
    : "";

const formatDate = (dateString?: string) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

const StatusBadge = ({ status }: { status?: string }) => {
  const isApproved = status === "approved";
  return (
    <span
      className={`text-[11px] font-montserrat font-medium rounded-[4px] px-2 py-[2px] capitalize ${
        isApproved
          ? "bg-[#e7f3e7] text-[#538e53]"
          : "bg-[#fcf3e1] text-[#E0A63A]"
      }`}
    >
      {status || "—"}
    </span>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span className="text-[12px] font-montserrat text-[#808080]">{label}</span>
    <span className="text-[12px] font-montserrat text-[#2b2b2b] text-right">
      {value || "—"}
    </span>
  </div>
);

export const TransactionDetailsModal: React.FC<
  TransactionDetailsModalProps
> = ({ transaction, onClose }) => {
  return (
    <AnimatePresence>
      {transaction && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[10px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#e2e2e2] sticky top-0 bg-white rounded-t-[10px]">
              <h2 className="text-[16px] font-montserrat font-semibold text-[#2b2b2b]">
                Transaction Details
              </h2>
              <button
                onClick={onClose}
                className="text-[#808080] hover:text-[#2b2b2b] cursor-pointer text-xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Products */}
              <div>
                <h3 className="text-[12px] font-montserrat font-semibold text-[#2b2b2b] mb-2">
                  {(transaction.order?.products?.length ?? 0) > 1
                    ? "Products"
                    : "Product"}
                </h3>
                <div className="space-y-3">
                  {(transaction.order?.products ?? []).map((item, index) => {
                    const product = item.product;
                    return (
                      <div
                        key={item._id || index}
                        className="flex gap-3 p-2 bg-[#f8f8f8] rounded-[6px]"
                      >
                        <Image
                          src={
                            product?.images?.[0] ||
                            "/images/placeholder.png"
                          }
                          alt={product?.name || "Product"}
                          width={64}
                          height={64}
                          className="object-cover w-[64px] h-[64px] rounded-[6px] flex-shrink-0"
                        />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[13px] font-montserrat font-medium text-[#2b2b2b] truncate">
                            {product?.name || "Unnamed product"}
                          </span>
                          <span className="text-[11px] font-montserrat text-[#808080] line-clamp-2">
                            {product?.description || "No description"}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {product?.category && (
                              <span className="text-[10px] font-montserrat bg-[#eef] text-[#5b5bd6] rounded-[3px] px-1.5 py-[1px]">
                                {product.category}
                              </span>
                            )}
                            <span className="text-[11px] font-montserrat text-[#2b2b2b]">
                              {item.quantity ?? product?.quantity ?? 0}{" "}
                              {item.unit || product?.unit || ""}
                            </span>
                            {typeof item.lineSubtotal === "number" && (
                              <span className="text-[11px] font-montserrat text-[#538e53] font-medium">
                                · {formatNaira(item.lineSubtotal)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(transaction.order?.products?.length ?? 0) === 0 && (
                    <p className="text-[12px] font-montserrat text-[#808080]">
                      No product details available for this order.
                    </p>
                  )}
                </div>
              </div>

              {/* Transaction summary */}
              <div className="border-t border-[#e2e2e2] pt-3">
                <h3 className="text-[12px] font-montserrat font-semibold text-[#2b2b2b] mb-1">
                  Transaction
                </h3>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] font-montserrat text-[#808080]">
                    Status
                  </span>
                  <StatusBadge status={transaction.status} />
                </div>
                <InfoRow label="Amount" value={formatNaira(transaction.amount)} />
                <InfoRow
                  label={`Commission${formatRate(transaction.commissionRate)}`}
                  value={formatNaira(
                    transaction.commissionAmount ?? transaction.commission,
                  )}
                />
                <InfoRow
                  label="Payment method"
                  value={transaction.paymentMethod?.replace(/_/g, " ")}
                />
                <InfoRow label="Date" value={formatDate(transaction.createdAt)} />
              </div>

              {/* Buyer */}
              <div className="border-t border-[#e2e2e2] pt-3">
                <h3 className="text-[12px] font-montserrat font-semibold text-[#2b2b2b] mb-1">
                  Buyer
                </h3>
                <InfoRow label="Name" value={transaction.buyer?.name} />
                <InfoRow label="Email" value={transaction.buyer?.email} />
                <InfoRow label="Phone" value={transaction.buyer?.phone} />
              </div>
            </div>

            <div className="px-6 pb-5 pt-1">
              <button
                onClick={onClose}
                className="w-full py-2 bg-[#538e53] text-white rounded-[6px] font-montserrat text-sm hover:bg-[#3d6b3d] cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
