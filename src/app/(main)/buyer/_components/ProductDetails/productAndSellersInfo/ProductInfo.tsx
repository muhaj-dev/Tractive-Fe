import Link from "next/link";
import React, { useState, useEffect } from "react";
import { StarIcon, YellowStarIcon } from "@/icons/Icons";
import Image from "next/image";
import { ApiProduct } from "@/services/productService";
import { useAddToWishlist, useRemoveFromWishlist } from "@/hooks/queries/useUserQueries";

interface ProductInfoProps {
  item: ApiProduct;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  item,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(item.isWishlisted || false);
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  useEffect(() => {
    if (item.isWishlisted !== undefined) {
      setIsWishlisted(item.isWishlisted);
    }
  }, [item.isWishlisted]);

  const toggleWishlist = async () => {
    if (!item.id) return;
    const previousState = isWishlisted;
    setIsWishlisted(!isWishlisted);
    
    try {
      if (previousState) {
        await removeFromWishlistMutation.mutateAsync(item.id);
      } else {
        await addToWishlistMutation.mutateAsync(item.id);
      }
    } catch {
      setIsWishlisted(previousState);
    }
  };

  const isPending = addToWishlistMutation.isPending || removeFromWishlistMutation.isPending;

  // Format price
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(item.price);

  // Real rating (0–5): prefer the review summary, fall back to the product's
  // own rating field.
  const ratingValue = item.reviewSummary?.averageRating
    ? Number(item.reviewSummary.averageRating)
    : Number(item.rating) || 0;
  const filledStars = Math.round(ratingValue);

  return (
    <div className="w-full flex flex-col px-4 sm:px-6 md:px-8 pt-2 pb-6 gap-6 sm:gap-8 bg-[#fefefe]">
      <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-[7rem] gap-4">
            <p className="font-montserrat font-normal text-base sm:text-lg text-[#2b2b2b]">
              {item.name}
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) =>
                    i < filledStars ? (
                      <YellowStarIcon key={i} />
                    ) : (
                      <StarIcon key={i} />
                    )
                  )}
                  <span className="font-montserrat font-normal text-xs sm:text-sm text-[#2b2b2b]">
                    {ratingValue.toFixed(1)}
                  </span>
                </div>
                <p className="font-montserrat font-normal text-xs sm:text-sm text-[#2b2b2b]">
                  ({item.reviewSummary?.count ?? item.reviews ?? 0} Reviews)
                </p>
              </div>
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={isPending}
                className={`bg-[#f1f1f1] cursor-pointer flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A942A] ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={isWishlisted}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 22 21"
                  fill={isWishlisted ? "#2A942A" : "none"}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M11.454 19.21C11.114 19.33 10.554 19.33 10.214 19.21C7.31398 18.22 0.833984 14.09 0.833984 7.09C0.833984 4 3.32398 1.5 6.39398 1.5C8.21398 1.5 9.82398 2.38 10.834 3.74C11.3478 3.04588 12.017 2.48173 12.788 2.09274C13.559 1.70376 14.4104 1.50076 15.274 1.5C18.344 1.5 20.834 4 20.834 7.09C20.834 14.09 14.354 18.22 11.454 19.21Z"
                    stroke="#2A942A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
              Quantity{" "}
              <span className="text-[#2b2b2b]">
                {item.quantity} {item.unit}
              </span>
            </p>
            <span className="w-[1.5px] h-3 sm:h-4 bg-[#2b2b2b] hidden sm:block"></span>
            <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
              Price <span className="text-[#2b2b2b]">{formattedPrice}</span>
            </p>
            <span className="w-[1.5px] h-3 sm:h-4 bg-[#2b2b2b] hidden sm:block"></span>
            <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
              Status:{" "}
              <span
                className={`font-bold ${item.status === "available" ? "text-green-600 uppercase text-sm" : "text-red-500"}`}
              >
                {item.status === "available" ? "Available" : item.status}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
            Description
          </p>
          <p className="font-montserrat font-normal text-xs sm:text-sm text-[#2b2b2b]">
            {item.description}
          </p>
        </div>

        {/* Bidders Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">

          {/* Leading Bidder - Prioritize API bidSummary if available, else fallback to props */}
          {item.bidSummary?.leadingBid ? (
            <div className="flex items-center gap-1.5">
              <span className="font-montserrat text-xs sm:text-sm text-[#2b2b2b] font-normal">
                Leading:
              </span>
              <div className="flex items-center flex-col">
                <Image
                  src="/images/leadingcrown.png"
                  alt="crown"
                  width={16}
                  height={16}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <div className="w-6 h-6 sm:w-8 sm:h-8 relative rounded-full overflow-hidden bg-gray-100">
                  <div className="w-full h-full flex items-center justify-center bg-[#538e53] text-white text-xs">
                    {item.bidSummary?.leadingBid?.buyer?.name?.charAt(0) || "?"}
                  </div>
                </div>
              </div>
              <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
                {item.bidSummary?.leadingBid?.buyer?.name || "Unknown Bidder"}:{" "}
                <span className="text-[#2b2b2b]">
                  ₦
                  {item.bidSummary?.leadingBid?.amount?.toLocaleString() ||
                    "0.00"}
                </span>
                <span className="ml-2 text-xs text-orange-500">
                  ({item.bidSummary?.leadingBid?.status || "pending"})
                </span>
              </p>
            </div>
          ) : (
            <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
              Be the first to bid!
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-montserrat font-normal text-xs sm:text-sm text-[#808080]">
            Share this
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/images/FacebookBlack.png"
              alt="Facebook"
              width={20}
              height={20}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            <Image
              src="/images/WhatsAppBlack.png"
              alt="WhatsApp"
              width={20}
              height={20}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            <Image
              src="/images/TwitterBlack.png"
              alt="Twitter"
              width={20}
              height={20}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </div>
        </div>
      </div>
      <Link
        href="/report"
        className="font-montserrat font-normal text-xs sm:text-sm text-[#8b4513]"
      >
        Report this item
      </Link>
    </div>
  );
};
