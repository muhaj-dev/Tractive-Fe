import BidingCard from "@/components/cards/BidingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { BidResponse } from "@/services/bidService";
import React from "react";

interface BiddingProductProps {
  /** The bids to render. Supplied by MyBiding based on the active filter pill. */
  bids: BidResponse[];
  isLoading: boolean;
  isError: boolean;
  /** Shown when the active filter has no bids. */
  emptyText?: string;
}

export const BiddingProduct: React.FC<BiddingProductProps> = ({
  bids,
  isLoading,
  isError,
  emptyText = "No biddings found.",
}) => {
  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="w-full h-[237px]" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-[90%] mx-auto py-10 text-center text-red-500 bg-red-50 rounded-md">
        Failed to load your biddings. Please try again later.
      </div>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">{emptyText}</div>
    );
  }

  return (
    <div className="w-[90%] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bids?.map((bid) => (
          <BidingCard
            id={bid?.product?._id}
            key={bid?._id}
            image={bid?.product?.images?.[0] || "/images/placeholder.png"}
            title={bid?.product?.name}
            time="24:08:07" // Placeholder as API doesn't provide expiration time yet
            description={bid?.message}
            timeImage="/images/redclock.png" // Static asset
            crownImage="/images/leadingcrown.png" // Static asset
            leadingProfileImage="/images/placeholder-avatar.png" // Static asset - API doesn't provide leading bidder image
            quantity={`${bid?.product?.quantity} ${bid?.product?.unit}`}
            // "amount" prop (Main price on card) -> My Bid Amount
            amount={`₦${bid?.amount?.toLocaleString()}`}
            // "biddingPrice" prop (Small bottom price) -> Product Original Price
            biddingPrice={`₦${bid?.product?.price?.toLocaleString()}`}
            bottomLabel="Price:"
            showLeadingImages={false}
            imageClass="h-[200px] object-cover"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isWishlisted={(bid?.product as any)?.isWishlisted}
          />
        ))}
      </div>
    </div>
  );
};
