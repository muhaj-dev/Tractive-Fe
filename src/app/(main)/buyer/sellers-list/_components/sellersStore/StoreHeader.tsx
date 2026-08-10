"use client";
import {
  AwardIcon,
  CallIcon,
  CopyIcon,
  MessageIcon,
  ReviewIcon,
  ShoppingCartIcon,
  XIcon,
} from "@/icons/Icon1";
import { ArrowRightIcon, YellowStarIcon } from "@/icons/Icons";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { toast } from "sonner";
import { Reviews } from "@/components/Reviews";
import { LeaveReviewButton } from "@/app/(main)/buyer/(account)/track-orders/_components/LeaveReviewButton";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useFollowFarmer,
  useUnfollowFarmer,
} from "@/hooks/queries/useUserQueries";

/** Sales figures run into the billions — abbreviate so they fit the card. */
const compactNaira = (value?: number): string => {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}b`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}k`;
  return `₦${amount}`;
};

export const StoreHeader = ({
  seller,
  isLoading,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seller?: any;
  isLoading: boolean;
}) => {
  const [openCallLog, setOpenCallLog] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  // ── Follow / Unfollow ──────────────────────────────────────────────────
  const sellerId = seller?.sellerId || seller?._id || seller?.id;
  const followMutation = useFollowFarmer();
  const unfollowMutation = useUnfollowFarmer();
  const [isFollowing, setIsFollowing] = useState<boolean>(
    !!seller?.isFollowing,
  );
  const isFollowPending =
    followMutation.isPending || unfollowMutation.isPending;

  useEffect(() => {
    if (seller?.isFollowing !== undefined) {
      setIsFollowing(!!seller.isFollowing);
    }
  }, [seller?.isFollowing]);

  const handleFollowToggle = async () => {
    if (!sellerId || isFollowPending) return;
    const previous = isFollowing;
    setIsFollowing(!previous); // optimistic
    try {
      if (previous) {
        await unfollowMutation.mutateAsync(sellerId);
      } else {
        await followMutation.mutateAsync(sellerId);
      }
    } catch {
      setIsFollowing(previous); // revert on failure
      toast.error("Failed to update follow status. Please try again.");
    }
  };

  // Build the 5→1 star breakdown from the seller's real rating distribution.
  // When the backend provides `ratingDistribution` we use it directly; otherwise
  // we derive percentages from `totalReviews`, defaulting to an empty (all-zero)
  // breakdown so nothing is faked.
  const ratings = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dist: any[] = Array.isArray(seller?.ratingDistribution)
      ? seller.ratingDistribution
      : [];
    const total = Number(seller?.totalReviews) || 0;
    return [5, 4, 3, 2, 1].map((star) => {
      const entry = dist.find((d) => Number(d?.rating) === star);
      const count = Number(entry?.count ?? 0);
      const percentage = Number(
        entry?.percentage ?? (total ? (count / total) * 100 : 0)
      );
      return { stars: `${star} star`, count, percentage };
    });
  }, [seller?.ratingDistribution, seller?.totalReviews]);

  // Real numbers only — never invent contact details for a seller.
  const phoneNumbers: string[] = seller?.phoneNumbers?.length
    ? seller.phoneNumbers
    : [];

  const reviewCount = Number(seller?.totalReviews) || 0;

  // Initialize individual animation controls for each rating
  const control1 = useAnimation();
  const control2 = useAnimation();
  const control3 = useAnimation();
  const control4 = useAnimation();
  const control5 = useAnimation();

  // Memoize the controls array to prevent re-creation on every render
  const controls = useMemo(
    () => [control1, control2, control3, control4, control5],
    [control1, control2, control3, control4, control5]
  );

  const handleCallLog = () => {
    setOpenCallLog(!openCallLog);
  };

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedStates((prev) => ({ ...prev, [number]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [number]: false }));
    }, 2000);
  };

  useEffect(() => {
    // Start animation for each progress bar on mount
    controls.forEach((control, index) => {
      control.start({
        width: `${ratings[index].percentage}%`,
        transition: { duration: 1, ease: "easeOut" },
      });
    });
  }, [controls, ratings]);

  const handleReviewsToggle = () => {
    setShowReviews(!showReviews); // Toggle Reviews visibility
  };

  if (isLoading) {
    return (
      <div className="relative w-[90%] mx-auto pt-6 pb-6">
         <div className="relative flex flex-col lg:flex-row items-center gap-4 w-[100%]">
             <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-4 w-[100%] lg:w-[50%]">
                <Skeleton className="w-full lg:w-[17rem] h-[100px] rounded-[7px]" />
                <div className="flex gap-3 w-full sm:w-auto">
                    <Skeleton className="w-[50px] h-[100px] rounded-[7px]" />
                    <Skeleton className="w-full sm:w-[7.6rem] h-[100px] rounded-[7px]" />
                </div>
             </div>
             <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-4 w-[100%] lg:w-[50%]">
                 <Skeleton className="w-full sm:w-[8.5rem] h-[100px] rounded-[7px]" />
                 <Skeleton className="w-full h-[100px] rounded-[7px]" />
             </div>
         </div>
      </div>
    );
  }

  return (
    <div className="relative w-[90%] mx-auto pt-6 pb-6">
      <div className="relative flex flex-col lg:flex-row items-center gap-4 w-[100%]">
        <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-4 w-[100%] lg:w-[50%]">
          <div className="bg-[#fefefe] flex flex-col gap-2 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[100%] lg:w-[17rem] h-[100px]">
            <p className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b] truncate">
              Sellers information
            </p>
            <div className="flex items-center gap-2">
              <Image
                src={seller?.image || "/images/sellerprofile.png"}
                alt={seller?.name ? `${seller.name} profile` : "Seller Profile"}
                width={40}
                height={40}
                className="object-cover rounded-full w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
              />
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="flex gap-2 sm:gap-1 xl:gap-3 flex-wrap items-center w-full">
                  <div className="flex gap-2 items-center">
                    <p className="font-montserrat font-normal text-[12px] sm:text-[14px] text-[#2b2b2b] truncate">
                      {seller?.name || "Store Name"}
                    </p>
                    {seller?.isVerified && (
                      <Image
                        src="/images/verifiedIcon.png"
                        alt="Verified"
                        width={12}
                        height={12}
                        className="object-cover sm:w-[15px] sm:h-[15px]"
                      />
                    )}
                  </div>
                  <span className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[100px] bg-[#2b2b2b]"></span>
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={!sellerId || isFollowPending}
                    className={`cursor-pointer font-montserrat font-normal text-[12px] sm:text-[14px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      isFollowing ? "text-[#808080]" : "text-[#538e53]"
                    }`}
                  >
                    {isFollowPending
                      ? "..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                </div>
                <div className="flex gap-2 items-center flex-wrap mt-[2px]">
                  <div className="flex gap-1 items-center">
                    <YellowStarIcon />
                    <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                      {(Number(seller?.averageRating) || 0).toFixed(1)}
                    </small>
                    {seller?.rateStatus && (
                      <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#808080] truncate">
                        ({seller.rateStatus})
                      </small>
                    )}
                  </div>
                  <span className="w-[3px] h-[3px] rounded-full bg-[#8e8e8e]"></span>
                  <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                    {seller?.followersCount || 0} followers
                  </small>
                  <span className="w-[3px] h-[3px] rounded-full bg-[#8e8e8e]"></span>
                  <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b] truncate max-w-[120px]">
                    {seller?.location || "Unknown"}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-[100%] sm:w-[27%] lg:w-[38%]">
            <div className="relative bg-[#fefefe] flex flex-col items-center gap-3 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[50px] h-[100px] justify-center">
              <div className="flex gap-2 items-center bg-[#CCE5CC8C] p-2 rounded-[100px] cursor-pointer">
                <MessageIcon />
              </div>
              <div
                className="relative flex gap-2 items-center bg-[#CCE5CC8C] p-2 rounded-[100px] cursor-pointer"
                onClick={handleCallLog}
              >
                <CallIcon />
              </div>
              {openCallLog && (
                <motion.div
                  className="absolute -bottom-[4.5rem] left-0 bg-[#fefefe] p-4 rounded-[5px] flex flex-col items-end shadow-[0px_4px_4px_0px_rgba(0,0,0,0.15)] gap-3 z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="cursor-pointer" onClick={handleCallLog}>
                    <XIcon />
                  </div>
                  <div className="flex items-start gap-2 w-full">
                    {phoneNumbers.length === 0 ? (
                      <span className="font-montserrat font-normal text-[12px] text-[#808080] whitespace-nowrap">
                        No phone number provided
                      </span>
                    ) : (
                      phoneNumbers.map((number: string) => (
                        <div
                          key={number}
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => handleCopy(number)}
                        >
                          {copiedStates[number] ? (
                            <>
                              <span className="font-montserrat font-normal text-[12px] text-[#538e53]">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <CopyIcon />
                              <span className="font-montserrat font-normal text-[12px] text-[#2b2b2b]">
                                {number}
                              </span>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>
            <div className="bg-[#538e53] flex flex-col items-center sm:items-start gap-2 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[100%] sm:w-[7.6rem] h-[100px] justify-center">
              <div className="flex gap-2 items-center justify-center bg-[#fefefe] w-[35px] h-[35px] p-1 rounded-[100px]">
                <ShoppingCartIcon />
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <p className="font-montserrat font-semibold text-center text-[11px] sm:text-[12px] text-[#fefefe]">
                  Total sales made {compactNaira(seller?.amountOfSales)}
                </p>
                <small className="font-montserrat font-normal text-center text-[9px] sm:text-[10px] text-[#e2efe2]">
                  {seller?.productsCount || 0} product
                  {(seller?.productsCount || 0) === 1 ? "" : "s"} listed
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-4 w-[100%]">
          <div className="bg-[#fefefe] flex flex-col  items-center sm:items-start gap-3 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[100%] sm:w-[8.5rem] h-[100px] justify-center">
            <div className="flex gap-2 items-center justify-center bg-[#538e53] w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] p-1 rounded-[100px]">
              <AwardIcon />
            </div>
            <p className="font-montserrat font-normal text-center text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {seller?.yearsOfExperience || 0} years of sales
            </p>
          </div>

          <div className="bg-[#fefefe] flex items-center flex-col sm:flex-row gap-3 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-full h-auto sm:h-[100px]">
            <div className="flex flex-col w-[100%]">
              {ratings.map((rating, index) => (
                <div
                  key={rating.stars}
                  className="flex items-center gap-1 sm:gap-2 w-full"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b] ">
                      {rating.stars}
                    </span>
                  </div>
                  <div className="flex-1 h-[4px] bg-[#e0e0e0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#FFA500]"
                      initial={{ width: 0 }}
                      animate={controls[index]}
                    />
                  </div>
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                    {rating.count}
                  </span>
                </div>
              ))}
            </div>
            <span className="w-[100%] sm:w-[1px] h-[1px] sm:h-[5rem] bg-[#d2d2d2]"></span>
            <div className="flex flex-col gap-2 w-[100%] sm:w-[100%]">
              <div className="flex gap-2 items-center justify-start">
                <div className="flex gap-2 items-center justify-center bg-[#f1f1f1] w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] p-1 rounded-[100px]">
                  <ReviewIcon />
                </div>
                <p className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b] truncate">
                  Reviews
                </p>
              </div>
              <div className="flex gap-2 items-center justify-between">
                <div className="flex items-center gap-6 sm:gap-10">
                  <p className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                    {reviewCount === 0
                      ? "No reviews yet"
                      : `${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
                  </p>
                </div>
                {/* Rate the seller directly from their store. The backend
                    rejects a second review with 409, which the button renders
                    as an already-reviewed state. */}
                {sellerId && (
                  <LeaveReviewButton
                    agentId={sellerId}
                    agentName={seller?.name || "this seller"}
                    revieweeType="seller"
                    buttonLabel="Write a review"
                    variant="inline"
                  />
                )}
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={handleReviewsToggle} // Add click handler
                >
                  <span className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#538e53]">
                    See reviews
                  </span>
                  <ArrowRightIcon
                    stroke="#538e53"
                    className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Conditionally render Reviews component with animation */}
        {showReviews && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 top-[7.6rem] z-60"
          >
            <Reviews sellerId={sellerId} onClose={handleReviewsToggle} />
          </motion.div>
        )}
      </div>
    </div>
  );
};
