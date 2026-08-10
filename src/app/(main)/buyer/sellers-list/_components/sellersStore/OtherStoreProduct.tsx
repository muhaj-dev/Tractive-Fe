import { RecommendationProduct } from "@/services/productService";
import BidingCard from "@/components/cards/BidingCard";
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface OtherStoreProductProps {
  products?: RecommendationProduct[];
  isLoading: boolean;
}

export const OtherStoreProduct: React.FC<OtherStoreProductProps> = ({
  products = [],
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto py-6">
        <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
          Others
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
               <Skeleton className="w-full h-[200px] rounded-lg" />
               <Skeleton className="w-[80%] h-4" />
               <Skeleton className="w-[50%] h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-[90%] mx-auto py-6">
        <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
          Others
        </p>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#e8f3e8]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#538e53"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20" />
              <path d="M12 22A10 10 0 0 0 2 12H2A10 10 0 0 0 12 2" strokeDasharray="4 4" />
              <path d="M12 22A10 10 0 0 1 22 12H22A10 10 0 0 1 12 2" strokeDasharray="4 4" />
              <path d="M12 16a4 4 0 0 0 0-8" />
              <path d="M12 16a4 4 0 0 1 0-8" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-montserrat text-lg font-bold text-[#2b2b2b]">
              No products found for this seller.
            </h3>
            <p className="font-montserrat text-[13px] text-[#808080] mt-1 max-w-sm mx-auto">
              This seller hasn&apos;t added any products or no items match your search filter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto py-6">
      <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
        Others
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product: RecommendationProduct) => (
          <BidingCard
            id={product._id || product.id}
            key={product._id}
            image={product.images?.[0] || "/images/placeholder.png"}
            title={product.name}
            time="24:08:07" // Placeholder
            description={product.description}
            timeImage="/images/redclock.png"
            crownImage="/images/leadingcrown.png"
            leadingProfileImage="/images/placeholder-avatar.png"
            quantity={`${product.quantity} ${product.unit}`}
            amount={`₦${product.price?.toLocaleString()}`}
            biddingPrice={`₦${product.price?.toLocaleString()}`} // Using same price for now
            bottomLabel="Price:"
            showLeadingImages={false}
            imageClass="h-[200px] object-cover"
            isWishlisted={product.isWishlisted ?? product.wishlisted}
          />
        ))}
      </div>
    </div>
  );
};
