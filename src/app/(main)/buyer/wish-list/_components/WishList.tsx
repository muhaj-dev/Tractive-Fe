import BidingCard from "@/components/cards/BidingCard";
import React from "react";
import { WishlistItem } from "@/services/productService";
import { Skeleton } from "@/components/ui/Skeleton";

type WishListProps = {
  data?: WishlistItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isFetchingNextPage?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

export const WishList: React.FC<WishListProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  isFetchingNextPage,
  hasMore,
  onLoadMore
}) => {
  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  if (isError && (!data || data.length === 0)) {
    return (
      <div className="w-[90%] mx-auto py-10 flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-montserrat text-[#c0392b]">
          We couldn&apos;t load your wishlist.
        </p>
        <p className="text-sm font-montserrat mt-1 mb-4">
          Please check your connection and try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 rounded-full bg-[#538e53] text-white text-sm font-medium cursor-pointer hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-[90%] mx-auto py-10 flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg font-montserrat">Your wishlist is empty.</p>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((wishlistItem: WishlistItem) => {
          const product = wishlistItem.product;
          if (!product) return null; // Fallback in case a wishlist item has a missing product reference
          
          return (
            <BidingCard
              id={product.id || product._id}
              key={wishlistItem._id || product.id || product._id}
              image={product.images?.[0] || "/images/placeholder.png"}
              title={product.name}
              time="Available"
              description={product.description}
              timeImage="/images/redclock.png"
              crownImage="/images/leadingcrown.png"
              leadingProfileImage="/images/placeholder-avatar.png"
              quantity={`${product.quantity} ${product.unit}`}
              amount={`₦${product.price?.toLocaleString()}`}
              biddingPrice=""
              isWishlisted={true}
            showLeadingImages={false}
            bottomLabel=""
          />
          );
        })}
      </div>
      
      {hasMore && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className={`px-8 py-3 rounded-full text-white font-medium transition-all ${
              isFetchingNextPage 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg active:scale-95"
            }`}
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};
