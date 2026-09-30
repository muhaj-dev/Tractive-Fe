"use client";
import React, { useEffect, useRef, useState } from "react";
import { XIcon } from "@/icons/Icon1";
import { useModalA11y } from "@/hooks/useModalA11y";

interface CounterBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  yourBid: number;
  theirCounter: number;
  isSubmitting: boolean;
  apiError?: string | null;
  onSubmit: (payload: { amount: number; message: string }) => void;
}

export const CounterBackModal: React.FC<CounterBackModalProps> = ({
  isOpen,
  onClose,
  title,
  yourBid,
  theirCounter,
  isSubmitting,
  apiError,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setMessage("");
      setError("");
    }
  }, [isOpen]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, {
    onEscape: () => {
      if (!isSubmitting) onClose();
    },
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (parsed === theirCounter) {
      setError("Your counter must differ from their offer — otherwise just accept it.");
      return;
    }
    setError("");
    onSubmit({ amount: parsed, message: message.trim() });
  };

  return (
    <div
      className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-50"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="counter-back-title"
        className="bg-[#fefefe] rounded-[8px] w-[90%] max-w-[440px] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f1f1]">
          <p
            id="counter-back-title"
            className="font-montserrat font-medium text-[14px] text-[#2b2b2b]"
          >
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-4 bg-[#f8f8f8] rounded-[6px] px-4 py-3">
            <div className="flex flex-col">
              <span className="font-montserrat text-[11px] text-[#808080] font-medium">
                Your bid
              </span>
              <span className="font-montserrat text-[16px] text-[#2b2b2b] font-bold">
                ₦{yourBid.toLocaleString()}
              </span>
            </div>
            <span className="text-[#808080] text-[14px]">→</span>
            <div className="flex flex-col">
              <span className="font-montserrat text-[11px] text-[#808080] font-medium">
                Their counter
              </span>
              <span className="font-montserrat text-[16px] text-[#004085] font-bold">
                ₦{theirCounter.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-montserrat text-[12px] text-[#2b2b2b] font-semibold">
              Your counter amount (₦)
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. 11,500"
              className="w-full px-3 py-3 border border-[#e2e2e2] rounded-[6px] text-[15px] font-montserrat font-semibold focus:outline-none focus:border-[#538e53] disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-montserrat text-[12px] text-[#2b2b2b] font-semibold">
              Message <span className="text-[#b0b0b0] font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="Explain your counter — e.g. 'This is my best'"
              className="w-full px-3 py-2.5 border border-[#e2e2e2] rounded-[6px] text-[14px] font-montserrat resize-none focus:outline-none focus:border-[#538e53] disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="font-montserrat text-[12px] text-[#d32f2f] font-medium">
              {error}
            </p>
          )}
          {apiError && !error && (
            <div className="bg-[#fde8e8] border border-[#f5c2c2] rounded-[6px] px-3 py-2">
              <p className="font-montserrat text-[12px] text-[#b71c1c] font-semibold">
                {apiError}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-[#fafafa] border-t border-[#f1f1f1]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[6px] text-[12px] font-montserrat font-medium text-[#808080] hover:bg-[#f1f1f1] cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-[6px] text-[13px] font-montserrat font-semibold text-[#fefefe] bg-[#2563eb] hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send counter"}
          </button>
        </div>
      </div>
    </div>
  );
};
