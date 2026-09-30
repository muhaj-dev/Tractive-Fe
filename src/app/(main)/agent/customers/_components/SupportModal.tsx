"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useRouter } from "next/navigation";
import { CustomerService, Customer } from "@/services/customerService";

interface SupportModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setSubject("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleInitiateChat = async () => {
    if (!customer) return;

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await CustomerService.initiateChat(customer.id, {
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess(true);

      // Wait a moment to show success, then redirect
      setTimeout(() => {
        router.push("/agent/chat");
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to initiate chat. Please try again.");
      console.error("Error initiating chat:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage("");
      setSubject("");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  useModalA11y(isOpen, modalRef, { onEscape: handleClose });

  if (!isOpen) return null;

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
          aria-labelledby="agent-support-title"
          className="bg-[#fefefe] rounded-[10px] shadow-lg w-[90%] max-w-[500px] p-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="agent-support-title" className="text-[16px] font-montserrat font-semibold text-[#2b2b2b]">
              {customer ? `Contact ${customer.name}` : "Customer Support"}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="cursor-pointer text-[#808080] hover:text-[#2b2b2b] text-[18px] font-montserrat transition-colors disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {customer ? (
            <div className="flex flex-col gap-4">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-[6px] text-[12px] font-montserrat"
                >
                  {error}
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-[6px] text-[12px] font-montserrat"
                >
                  Chat initiated successfully! Redirecting...
                </motion.div>
              )}

              {/* Customer Info */}
              <div className="bg-[#f9f9f9] p-3 rounded-[6px]">
                <p className="text-[11px] font-montserrat text-[#808080] mb-1">
                  Customer Details
                </p>
                <p className="text-[13px] font-montserrat text-[#2b2b2b]">
                  <span className="font-medium">Name:</span> {customer.name}
                </p>
                <p className="text-[13px] font-montserrat text-[#2b2b2b]">
                  <span className="font-medium">Mobile:</span> {customer.mobile}
                </p>
                {customer.email && (
                  <p className="text-[13px] font-montserrat text-[#2b2b2b]">
                    <span className="font-medium">Email:</span> {customer.email}
                  </p>
                )}
              </div>

              {/* Subject Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-montserrat font-medium text-[#2b2b2b]">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Order inquiry, Product support"
                  maxLength={100}
                  className="w-full px-3 py-2.5 border-[1px] border-gray-300 rounded-[6px] text-[13px] font-montserrat focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:border-[#538e53] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isSubmitting || success}
                />
                <p className="text-[11px] font-montserrat text-[#808080]">
                  {subject.length}/100 characters
                </p>
              </div>

              {/* Message Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-montserrat font-medium text-[#2b2b2b]">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your message here..."
                  rows={5}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border-[1px] border-gray-300 rounded-[6px] text-[13px] font-montserrat focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:border-[#538e53] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isSubmitting || success}
                />
                <p className="text-[11px] font-montserrat text-[#808080]">
                  {message.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleInitiateChat}
                  disabled={
                    isSubmitting ||
                    success ||
                    !subject.trim() ||
                    !message.trim()
                  }
                  className="cursor-pointer flex-1 bg-[#538e53] text-[#fefefe] text-[13px] font-montserrat py-2.5 rounded-[6px] hover:bg-[#467746] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : success ? (
                    "Success!"
                  ) : (
                    "Start Chat"
                  )}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 bg-gray-200 text-[#2b2b2b] text-[13px] font-montserrat py-2.5 rounded-[6px] hover:bg-gray-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] font-montserrat text-[#2b2b2b]">
                Select a customer to start a chat.
              </p>

              <button
                onClick={handleClose}
                className="cursor-pointer mt-2 w-full bg-[#538e53] text-[#fefefe] text-[13px] font-montserrat py-2.5 rounded-[6px] hover:bg-[#467746] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
