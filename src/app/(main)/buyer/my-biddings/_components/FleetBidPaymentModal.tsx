"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { XIcon } from "@/icons/Icon1";
import { useModalA11y } from "@/hooks/useModalA11y";
import { BankAccounts } from "./BankAccounts";
import { useCreateFleetPayment } from "@/hooks/queries/useTransporterQueries";
import { paymentMethodMap } from "@/utils/paymentMethods";
import { FleetBidResponse } from "@/services/negotiationService";

interface FleetBidPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: FleetBidResponse;
}

const paymentMethods = [
  { id: "card", name: "Pay by Card", image: "/images/card.png" },
  { id: "deposit", name: "Pay by Deposit", image: "/images/deposit.png" },
  { id: "transfer", name: "Pay by Transfer", image: "/images/transfer.png" },
  { id: "cheque", name: "Pay by Cheque", image: "/images/cheque.png" },
];

export const FleetBidPaymentModal: React.FC<FleetBidPaymentModalProps> = ({
  isOpen,
  onClose,
  bid,
}) => {
  const [step, setStep] = useState<"method" | "confirm">("method");
  const [selectedMethod, setSelectedMethod] = useState("");
  const { mutate: submitPayment, isPending } = useCreateFleetPayment();
  const panelRef = useRef<HTMLDivElement>(null);
  // Measured 10 Aug: this dialog reported role=null, so nothing announced it and
  // focus stayed on the page behind it.
  useModalA11y(isOpen, panelRef, { onEscape: () => !isPending && onClose() });

  if (!isOpen) return null;

  const fleet = typeof bid.fleet === "object" ? bid.fleet : null;
  const routeNote =
    fleet?.route
      ? `Payment for ${fleet.route.fromState} to ${fleet.route.toState} shipment`
      : "Fleet bid payment";

  const handleConfirm = () => {
    submitPayment(
      {
        fleetBidId: bid._id,
        paymentMethod: paymentMethodMap[selectedMethod] || selectedMethod,
        note: routeNote,
      },
      {
        onSuccess: () => {
          setStep("method");
          setSelectedMethod("");
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setStep("method");
      setSelectedMethod("");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-[#fefefe] rounded-[8px] w-[90%] max-w-[400px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fleet bid payment"
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-[#2b2b2b] font-montserrat text-[16px] font-medium cursor-pointer z-10"
          aria-label="Close"
        >
          <XIcon />
        </button>

        {step === "method" ? (
          <div className="flex flex-col gap-4 p-5 pt-8">
            <p className="font-montserrat text-[14px] font-medium text-[#2b2b2b]">
              Select Payment Method
            </p>
            <p className="font-montserrat text-[12px] text-[#808080]">
              Amount: <span className="text-[#2b2b2b] font-medium">₦{bid.amount.toLocaleString()}</span>
            </p>
            {/* Buttons, not divs: these were unreachable by keyboard, so the
                payment method could only ever be chosen with a mouse. */}
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payment method">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedMethod === method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center border border-[#808080] px-3 py-3 cursor-pointer rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#538e53] ${
                    selectedMethod === method.id
                      ? "bg-[#538e53]"
                      : "hover:bg-[#f5f5f5]"
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Image
                      src={method.image}
                      alt={method.name}
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                    <span
                      className={`font-montserrat text-[11px] font-normal ${
                        selectedMethod === method.id
                          ? "text-[#fefefe]"
                          : "text-[#2b2b2b]"
                      }`}
                    >
                      {method.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={!selectedMethod}
              className={`w-full h-10 rounded-tl-[6px] rounded-br-[6px] font-montserrat text-[13px] font-normal text-[#fefefe] transition duration-200 ease-in-out cursor-pointer ${
                !selectedMethod
                  ? "bg-[#538e53] opacity-50 cursor-not-allowed"
                  : "bg-[#538e53] hover:bg-[#3a6b3a]"
              }`}
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-8 pb-5">
            <div className="px-5">
              <button
                onClick={() => setStep("method")}
                className="font-montserrat text-[12px] text-[#538e53] cursor-pointer hover:text-[#3a6b3a]"
              >
                ← Back
              </button>
            </div>
            <p className="font-montserrat text-[11px] text-center px-5 text-[#2b2b2b]">
              Transfer ₦{bid.amount.toLocaleString()} to one of the accounts below, then confirm.
            </p>
            <BankAccounts />
            <div className="px-5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={`w-full h-10 rounded-tl-[6px] rounded-br-[6px] font-montserrat text-[13px] font-normal text-[#fefefe] transition duration-200 ease-in-out cursor-pointer ${
                  isPending
                    ? "bg-[#538e53] opacity-50 cursor-not-allowed"
                    : "bg-[#538e53] hover:bg-[#3a6b3a]"
                }`}
              >
                {isPending ? "Processing..." : "I've made the transfer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
