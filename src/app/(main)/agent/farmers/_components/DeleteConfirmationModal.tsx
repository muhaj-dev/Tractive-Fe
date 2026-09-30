"use client";
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XModalIcon } from "../../_components/Icons/AgentIcons";
import { useModalA11y } from "@/hooks/useModalA11y";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Farmer",
  message = "Are you sure you want to delete this farmer? This action cannot be undone.",
  isLoading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, { onEscape: onClose });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-[200] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
            className="bg-[#fefefe] p-6 rounded-lg w-full max-w-sm mx-auto relative shadow-xl"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#2b2b2b] hover:text-[#538e53] cursor-pointer"
              aria-label="Close modal"
            >
              <XModalIcon className="w-5 h-5" />
            </button>

            <h2
              id="delete-confirmation-title"
              className="text-[16px] font-montserrat font-semibold text-[#2b2b2b] mb-4"
            >
              {title}
            </h2>

            <p className="text-[14px] font-montserrat text-gray-600 mb-6">
              {message}
            </p>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-[#2b2b2b] rounded hover:bg-gray-50 transition-colors text-[14px] font-montserrat cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-[14px] font-montserrat cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
