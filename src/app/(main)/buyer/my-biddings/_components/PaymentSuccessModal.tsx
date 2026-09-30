"use client";
import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@/icons/Icon1";
import { useModalA11y } from "@/hooks/useModalA11y";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, { onEscape: onClose });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-[#fefefe] rounded-[10px] w-[90%] max-w-[440px] max-h-[90vh] overflow-y-auto relative p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#2b2b2b] cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <XIcon />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#eaf6ea] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#538e53"
              strokeWidth={3}
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2
            id="payment-success-title"
            className="font-montserrat font-semibold text-[18px] sm:text-[20px] text-[#2b2b2b]"
          >
            Payment submitted
          </h2>

          {/* The transfer is only declared here; an admin still has to verify
              it, so this must not read as a completed payment. */}
          <p className="font-montserrat text-[13px] sm:text-[14px] text-[#5a5a5a]">
            We&apos;ve received your payment details. We&apos;ll confirm once
            the transfer is verified. Would you like to arrange transport for
            your products, or keep shopping for more?
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <button
            type="button"
            onClick={() => router.push("/buyer/transporter-list")}
            className="cursor-pointer w-full py-2.5 bg-[#538e53] hover:bg-[#467a46] text-[#fefefe] font-montserrat text-[14px] font-medium rounded-[6px] transition-colors"
          >
            Find a Transporter
          </button>
          <button
            type="button"
            onClick={() => router.push("/buyer")}
            className="cursor-pointer w-full py-2.5 bg-[#fefefe] hover:bg-[#f3f9f3] text-[#538e53] border border-[#538e53] font-montserrat text-[14px] font-medium rounded-[6px] transition-colors"
          >
            Browse More Products
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-full py-2 text-[#808080] hover:text-[#2b2b2b] font-montserrat text-[12px] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
