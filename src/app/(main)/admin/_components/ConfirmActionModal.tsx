"use client";
import React, { RefObject, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalA11y } from "@/hooks/useModalA11y";

export type ConfirmActionTone = "success" | "danger" | "info";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone: ConfirmActionTone;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Show a free-text reason field (e.g. for a rejection). */
  reasonInput?: boolean;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /**
   * Optional handle on the dialog panel, for a parent modal that stacks this
   * dialog over its own: the parent points its focus trap at this panel while
   * it is open (see BiddersModal for the pattern).
   */
  panelRef?: RefObject<HTMLDivElement | null>;
}

const toneStyles: Record<
  ConfirmActionTone,
  {
    confirmBtn: string;
    iconWrap: string;
    iconStroke: string;
    icon: (props: { className?: string }) => React.ReactElement;
  }
> = {
  success: {
    confirmBtn: "bg-[#538e53] hover:bg-[#467a46]",
    iconWrap: "bg-[#538e53]/10",
    iconStroke: "text-[#538e53]",
    icon: ({ className }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
  danger: {
    confirmBtn: "bg-[#D32F2F] hover:bg-[#b71c1c]",
    iconWrap: "bg-red-50",
    iconStroke: "text-[#D32F2F]",
    icon: ({ className }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
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
    ),
  },
  info: {
    confirmBtn: "bg-[#2563eb] hover:bg-[#1d4ed8]",
    iconWrap: "bg-blue-50",
    iconStroke: "text-[#2563eb]",
    icon: ({ className }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    ),
  },
};

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone,
  isSubmitting,
  onCancel,
  onConfirm,
  reasonInput,
  reasonValue,
  onReasonChange,
  reasonLabel = "Reason",
  reasonPlaceholder = "Add a reason (optional)",
  panelRef,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const dialogRef = panelRef ?? localRef;
  const titleId = useId();
  useModalA11y(isOpen, dialogRef, {
    onEscape: () => {
      if (!isSubmitting) onCancel();
    },
  });

  const config = toneStyles[tone];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-[200] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSubmitting && onCancel()}
        >
          <motion.div
            ref={dialogRef}
            className="relative bg-[#fefefe] rounded-[10px] w-full max-w-[440px] p-6 shadow-xl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.iconWrap}`}
              >
                <Icon className={`w-6 h-6 ${config.iconStroke}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  id={titleId}
                  className="font-montserrat font-semibold text-[16px] sm:text-[17px] text-[#2b2b2b] mb-1"
                >
                  {title}
                </h2>
                {description && (
                  <p className="font-montserrat text-[12.5px] sm:text-[13px] text-[#5a5a5a] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {reasonInput && (
              <div className="mt-4">
                <label className="block font-montserrat text-[12.5px] font-medium text-[#2b2b2b] mb-1">
                  {reasonLabel}
                </label>
                <textarea
                  value={reasonValue ?? ""}
                  onChange={(e) => onReasonChange?.(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={reasonPlaceholder}
                  className="w-full resize-none rounded-[6px] border border-gray-300 px-3 py-2 font-montserrat text-[13px] text-[#2b2b2b] focus:outline-none focus:ring-[1px] focus:ring-[#538e53] disabled:opacity-60"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="cursor-pointer px-4 py-2 text-sm font-montserrat font-medium text-[#2b2b2b] border border-gray-300 rounded-[6px] hover:bg-gray-50 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-montserrat font-medium text-[#fefefe] rounded-[6px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${config.confirmBtn}`}
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {isSubmitting ? "Working..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
