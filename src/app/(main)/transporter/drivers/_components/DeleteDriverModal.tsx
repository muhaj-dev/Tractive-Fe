"use client";
import React, { useRef } from "react";
import { motion } from "framer-motion";
import { XModalIcon } from "../../_components/Icons/TransporterIcons";
import { useModalA11y } from "@/hooks/useModalA11y";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  driverName?: string;
}

export const DeleteDriverModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  driverName,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, { onEscape: onClose });

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-driver-title"
        className="bg-[#fefefe] p-8 rounded-[8px] w-full max-w-[400px] relative flex flex-col items-center text-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2b2b2b] hover:text-[#538e53]"
          aria-label="Close modal"
        >
          <XModalIcon />
        </button>
        
        <h2 id="delete-driver-title" className="text-lg font-montserrat font-semibold text-[#2b2b2b] mb-2">
          Delete Driver
        </h2>
        <p className="text-sm font-montserrat text-[#808080] mb-6">
          Are you sure you want to delete <span className="font-bold text-[#2b2b2b]">{driverName || "this driver"}</span>? This action cannot be undone.
        </p>

        <div className="flex gap-4 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-[#2b2b2b] rounded-[4px] hover:bg-gray-50 font-montserrat text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[#d32f2f] text-white rounded-[4px] hover:bg-[#b71c1c] font-montserrat text-sm"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
