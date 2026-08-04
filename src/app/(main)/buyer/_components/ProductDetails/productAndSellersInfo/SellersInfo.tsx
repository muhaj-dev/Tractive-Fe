import { Reviews } from "@/components/Reviews";
import {
  ArrowRightIcon,
  LikeIcon,
  ReplyIcon,
  StarIcon,
  YellowStarIcon,
} from "@/icons/Icons";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Owner } from "@/services/productService";
import { useFollowFarmer, useUnfollowFarmer } from "@/hooks/queries/useUserQueries";
import { useQuery } from "@tanstack/react-query";
import { getSellerById } from "@/utils/sellerApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSellerReviews } from "@/hooks/queries/useSellerQueries";

interface SellersInfoProps {
  owner?: Owner;
  onRefresh?: () => void;
}

export const SellersInfo: React.FC<SellersInfoProps> = ({ owner, onRefresh }) => {
  const [seeMore, setSeeMore] = useState(false);
  const [localIsFollowing, setLocalIsFollowing] = useState(owner?.isFollowing || false);
  
  const followMutation = useFollowFarmer();
  const unfollowMutation = useUnfollowFarmer();

  const targetId = owner?._id || owner?.id;

  const { data: sellerDetails, isLoading: isSellerLoading } = useQuery({
    queryKey: ["seller", targetId],
    queryFn: () => targetId ? getSellerById(targetId) : null,
    enabled: !!targetId,
  });

  const { data: reviewData, isLoading: reviewsLoading } = useGetSellerReviews(targetId || "");

  const isLoading = followMutation.isPending || unfollowMutation.isPending || isSellerLoading;

  useEffect(() => {
    if (owner?.isFollowing !== undefined) {
      setLocalIsFollowing(owner.isFollowing);
    }
  }, [owner?.isFollowing]);

  const handleFollowToggle = async () => {
    if (!targetId) return;

    // Optimistically update the UI to provide instant feedback
    const previousState = localIsFollowing;
    setLocalIsFollowing(!localIsFollowing);

    try {
      if (previousState) {
        await unfollowMutation.mutateAsync(targetId);
      } else {
        await followMutation.mutateAsync(targetId);
      }
      // Refresh the product data to get updated status from server
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to toggle follow status", error);
      // Revert optimistic update
      setLocalIsFollowing(previousState);
      toast.error("Failed to update follow status. Please try again.");
    }
  };

  const handleSeeMore = () => {
    setSeeMore(!seeMore); // See More Reviews visibility
  };

  /**
   * Seller rating as the API reports it. Note `??` rather than `||`: a genuine
   * 0 (unrated seller) is falsy, and the previous `|| 4` fallback turned every
   * unrated seller into a 4.0-star one on the product page.
   */
  const sellerRating: number =
    sellerDetails?.averageRating ??
    sellerDetails?.rating ??
    owner?.rating ??
    0;

  return (
    <div className="relative w-[100%] lg:w-[50%] flex flex-col gap-[10px]">
      <div className="flex flex-col gap-[12px] bg-[#fefefe] px-4 pt-2 pb-6 rounded-[5px] shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
        <p className="font-montserrat font-normal text-[#2b2b2b] text-[12px]">
          Sellers Information
        </p>
        <div className="flex items-center gap-2">
          <div>
            <Image
              src={sellerDetails?.image || "/images/bidder2.png"}
              alt={`${sellerDetails?.name || owner?.name || "Seller"}'s profile`}
              width={45}
              height={45}
              className="rounded-full object-cover w-[45px] h-[45px]"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="truncate font-montserrat font-semibold text-[13px] sm:text-[14px] md:text-[15px] text-[#2b2b2b]">
                  {sellerDetails?.name || owner?.name || "Unknown Seller"}
                </span>
                {sellerDetails?.isVerified && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">Verified</span>
                )}
              </div>
              
              <div className="relative group flex items-center">
                  <button 
                    onClick={!isLoading ? handleFollowToggle : undefined}
                    className={`cursor-pointer font-montserrat font-medium text-[11px] sm:text-[12px] md:text-[13px] rounded-full px-4 py-[4px] transition-all duration-200 border ${
                      localIsFollowing 
                        ? "bg-transparent border-[#808080] text-[#808080] hover:bg-[#f5f5f5]" 
                        : "bg-[#538e53] border-[#538e53] text-[#fefefe] hover:bg-[#437243]"
                    } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="transparent" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Wait...
                      </span>
                    ) : localIsFollowing ? "Unfollow" : "Follow"}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-[110%] ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-[#2b2b2b] text-[#fefefe] text-[10px] px-2 py-1.5 rounded-md z-10 whitespace-nowrap shadow-md">
                    {localIsFollowing ? "Unfollow this seller" : "Follow this seller for updates"}
                    {/* Tooltip arrow */}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#2b2b2b]"></div>
                  </div>
                </div>
              </div>
            
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-1">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, index) =>
                  index < Math.floor(sellerRating) ? (
                    <YellowStarIcon key={index} />
                  ) : (
                    <StarIcon key={index} />
                  ),
                )}
                <span className="font-montserrat font-medium text-[11px] sm:text-[12px] md:text-[13px] text-[#2b2b2b] ml-1">
                  {sellerRating.toFixed(1)}
                </span>
                {sellerDetails?.totalReviews !== undefined && (
                  <span className="font-montserrat text-[10px] sm:text-[11px] text-gray-500">
                    ({sellerDetails.totalReviews})
                  </span>
                )}
              </div>
              
              <div className="h-[12px] w-[1px] bg-gray-300 hidden sm:block"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                <small className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#538e53] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#538e53]"></span>
                  {sellerDetails?.followersCount !== undefined 
                    ? `${sellerDetails.followersCount.toLocaleString()} followers` 
                    : "700 followers"}
                </small>
                
                <small className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#2b2b2b] flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {sellerDetails?.location || owner?.state || owner?.country || "Location N/A"}
                </small>
                
                {sellerDetails?.yearsOfExperience !== undefined && sellerDetails.yearsOfExperience > 0 && (
                  <small className="font-montserrat font-medium text-[11px] sm:text-[12px] text-gray-600 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    {sellerDetails.yearsOfExperience} yrs exp.
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col gap-1.5 bg-[#fefefe] px-4 pt-2 pb-6 rounded-[5px] shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
        {/* Dynamic Review Preview */}
        {(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const firstReview = (reviewData as any)?.reviews?.[0];

          if (reviewsLoading) {
            return (
              <div className="flex justify-center items-center py-4">
                <span className="font-montserrat text-sm text-gray-500">Loading review...</span>
              </div>
            );
          }

          if (!firstReview) {
            return (
              <div className="flex justify-center items-center py-4">
                <span className="font-montserrat text-sm text-gray-500">No reviews yet.</span>
              </div>
            );
          }

          return (
            <>
              <div className="flex items-center justify-between gap-1.5">
                <div className="relative flex items-center gap-2">
                  <Image
                    src={firstReview.user?.avatar || "/images/placeholder.png"}
                    alt="comment Profile"
                    width={30}
                    height={30}
                    className="rounded-full w-[30px] h-[30px] object-cover"
                  />
                  <p className="font-montserrat font-normal text-[14px] text-[#2b2b2b]">
                    {firstReview.user?.name || "Anonymous"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, idx) => (
                    idx < Math.floor(firstReview.rating || 0) ? <YellowStarIcon key={idx} /> : <StarIcon key={idx} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between gap-1.5">
                <p className="font-montserrat w-[80%] font-normal text-[11px] text-[#2b2b2b] line-clamp-2">
                  {firstReview.comment}
                </p>
                <span className="font-montserrat w-[20%] font-normal text-[11px] text-[#808080] text-right">
                  {new Date(firstReview.createdAt || firstReview.date || new Date()).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>
              {firstReview.image && (
                <div className="flex flex-col gap-4">
                  <Image
                    src={firstReview.image}
                    alt="Ordered Item"
                    width={211}
                    height={77}
                    className="object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-[46px]">
                  <div className="flex items-center gap-[6px]">
                    <ReplyIcon />
                    <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                      {firstReview.repliesCount || firstReview.replies || 0} replies
                    </span>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <LikeIcon />
                    <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                      {firstReview.likesCount || firstReview.likes || 0} Likes
                    </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        
        <div
          className="cursor-pointer flex text-[#538e53] items-center justify-end gap-[4px]"
          onClick={handleSeeMore}
        >
          <span className="font-montserrat font-normal text-[12px] text-[#538e53]">
            See more
          </span>
          <ArrowRightIcon stroke="#538e53" className="w-4 h-4" />
        </div>
        {/* Conditionally render Reviews component with animation */}
        <AnimatePresence>
          {seeMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              onClick={handleSeeMore}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Reviews sellerId={targetId || ""} onClose={handleSeeMore} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
