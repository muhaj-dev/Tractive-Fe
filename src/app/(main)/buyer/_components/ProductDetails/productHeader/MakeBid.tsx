"use client";
import React, { useState, useEffect } from "react";
import { bidService } from "@/services/bidService";
import { toast } from "sonner";
import { formatUnitAfterQuantity } from "@/utils/productUnits";

interface MakeBidProps {
  productId: string;
  defaultPrice?: number;
  defaultQuantity?: number;
  unit?: string;
  onBidSuccess: () => void;
}

export const MakeBid: React.FC<MakeBidProps> = ({
  productId,
  defaultPrice,
  onBidSuccess,
  defaultQuantity,
  unit,
}) => {
  const [proposedPrice, setProposedPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasBidded, setHasBidded] = useState(false);

  useEffect(() => {
    if (defaultPrice) setProposedPrice(defaultPrice);
    if (defaultQuantity) setQuantity(defaultQuantity);
  }, [defaultPrice, defaultQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposedPrice || Number(proposedPrice) <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message for the seller");
      return;
    }

    setIsSubmitting(true);
    try {
      await bidService.createBid({
        productId: productId,
        amount: Number(proposedPrice),
        quantity: Number(quantity),
        message: message,
      });

      toast.success("Bid placed successfully!");
      // Reset form to allow another bid
      setHasBidded(false); 
      setMessage("");
      // Optionally reset price/quantity or keep them
      
      onBidSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Failed to place bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[2px] w-[100%] lg:w-[50%] rounded-md shadow-md"
    >
      <div className="flex flex-col gap-4 bg-[#fefefe] px-4 py-6 rounded-t-[4px]">
        <div className="flex flex-col gap-2 w-full">
          <label
            htmlFor="bid"
            className="font-montserrat text-[13px] md:text-[14px] font-normal"
          >
            Proposed Price (₦)
          </label>
          <input
            type="number"
            id="bid"
            placeholder="0.00"
            value={proposedPrice}
            onChange={(e) => setProposedPrice(Number(e.target.value))}
            className="border border-[#808080] rounded-[4px] p-2 focus:outline-none focus:ring-[1px] focus:ring-[#538e53] w-full"
            disabled={hasBidded || isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label
            htmlFor="quantity"
            className="font-montserrat text-[13px] md:text-[14px] font-normal"
          >
            Quantity{unit ? ` (${formatUnitAfterQuantity(unit)})` : ""}
          </label>
          <input
            type="number"
            id="quantity"
            placeholder="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border border-[#808080] rounded-[4px] p-2 focus:outline-none focus:ring-[1px] focus:ring-[#538e53] w-full"
            disabled={hasBidded || isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="message"
            className="font-montserrat text-[13px] md:text-[14px] font-normal"
          >
            Message
          </label>
          <textarea
            id="message"
            rows={3}
            placeholder="Enter a message for the seller..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border border-[#808080] rounded-[4px] p-2 focus:outline-none focus:ring-[1px] focus:ring-[#538e53] resize-none"
            disabled={hasBidded || isSubmitting}
          />
        </div>
      </div>

      {/* <div className="flex flex-col items-center bg-[#fefefe] px-4 py-2 justify-center gap-1.5">
        <p className="font-montserrat font-normal text-[#2b2b2b] text-[12px] md:text-[13px]">
          Want To Negotiate? <span className="text-[#538e53]">Chat Seller</span>
        </p>
        <span className="font-montserrat font-normal text-[#2b2b2b] text-[12px] md:text-[13px]]">
          Or
        </span>
        <span className="font-montserrat font-normal text-[#538e53] text-[12px] md:text-[13px]">
          Call Seller
        </span>
      </div>
      <div className="flex items-center bg-[#fefefe] px-4 py-2 justify-start gap-1.5">
        <InfoIcon />
        <p className="font-montserrat font-normal text-[#2b2b2b] text-[10px] sm:text-[11px] md:text-[12px]">
          Note that you will be notified once you win the bidding.
        </p>
      </div> */}
      <div className="flex items-center bg-[#fefefe] px-4 py-7 justify-center">
        <button
          type="submit"
          disabled={hasBidded || isSubmitting}
          className={`w-[100%] text-[#fefefe] flex justify-center font-montserrat font-normal text-[13px] md:text-[14px] px-4 py-3 rounded-md transition duration-300 ${
            hasBidded || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#538e53] hover:bg-[#3f7a3f]"
          }`}
        >
          {isSubmitting ? "Placing Bid..." : hasBidded ? "Bid Placed" : "Bid"}
        </button>
      </div>
    </form>
  );
};
