"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  transactionService,
  ContactCustomerCareData,
} from "@/services/transactionService";
import { useModalA11y } from "@/hooks/useModalA11y";

const MESSAGE_MAX_LENGTH = 1000;

type Priority = ContactCustomerCareData["priority"];

const PRIORITY_OPTIONS: { value: Priority; label: string; active: string }[] = [
  { value: "low", label: "Low", active: "bg-[#538e53] border-[#538e53]" },
  { value: "medium", label: "Medium", active: "bg-[#2563eb] border-[#2563eb]" },
  { value: "high", label: "High", active: "bg-[#D32F2F] border-[#D32F2F]" },
];

/** Prefer the server-provided message, then the thrown Error message. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  const serverMessage = (
    error as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

interface ContactCustomerCareModalProps {
  isOpen: boolean;
  transactionId: string | null;
  onClose: () => void;
  onSent?: () => void;
}

export const ContactCustomerCareModal: React.FC<
  ContactCustomerCareModalProps
> = ({ isOpen, transactionId, onClose, onSent }) => {
  const [message, setMessage] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const messageId = useId();
  const counterId = useId();
  const priorityLabelId = useId();

  const resetForm = useCallback(() => {
    setMessage("");
    setPriority("medium");
  }, []);

  const requestClose = useCallback(() => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  // Fresh form every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    resetForm();
  }, [isOpen, resetForm]);

  // Focus lands on the message field; Escape closes (unless submitting).
  useModalA11y(isOpen, dialogRef, {
    initialFocusRef: textareaRef,
    onEscape: requestClose,
  });

  const trimmedMessage = message.trim();
  const canSubmit = !!transactionId && trimmedMessage.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!transactionId || !trimmedMessage || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await transactionService.contactCustomerCare(transactionId, {
        message: trimmedMessage,
        priority,
      });
      toast.success("Message sent to customer care");
      resetForm();
      onClose();
      onSent?.();
    } catch (err) {
      toast.error(
        readErrorMessage(err, "Failed to contact customer care"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-[200] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            // Stop the click reaching the underlying table row's onRowClick.
            e.stopPropagation();
            requestClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            className="relative bg-[#fefefe] rounded-[10px] w-full max-w-[480px] p-6 shadow-xl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#2563eb]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h8M8 14h5m-1 7l-4-4H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-4l-2 4z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  id={titleId}
                  className="font-montserrat font-semibold text-[16px] sm:text-[17px] text-[#2b2b2b] mb-1"
                >
                  Contact customer care
                </h2>
                <p
                  id={descriptionId}
                  className="font-montserrat text-[12.5px] sm:text-[13px] text-[#5a5a5a] leading-relaxed"
                >
                  Send a note to the customer care team about this transaction.
                  They will follow up with the buyer and seller.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor={messageId}
                className="block font-montserrat text-[12.5px] font-medium text-[#2b2b2b] mb-1"
              >
                Message <span className="text-[#D32F2F]">*</span>
              </label>
              <textarea
                id={messageId}
                ref={textareaRef}
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))
                }
                disabled={isSubmitting}
                rows={4}
                maxLength={MESSAGE_MAX_LENGTH}
                required
                aria-required="true"
                aria-describedby={counterId}
                placeholder="Describe the issue customer care should look into…"
                className="w-full resize-none rounded-[6px] border border-gray-300 px-3 py-2 font-montserrat text-[13px] text-[#2b2b2b] focus:outline-none focus:ring-[1px] focus:ring-[#538e53] disabled:opacity-60"
              />
              <p
                id={counterId}
                className="mt-1 text-right font-montserrat text-[11px] text-[#808080]"
              >
                {message.length}/{MESSAGE_MAX_LENGTH}
              </p>
            </div>

            <fieldset className="mt-2" disabled={isSubmitting}>
              <legend
                id={priorityLabelId}
                className="font-montserrat text-[12.5px] font-medium text-[#2b2b2b] mb-1.5"
              >
                Priority
              </legend>
              <div className="flex flex-wrap items-center gap-2">
                {PRIORITY_OPTIONS.map((option) => {
                  const selected = priority === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer inline-flex items-center rounded-full border px-3.5 py-1.5 font-montserrat text-[12.5px] font-medium transition-colors focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-[#538e53] ${
                        selected
                          ? `${option.active} text-[#fefefe]`
                          : "border-gray-300 text-[#2b2b2b] hover:bg-gray-50"
                      } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="customer-care-priority"
                        value={option.value}
                        checked={selected}
                        disabled={isSubmitting}
                        onChange={() => setPriority(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSubmitting}
                className="cursor-pointer px-4 py-2 text-sm font-montserrat font-medium text-[#2b2b2b] border border-gray-300 rounded-[6px] hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-montserrat font-medium text-[#fefefe] rounded-[6px] transition-colors bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
