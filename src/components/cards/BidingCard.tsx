"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAddToWishlist, useRemoveFromWishlist } from "@/hooks/queries/useUserQueries";

interface CardProps {
  id: string;
  image: string; // Required
  timeImage: string; // Required
  crownImage: string; // Required
  leadingProfileImage: string; // Required
  time: string; // Required
  title: string; // Required
  description?: string;
  amount?: string;
  quantity?: string;
  biddingPrice?: string;
  className?: string;
  imageClass?: string;
  crownImageClass?: string;
  leadingProfileImageClass?: string;
  imageClockClass?: string;
  titleClass?: string;
  descriptionClass?: string;
  amountClass?: string;
  quantityClass?: string;
  isWishlisted?: boolean;
}

export default function BidingCard({
  id,
  image,
  timeImage,
  crownImage,
  leadingProfileImage,
  time,
  title,
  description,
  amount,
  quantity,
  biddingPrice,
  className = "",
  imageClass = "",
  crownImageClass = "",
  leadingProfileImageClass = "",
  imageClockClass = "",
  titleClass = "",
  descriptionClass = "",
  amountClass = "",
  quantityClass = "",
  bottomLabel = "Leading:", // Default label
  showLeadingImages = true, // Default to showing images
  isWishlisted = false,
}: CardProps & { bottomLabel?: string; showLeadingImages?: boolean }) {

  
  // State to manage hover for tooltip
  const [isHovered, setIsHovered] = useState(false);

  // Fall back to a local placeholder when the product image URL is broken
  // (e.g. seeded example.com URLs that don't resolve to a real image).
  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  // Wishlist state and logic
  const [localWishlisted, setLocalWishlisted] = useState(isWishlisted);
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  useEffect(() => {
    setLocalWishlisted(isWishlisted);
  }, [isWishlisted]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const previousState = localWishlisted;
    setLocalWishlisted(!previousState);

    try {
      if (!previousState) {
        await addMutation.mutateAsync(id);
      } else {
        await removeMutation.mutateAsync(id);
      }
    } catch {
      setLocalWishlisted(previousState);
    }
  };

  // Function to truncate description to 4 words with "..." prefix
  const truncateDescription = (text?: string) => {
    if (!text) return "";
    const words = text.split(" ");
    return words.length > 4 ? `${words.slice(0, 4).join(" ")}...` : text;
  };

  // Tooltip animation variants
  const tooltipVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 0 },
    visible: { opacity: 1, scale: 1, y: -10 },
    exit: { opacity: 0, scale: 0.8, y: 0 },
  };

  return (
     <div
      className={`bg-[#fefefe] rounded-lg shadow-md w-[100%] overflow-hidden ${className}`}
    >
      {/* Image with Icon */}
      <div className="relative">
        <Image
          src={imgSrc}
          alt={title}
          width={381}
          height={200}
          className={`w-[100%] h-[200px] object-cover rounded-md ${imageClass}`}
          onError={() => setImgSrc("/images/tomatoes.png")}
        />
        <button
          type="button"
          aria-label={
            localWishlisted
              ? `Remove ${title} from wishlist`
              : `Add ${title} to wishlist`
          }
          aria-pressed={localWishlisted}
          disabled={addMutation.isPending || removeMutation.isPending}
          className={`absolute top-2 right-2 bg-[#ffffff80] rounded-full p-1 cursor-pointer hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A942A] ${addMutation.isPending || removeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={toggleWishlist}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="21"
            viewBox="0 0 22 21"
            fill={localWishlisted ? "#2A942A" : "none"}
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
      <Link href={`/buyer/product/${id}`}>
        <div className="p-4 ">
          <div className="flex items-center gap-2">
            <Image
              src={timeImage}
              alt="clock"
              width={15}
              height={15}
              className={`object-cover ${imageClockClass}`}
            />
            <small className="text-[#F51919]">{time}</small>
          </div>
          {/* Title */}
          <div>
            <h2
              className={`mt-2 text-[15px] font-medium font-montserrat ${titleClass}`}
            >
              {title}
            </h2>
            <div
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <p
                className={`text-[#2b2b2b] text-[12px] font-normal font-montserrat ${descriptionClass}`}
              >
                {truncateDescription(description)}
              </p>
              <AnimatePresence>
                {isHovered && description && (
                  <motion.div
                    variants={tooltipVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-0 -translate-y-full bg-[#f1f1f1] text-[#2b2b2b] text-sm font-montserrat rounded-md px-3 py-2 shadow-lg z-10 whitespace-nowrap"
                  >
                    {description}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Optional Fields */}

          <div className="flex items-center justify-between gap-4 mt-2">
            <p
              className={`text-[13px] text-gray-500 font-montserrat ${quantityClass}`}
            >
              Quantity: {quantity}
            </p>
            <p
              className={`text-[#2b2b2b] text-[13px] font-semibold font-montserrat ${amountClass}`}
            >
              {amount}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pl-4 ">
          <div className="flex items-center gap-1.5 mb-2 ">
            <span className="font-montserrat text-[13px] text-[#2b2b2b] font-normal">
              {bottomLabel}
            </span>
            {showLeadingImages && (
              <div className="flex items-center flex-col">
                <Image
                  src={crownImage}
                  alt="crown"
                  width={14}
                  height={14}
                  className={`object-cover ${crownImageClass}`}
                />
                <Image
                  src={leadingProfileImage}
                  alt="leading profile"
                  width={14}
                  height={14}
                  className={`object-cover ${leadingProfileImageClass}`}
                />
              </div>
            )}
            <p
              className={`text-sm text-gray-500 font-montserrat ${quantityClass}`}
            >
              {biddingPrice}
            </p>
          </div>

          <button
            type="button"
            className="cursor-pointer bg-[#538e53] w-[50%] h-[2.9rem] text-[#fefefe] font-normal text-[14px] rounded-tl-[10px] rounded-br-[10px] px-4 py-2 transition duration-200 ease-in-out"
          >
            View
          </button>
        </div>
      </Link>
    </div>
  );
}
