"use client";
import React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSupportChannels } from "@/hooks/queries/useSupportQueries";
import { SupportChannel } from "@/services/supportService";

interface CustomerCareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const copy = async (channel: SupportChannel) => {
  try {
    await navigator.clipboard.writeText(channel.value);
    toast.success(`${channel.label} copied`);
  } catch {
    toast.error(`Could not copy the ${channel.label.toLowerCase()}`);
  }
};

/** Shared across `/agent/pending`, `/agent/received` and `/transporter/pending`.
 * Contacts come from `GET /api/support/contacts` — never hardcode numbers here. */
export const CustomerCareModal: React.FC<CustomerCareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { channels, isLoading, isError, refetch } = useSupportChannels();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-[10px] p-6 w-[90%] max-w-[400px]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        role="dialog"
        aria-modal="true"
        aria-label="Customer care"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-montserrat font-semibold text-[#2b2b2b]">
            Customer Care
          </h2>
          <button
            onClick={onClose}
            className="text-[#808080] hover:text-[#2b2b2b] cursor-pointer"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[54px] bg-[#f1f1f1] rounded-[4px] animate-pulse"
              />
            ))
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-sm font-montserrat text-[#808080]">
                Couldn&apos;t load support contacts.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-montserrat text-[#538e53] hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : channels.length === 0 ? (
            <p className="py-4 text-center text-sm font-montserrat text-[#808080]">
              No support contacts are available right now.
            </p>
          ) : (
            channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between gap-2 p-2 bg-[#f8f8f8] rounded-[4px]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-montserrat text-[#2b2b2b]">
                    {channel.label}
                  </p>
                  <a
                    href={channel.href}
                    target={channel.id === "whatsapp" ? "_blank" : undefined}
                    rel={
                      channel.id === "whatsapp" ? "noopener noreferrer" : undefined
                    }
                    className="text-sm font-montserrat text-[#538e53] hover:underline break-all"
                  >
                    {channel.value}
                  </a>
                </div>
                <button
                  onClick={() => copy(channel)}
                  className="shrink-0 text-[#538e53] hover:text-[#3d6b3d] cursor-pointer"
                  title={`Copy ${channel.label}`}
                  aria-label={`Copy ${channel.label}`}
                >
                  <CopyIcon />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-[#538e53] text-white rounded-[4px] font-montserrat text-sm hover:bg-[#3d6b3d] cursor-pointer"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

export default CustomerCareModal;
