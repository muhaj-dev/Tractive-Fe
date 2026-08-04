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
import { Reviews } from "@/components/Reviews";
import { useGetTransporter } from "@/hooks/queries/useTransporterQueries";
import { Loader2 } from "lucide-react";

export const TransporterHeader = ({ transporterId }: { transporterId: string }) => {
  const { data: transporter, isLoading, isError } = useGetTransporter(transporterId);
  const [openCallLog, setOpenCallLog] = useState(false);
  const [showReviews, setShowReviews] = useState(false); // New state for Reviews visibility
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({
    "09034145971": false,
    "09034145972": false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = transporter as any;

  /**
   * Star breakdown straight from the API — `GET /api/transporters/{id}` now
   * returns `ratingDistribution` as a full 5→1 set of `{rating, count,
   * percentage}`. The all-zero fallback stays for transporters with no reviews
   * yet; it never renders the placeholder 8/6/4/2/1 counts this used to show,
   * which were identical for every transporter and read as real review data.
   */
  const ratings = useMemo(() => {
    const dist: { rating?: number; count?: number; percentage?: number }[] =
      Array.isArray(t?.ratingDistribution) ? t.ratingDistribution : [];
    const byStar = new Map(dist.map((d) => [Number(d.rating), d]));
    return [5, 4, 3, 2, 1].map((star) => {
      const entry = byStar.get(star);
      return {
        stars: `${star} star`,
        count: Number(entry?.count ?? 0),
        percentage: Number(entry?.percentage ?? 0),
      };
    });
  }, [t?.ratingDistribution]);

  /** Real contact numbers only — no placeholder digits for a live "call" menu. */
  const phoneNumbers: string[] = useMemo(() => {
    const list: unknown[] = Array.isArray(t?.phoneNumbers)
      ? t.phoneNumbers
      : [t?.phone];
    return list.filter(
      (n): n is string => typeof n === "string" && n.trim().length > 0
    );
  }, [t?.phoneNumbers, t?.phone]);

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

  const handleReviewsToggle = () => {
    setShowReviews(!showReviews); // Toggle Reviews visibility
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

  if (isLoading) {
    return (
      <div className="w-[90%] relative mx-auto pt-6 pb-6 flex justify-center items-center px-4 h-[200px]">
        <Loader2 className="animate-spin text-[#2b2b2b] w-8 h-8" />
      </div>
    );
  }

  if (isError || !transporter) {
    return (
      <div className="w-[90%] relative mx-auto pt-6 pb-6 flex justify-center items-center px-4 h-[200px]">
        <p className="text-[#808080] font-montserrat text-[14px]">Failed to load transporter details.</p>
      </div>
    );
  }

  const businessName = t.businessName || t.name || t.transporterName || "Unknown Transporter";
  const avatar: string = t.image || t.profilePicture || "/images/sellerprofile.png";
  const isVerified = t.isVerified ?? true;
  const ratingValue = t.rating || 0;
  const followersCount = t.followersCount || 0;
  const stateLocation = t.state || t.locationFrom || "Various";
  // Field names as the API actually returns them (`deliveriesCount`,
  // `customersCount`, `reviewsCount`); the previous spellings never matched, so
  // these tiles were pinned at 0 regardless of the transporter's real history.
  const deliveriesCount =
    t.deliveriesCount ?? t.successfulDeliveries ?? t.customersCount ?? 0;
  const yearsOfSales = t.transporterYear ?? t.yearsOfExperience ?? 0;
  const reviewCount = t.reviewsCount ?? t.totalReviews ?? t.reviewCount ?? 0;

  return (
    <div className="w-[90%] relative mx-auto pt-6 pb-6">
      <div className="relative flex flex-col lg:flex-row items-center gap-4 w-[100%]">
        <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-4 w-[100%] lg:w-[50%]">
          <div className="bg-[#fefefe] flex flex-col gap-2 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[100%] lg:w-[17rem] h-[100px]">
            <p className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b] truncate">
              Transporters information
            </p>
            <div className="flex items-center gap-2">
              <Image
                src={avatar}
                alt={businessName}
                width={40}
                height={40}
                className="object-cover sm:w-[50px] sm:h-[50px] rounded-full"
              />
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="flex gap-2 sm:gap-1 xl:gap-3 flex-wrap items-center w-full">
                  <div className="flex gap-2 items-center">
                    <p className="font-montserrat font-normal text-[12px] sm:text-[14px] text-[#2b2b2b] truncate max-w-[120px]">
                      {businessName}
                    </p>
                    {isVerified && (
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
                  <span className="font-montserrat font-normal text-[12px] sm:text-[14px] text-[#538e53] cursor-pointer">
                    Follow
                  </span>
                </div>
                <div className="flex gap-1 items-center flex-wrap">
                  <div className="flex gap-1 items-center">
                    <YellowStarIcon />
                    <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                      {ratingValue.toFixed(1)}
                    </small>
                  </div>
                  <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                    {followersCount} followers
                  </small>
                  <small className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                    {stateLocation} state
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
                    {phoneNumbers.length === 0 && (
                      <span className="font-montserrat font-normal text-[12px] text-[#808080] whitespace-nowrap">
                        No contact number listed
                      </span>
                    )}
                    {phoneNumbers.map((number) => (
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
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            <div className="bg-[#538e53] flex flex-col items-center sm:items-start gap-3 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[100%] sm:w-[7.6rem] h-[100px] justify-center">
              <div className="flex gap-2 items-center justify-center bg-[#fefefe] w-[35px] h-[35px] p-1 rounded-[100px]">
                <ShoppingCartIcon />
              </div>
              <p className="font-montserrat font-normal text-center text-[10px] sm:text-[11px] text-[#fefefe]">
                {deliveriesCount} Successful Delivered Orders
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-4 w-[100%]">
          <div className="bg-[#fefefe] flex flex-col items-center sm:items-start gap-3 p-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-[100%] sm:w-[8.5rem] h-[100px] justify-center">
            <div className="flex gap-2 items-center justify-center bg-[#538e53] w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] p-1 rounded-[100px]">
              <AwardIcon />
            </div>
            <p className="font-montserrat font-normal text-center text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {yearsOfSales > 0 ? `${yearsOfSales} years of sales` : "Less than a year"}
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
                  <div className="relative w-[30px] h-[30px]">
                    <Image
                      src="/images/bidder1.png"
                      alt="Bidder 1"
                      width={20}
                      height={20}
                      className="absolute left-0 z-10 sm:w-[25px] sm:h-[25px]"
                    />
                    <Image
                      src="/images/bidder2.png"
                      alt="Bidder 2"
                      width={20}
                      height={20}
                      className="absolute left-[10px] sm:left-[12px] z-20 sm:w-[25px] sm:h-[25px]"
                    />
                    <Image
                      src="/images/bidder3.png"
                      alt="Bidder 3"
                      width={20}
                      height={20}
                      className="absolute left-[20px] sm:left-[28px] z-30 sm:w-[25px] sm:h-[25px]"
                    />
                    <Image
                      src="/images/bidder4.png"
                      alt="Bidder 4"
                      width={20}
                      height={20}
                      className="absolute left-[30px] sm:left-[40px] z-40 sm:w-[25px] sm:h-[25px]"
                    />
                  </div>
                  <p className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                    + {reviewCount > 0 ? reviewCount.toLocaleString() : "0"}
                  </p>
                </div>
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
            <Reviews transporterId={transporterId} onClose={handleReviewsToggle} />
          </motion.div>
        )}
      </div>
    </div>
  );
};