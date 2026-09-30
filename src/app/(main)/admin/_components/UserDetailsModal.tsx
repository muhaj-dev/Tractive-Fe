"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { AgentsProps, TransportersProps } from "@/utils/Approvals";
import { useModalA11y } from "@/hooks/useModalA11y";

export type UserKind = "agent" | "transporter";

interface UserDetailsModalProps {
  isOpen: boolean;
  kind: UserKind;
  user: AgentsProps | TransportersProps | null;
  isSubmitting?: boolean;
  canReject?: boolean;
  canApprove?: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusBadge: Record<
  NonNullable<AgentsProps["approvalStatus"]>,
  { label: string; classes: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  approved: {
    label: "Approved",
    classes: "bg-green-50 text-[#538e53] border border-green-200",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-50 text-[#D32F2F] border border-red-200",
  },
};

const formatDate = (raw?: string): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isTransporter = (
  user: AgentsProps | TransportersProps,
): user is TransportersProps =>
  Object.prototype.hasOwnProperty.call(user, "vehicleType") ||
  Object.prototype.hasOwnProperty.call(user, "plateNumber");

interface InfoRowProps {
  label: string;
  value?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-montserrat font-medium uppercase tracking-wide text-[#808080]">
      {label}
    </span>
    <span className="text-[13px] font-montserrat text-[#2b2b2b] break-words">
      {value && value.trim().length > 0 ? value : "—"}
    </span>
  </div>
);

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  kind,
  user,
  isSubmitting,
  canReject = true,
  canApprove = true,
  onClose,
  onApprove,
  onReject,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen && !!user, dialogRef, {
    onEscape: () => {
      if (!isSubmitting) onClose();
    },
  });

  const badge = user?.approvalStatus
    ? statusBadge[user.approvalStatus]
    : undefined;

  const transporter =
    user && isTransporter(user) ? (user as TransportersProps) : null;
  const agentBusinessName =
    user && !transporter ? (user as AgentsProps).businessName : undefined;

  return (
    <AnimatePresence>
      {isOpen && user && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-[200] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSubmitting && onClose()}
        >
          <motion.div
            ref={dialogRef}
            className="relative bg-[#fefefe] rounded-[10px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-xl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h2
                id="user-details-title"
                className="font-montserrat font-semibold text-[16px] text-[#2b2b2b]"
              >
                {kind === "agent" ? "Agent" : "Transporter"} Details
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-[#2b2b2b]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center gap-4">
                <Image
                  src={user.image || "/images/TopAgent.png"}
                  alt={user.fullname}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[15px] font-montserrat font-semibold text-[#2b2b2b] truncate">
                    {user.fullname}
                  </span>
                  <span className="text-[12px] font-montserrat text-[#808080] truncate">
                    {user.email}
                  </span>
                  {badge && (
                    <span
                      className={`mt-1 inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-montserrat font-medium ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <InfoRow label="Phone" value={user.mobile} />
                <InfoRow label="Profession" value={user.profession} />
                <InfoRow
                  label="Location"
                  value={user.state || user.location}
                />
                <InfoRow label="Address" value={user.address} />
                {transporter ? (
                  <>
                    <InfoRow
                      label="Vehicle Type"
                      value={transporter.vehicleType}
                    />
                    <InfoRow
                      label="Plate Number"
                      value={transporter.plateNumber}
                    />
                  </>
                ) : (
                  <>
                    <InfoRow label="NIN" value={(user as AgentsProps).NIN} />
                    <InfoRow label="Business Name" value={agentBusinessName} />
                  </>
                )}
                <InfoRow
                  label="Registered"
                  value={formatDate(user.createdAt || user.date)}
                />
                <InfoRow label="Account Status" value={user.status} />
              </div>

              {user.approvalNotes && (
                <div className="mt-5 p-3 rounded-[6px] bg-gray-50 border border-gray-100">
                  <span className="block text-[11px] font-montserrat font-medium uppercase tracking-wide text-[#808080] mb-1">
                    Approval Notes
                  </span>
                  <p className="text-[13px] font-montserrat text-[#2b2b2b] leading-relaxed">
                    {user.approvalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-[#fafafa] rounded-b-[10px]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer px-4 py-2 text-sm font-montserrat font-medium text-[#2b2b2b] border border-gray-300 rounded-[6px] hover:bg-gray-50 disabled:opacity-60"
              >
                Close
              </button>
              {canReject && onReject && (
                <button
                  type="button"
                  onClick={() => onReject(user.id)}
                  disabled={isSubmitting}
                  className="cursor-pointer px-4 py-2 text-sm font-montserrat font-medium text-[#fefefe] rounded-[6px] bg-[#D32F2F] hover:bg-[#b71c1c] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              )}
              {canApprove && onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(user.id)}
                  disabled={isSubmitting}
                  className="cursor-pointer px-4 py-2 text-sm font-montserrat font-medium text-[#fefefe] rounded-[6px] bg-[#538e53] hover:bg-[#467a46] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Approve
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
