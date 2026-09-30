"use client";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { BankAccounts } from "./BankAccounts";
import {
  useCreateFleetPayment,
  useCreateDirectFleetPayment,
} from "@/hooks/queries/useTransporterQueries";
import { paymentMethodMap } from "@/utils/paymentMethods";
import { useRouter } from "next/navigation";
import { useModalA11y } from "@/hooks/useModalA11y";
import { DisplayProduct } from "./TruckDetailsAndShipProduct";
import { useAppDispatch } from "@/lib/hooks";
import { clearPendingTransport } from "@/lib/features/pendingTransport/pendingTransportSlice";

interface AccountDetailsProps {
  fleetBidId?: string;
  fleetId?: string;
  paymentMethod?: string;
  locationFrom?: string;
  locationTo?: string;
  selectedProducts?: string[];
  allProducts?: DisplayProduct[];
}

const SuccessModal: React.FC<{
  shipmentCount: number;
  onClose: () => void;
}> = ({ shipmentCount, onClose }) => {
  // Only mounted while open.
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(true, dialogRef, { onEscape: onClose });

  return (
  <div
    className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-submitted-title"
      className="bg-[#fefefe] rounded-[8px] w-full max-w-[380px] p-6 flex flex-col items-center text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-14 h-14 rounded-full bg-[#d4edda] flex items-center justify-center mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M8 12.5l3 3 6-6"
            stroke="#155724"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="9.5" stroke="#155724" strokeWidth="2" />
        </svg>
      </div>
      <p
        id="payment-submitted-title"
        className="font-montserrat font-semibold text-[16px] text-[#2b2b2b] mb-1"
      >
        Payment Submitted
      </p>
      <p className="font-montserrat text-[12px] text-[#808080] mb-5">
        {shipmentCount > 0
          ? `${shipmentCount} shipment${
              shipmentCount > 1 ? "s" : ""
            } booked with this transporter. We'll notify you once the fleet moves.`
          : "Your payment has been recorded."}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="w-full h-10 rounded-tl-[6px] rounded-br-[6px] font-montserrat text-[13px] font-normal text-[#fefefe] bg-[#538e53] hover:bg-[#3a6b3a] cursor-pointer"
      >
        View my orders
      </button>
    </div>
  </div>
  );
};

export const AccountDetails: React.FC<AccountDetailsProps> = ({
  fleetBidId,
  fleetId,
  paymentMethod,
  locationFrom,
  locationTo,
  selectedProducts,
  allProducts,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { mutate: submitBidPayment, isPending: isBidPending } =
    useCreateFleetPayment();
  const { mutate: submitDirectPayment, isPending: isDirectPending } =
    useCreateDirectFleetPayment();

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastShipmentCount, setLastShipmentCount] = useState(0);

  const isPending = isBidPending || isDirectPending;
  const isDirectFlow = !fleetBidId;

  const shipmentItems = (() => {
    if (!selectedProducts || !allProducts) return [];
    return allProducts
      .filter((p) => selectedProducts.includes(p.id))
      .map((p) => ({
        orderId: p.orderId,
        productId: p.productId,
        quantityToShip: p.quantity,
      }));
  })();

  const canSubmit = (() => {
    if (!paymentMethod) return false;
    if (isDirectFlow) return !!fleetId && shipmentItems.length > 0;
    return !!fleetBidId;
  })();

  const handleConfirmPayment = () => {
    if (!paymentMethod || !canSubmit) return;

    const mappedMethod = paymentMethodMap[paymentMethod] || paymentMethod;
    const note =
      locationFrom && locationTo
        ? `Payment for ${locationFrom} to ${locationTo} shipment`
        : "Fleet payment";

    if (isDirectFlow) {
      submitDirectPayment(
        {
          fleetId: fleetId!,
          payload: {
            paymentMethod: mappedMethod,
            shipmentItems,
            note,
          },
        },
        {
          onSuccess: () => {
            setLastShipmentCount(shipmentItems.length);
            dispatch(clearPendingTransport());
            setShowSuccess(true);
          },
        }
      );
      return;
    }

    submitBidPayment(
      {
        fleetBidId: fleetBidId!,
        fleetId: fleetId ?? "",
        paymentMethod: mappedMethod,
        note,
      },
      {
        onSuccess: () => {
          router.push("/buyer/my-biddings");
        },
      }
    );
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/buyer/track-orders");
  };

  return (
    <>
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-center pt-1">
          <Image
            src="/images/accountVector.png"
            alt="Vector"
            width={374}
            height={249}
            className="w-[190px] h-auto"
          />
        </div>
        <p className="w-full mx-auto font-montserrat font-normal text-center text-[11px] px-5 text-[#2b2b2b]">
          To complete your order, kindly transfer the total amount due along
          with the item ID to one of the account numbers listed below. Thank
          you!
        </p>

        <BankAccounts />

        {isDirectFlow && shipmentItems.length > 0 && (
          <div className="px-4">
            <div className="rounded-[5px] border border-[#e2e2e2] bg-[#f9f9f9] p-3">
              <p className="font-montserrat text-[11px] text-[#808080] mb-1">
                You&apos;re shipping
              </p>
              <p className="font-montserrat text-[12px] text-[#2b2b2b] font-medium">
                {shipmentItems.length} product line
                {shipmentItems.length > 1 ? "s" : ""} across{" "}
                {new Set(shipmentItems.map((s) => s.orderId)).size} order
                {new Set(shipmentItems.map((s) => s.orderId)).size > 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>
        )}

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isPending || !canSubmit}
            className={`w-full h-10 rounded-tl-[6px] rounded-br-[6px] font-montserrat text-[13px] font-normal text-[#fefefe] transition duration-200 ease-in-out cursor-pointer ${
              isPending || !canSubmit
                ? "bg-[#538e53] opacity-50 cursor-not-allowed"
                : "bg-[#538e53] hover:bg-[#3a6b3a]"
            }`}
          >
            {isPending ? "Processing..." : "I've made the transfer"}
          </button>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          shipmentCount={lastShipmentCount}
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
};
