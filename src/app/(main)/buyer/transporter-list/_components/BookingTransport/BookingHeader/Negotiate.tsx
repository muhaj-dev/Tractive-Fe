import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TruckItem } from "@/utils/TruckData";
import { computeTransportCost } from "@/utils/transportPricing";
import { useCreateFleetBid } from "@/hooks/queries/useTransporterQueries";
import { DisplayProduct } from "./TruckDetailsAndShipProduct";

interface NegotiateProps {
  selectedProducts: string[];
  products: DisplayProduct[];
  item: TruckItem;
  onBidSent: () => void;
}

export const Negotiate: React.FC<NegotiateProps> = ({
  selectedProducts,
  products,
  item,
  onBidSent,
}) => {
  const router = useRouter();
  const [negotiatedAmount, setNegotiatedAmount] = useState("");
  const [message, setMessage] = useState("");

  const { mutate: createBid, isPending } = useCreateFleetBid();

  // Get selected product details
  const selectedProductDetails = products.filter((p) =>
    selectedProducts.includes(p.id)
  );

  // Calculate total weight of selected products
  const totalWeight = selectedProductDetails.reduce(
    (total, product) => total + product.weightNum,
    0
  );

  // The asking price the buyer is negotiating against — flat for a whole-truck fleet,
  // weight × rate otherwise. See transportPricing.ts.
  const totalAmount = computeTransportCost(item, totalWeight).amount;

  // Handle input change for negotiated amount
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNegotiatedAmount(value);
    }
  };

  // Handle negotiation request submission
  const handleSubmit = () => {
    const amount = parseFloat(negotiatedAmount);
    if (!amount || amount <= 0 || !item.id) return;

    const shipmentItems = selectedProductDetails.map((product) => ({
      orderId: product.orderId,
      productId: product.productId,
      quantity: product.weightNum,
    }));

    createBid(
      {
        fleetId: item.id,
        payload: {
          amount,
          shipmentItems,
          ...(message.trim() && { message: message.trim() }),
        },
      },
      {
        onSuccess: () => {
          setNegotiatedAmount("");
          setMessage("");
          onBidSent();
          setTimeout(() => {
            router.push("/buyer/my-biddings?tab=fleet-bids");
          }, 1500);
        },
      }
    );
  };

  const isDisabled =
    !negotiatedAmount || parseFloat(negotiatedAmount) <= 0 || isPending;

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-5 py-4 ">
      <div className="flex flex-col gap-2">
        <p className="font-montserrat text-[11px] sm:text-[12px] md:text-[13px] text-[#808080] font-normal">
          Total: <span className="text-[#2b2b2b]">{totalWeight}kg</span>
        </p>
        <p className="font-montserrat text-[11px] sm:text-[12px] md:text-[13px] text-[#808080] font-normal">
          Amount:
          <span className="text-[#2b2b2b]"> ₦{totalAmount.toFixed(2)}</span>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="negotiatedAmount"
          className="font-montserrat text-[11px] sm:text-[12px] text-[#2b2b2b] font-normal"
        >
          I want to pay
        </label>
        <input
          type="text"
          id="negotiatedAmount"
          value={negotiatedAmount}
          onChange={handleInputChange}
          placeholder="Enter amount"
          className="border border-[#e2e2e2] rounded-[4px] px-3 py-1.5 w-full font-montserrat text-[12px] sm:text-[13px] text-[#2b2b2b] focus:outline-none focus:border-[#538e53]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="bidMessage"
          className="font-montserrat text-[11px] sm:text-[12px] text-[#2b2b2b] font-normal"
        >
          Message (optional)
        </label>
        <textarea
          id="bidMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message to the transporter"
          rows={2}
          className="border border-[#e2e2e2] rounded-[4px] px-3 py-1.5 w-full font-montserrat text-[12px] sm:text-[13px] text-[#2b2b2b] focus:outline-none focus:border-[#538e53] resize-none"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled}
        className={`bg-[#538e53] w-full h-9 text-[#fefefe] font-normal text-[13px] rounded-tl-[6px] rounded-br-[6px] px-4 py-2 transition duration-200 ease-in-out cursor-pointer ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-[#3a6b3a]"
        }`}
      >
        {isPending ? "Sending..." : "Send Request"}
      </button>
    </div>
  );
};
