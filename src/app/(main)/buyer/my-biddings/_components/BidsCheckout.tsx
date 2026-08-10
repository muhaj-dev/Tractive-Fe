// _components/BidsCheckout.tsx
"use client";
import React, { useState } from "react";
import { WarningIcon } from "@/icons/Icon1";
import { Button } from "@/components/Button";
import { PaymentMethod } from "./PaymentMethod";
import { OrderPaymentModal } from "./OrderPaymentModal";
import { useCreateOrder } from "@/hooks/queries/useOrderQueries";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { BidResponse } from "@/services/bidService";
import { toast } from "sonner";

const BouncingDots = () => (
  <span className="inline-flex items-center gap-[3px] ml-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-[5px] h-[5px] bg-current rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.6s" }}
      />
    ))}
  </span>
);

interface BidsCheckoutProps {
  productsSubtotal: number;
  localTransportTotal: number;
  totalAmount: number;
  hasSelection: boolean;
  selectedBidIds: string[];
  checkoutData: BidResponse[];
  onTransactionSuccess?: () => void;
}


export const BidsCheckout: React.FC<BidsCheckoutProps> = ({
  productsSubtotal,
  localTransportTotal,
  totalAmount,
  hasSelection,
  selectedBidIds,
  checkoutData,
  onTransactionSuccess,
}) => {
  // The payment steps themselves live in OrderPaymentModal so that an order
  // left unpaid can be picked up again later from My Orders.
  const [payingOrderId, setPayingOrderId] = useState<string>("");

  const createOrderMutation = useCreateOrder();
  const { data: profile } = useProfile();

  const handleCheckoutClick = () => {
    if (!hasSelection) return;

    const selectedBids = checkoutData.filter((bid) =>
      selectedBidIds.includes(bid._id)
    );

    const products = selectedBids.map((bid) => ({
      product: bid.product._id,
      quantity: bid.quantity,
    }));

    const bidIds = selectedBids.map((bid) => bid._id);

    // Delivery details come from the user's saved profile (GET /api/profile).
    // This previously read localStorage["onboarding-data"], a key that is never
    // written — onboarding saves under `onboarding-data-${role}` — so every
    // order was created with an empty address and phone.
    const address = (profile?.address as string) || "";
    const phone = (profile?.phone as string) || "";

    if (!address || !phone) {
      toast.error(
        "Add a delivery address and phone number to your profile before checking out.",
      );
      return;
    }

    createOrderMutation.mutate(
      {
        products,
        totalAmount: totalAmount,
        address,
        phone,
        bidIds,
      },
      {
        onSuccess: (data) => {
          console.log("Order creation response:", JSON.stringify(data));
          const d = data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
          const createdOrderId =
            d?.data?._id ||
            d?.data?.id ||
            d?.order?._id ||
            d?.order?.id ||
            d?._id ||
            d?.id;
          if (createdOrderId) {
            setPayingOrderId(createdOrderId);
          } else {
            console.error("Could not extract order ID from response:", data);
            toast.error("Order created but could not get order ID. Please try again.");
            return;
          }
          toast.success(data.message || "Order created successfully!");
        },
      }
    );
  };

  const handleCloseModal = () => setPayingOrderId("");

  return (
    <div className="w-full md:w-[50%] bg-[#fefefe] h-fit shadow-md my-8 rounded-[5px] mx-auto">
      <p className="font-montserrat font-normal text-[15px] text-[#2b2b2b] p-4">
        Summary
      </p>
      <div className="w-full border-t border-dashed border-[#808080]"></div>

      {hasSelection ? (
        <>
          <div className="flex items-center justify-between w-full px-4 pt-4 pb-2">
            <span className="font-montserrat font-normal text-[13px] text-[#808080]">
              Products Subtotal
            </span>
            <span className="font-montserrat font-normal text-[13px] text-[#2b2b2b]">
              ₦{productsSubtotal.toLocaleString()}
            </span>
          </div>
          {localTransportTotal > 0 && (
            <div className="flex items-center justify-between w-full px-4 pb-2">
              <span className="font-montserrat font-normal text-[13px] text-[#808080]">
                Local Transport
              </span>
              <span className="font-montserrat font-normal text-[13px] text-[#2b2b2b]">
                ₦{localTransportTotal.toLocaleString()}
              </span>
            </div>
          )}
          <div className="w-full h-[1px] bg-[#e0e0e0] mx-4" style={{ width: "calc(100% - 32px)" }}></div>
          <div className="flex items-center justify-between w-full px-4 py-3">
            <span className="font-montserrat font-semibold text-[14px] text-[#2b2b2b]">
              Total
            </span>
            <span className="font-montserrat font-semibold text-[14px] text-[#2b2b2b]">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-[1px] bg-[#808080]"></div>
          <div className="flex items-center gap-2 w-full p-4">
            <WarningIcon />
            <span className="font-montserrat font-normal text-[13px] text-[#2b2b2b]">
              Note that delivery fee is not included.
            </span>
          </div>
          <div className="w-full h-[1px] bg-[#808080]"></div>
        </>
      ) : (
        <div className="flex items-center justify-center w-full py-6">
          <span className="font-montserrat font-normal text-[13px] text-[#808080]">
            Select a product to see price details
          </span>
        </div>
      )}

      <Button
        text={
          createOrderMutation.isPending ? (
            <span className="flex items-center">
              Processing<BouncingDots />
            </span>
          ) : (
            "Checkout"
          )
        }
        onClick={handleCheckoutClick}
        className="justify-center !rounded-[4px] my-4 w-[80%] mx-auto"
        disabled={!hasSelection || createOrderMutation.isPending}
      />

      <PaymentMethod />

      {/* Payment steps + success prompt. Closing this no longer strands the
          order — it can be paid later from My Orders → Pending payment. */}
      <OrderPaymentModal
        orderId={payingOrderId}
        totalAmount={totalAmount}
        isOpen={!!payingOrderId}
        onClose={handleCloseModal}
        onPaid={() => onTransactionSuccess?.()}
      />
    </div>
  );
};
