"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCallFill } from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import { useSupportHotlines } from "@/hooks/queries/useSupportQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Overrides the numbers from `GET /api/support/contacts` when supplied. */
  hotlines?: string[];
  onLiveChat?: () => void;
}

export const LiveChatModal: React.FC<Props> = ({
  open,
  onClose,
  hotlines,
  onLiveChat,
}) => {
  const { hotlines: supportHotlines, isLoading: isLoadingHotlines } =
    useSupportHotlines();
  const numbers = hotlines ?? supportHotlines;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Live chat"
        >
          <motion.div
            className="relative bg-[#fefefe] rounded-[12px] shadow-lg w-full max-w-[360px] px-6 pt-6 pb-5"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close live chat"
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#f1f1f1] hover:bg-[#e0e0e0] flex items-center justify-center cursor-pointer text-[#2b2b2b]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 3l8 8M11 3l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex justify-center">
              <Image
                src="/images/customerService.png"
                alt="Live chat"
                width={189}
                height={189}
                className="object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={onLiveChat}
              className="mt-4 w-full bg-[#538e53] hover:bg-[#467346] text-[#fefefe] font-montserrat font-medium text-[14px] rounded-[24px] py-3 cursor-pointer transition-colors"
            >
              Live Chat
            </button>

            {(isLoadingHotlines || numbers.length > 0) && (
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 font-montserrat text-[12px] text-[#2b2b2b]">
                  <PhoneCallFill />
                  Hotlines:
                </span>
                {isLoadingHotlines && numbers.length === 0 ? (
                  <span className="h-[14px] w-[110px] rounded bg-[#f1f1f1] animate-pulse" />
                ) : (
                  numbers.map((h, i) => (
                    <a
                      key={`${h}-${i}`}
                      href={`tel:${h.replace(/\s+/g, "")}`}
                      className="font-montserrat text-[12px] text-[#538e53] hover:underline"
                    >
                      {h}
                    </a>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
