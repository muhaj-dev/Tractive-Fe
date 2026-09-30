import { Reviews } from "@/components/Reviews";
import {
  ArrowRightIcon,
  LikeIcon,
  ReplyIcon,
  StarIcon,
  YellowStarIcon,
} from "@/icons/Icons";
import Image from "next/image";
import UserAvatar from "@/components/UserAvatar";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  useFollowFarmer,
  useUnfollowFarmer,
} from "@/hooks/queries/useUserQueries";
import { useGetSellerReviews } from "@/hooks/queries/useSellerQueries";

export interface OwnerInfo {
  id?: string;
  name?: string;
  image?: string;
  rating?: number;
  followersCount?: number;
  state?: string;
  isFollowing?: boolean;
}

export const OwnersInfo = ({ owner }: { owner?: OwnerInfo }) => {
  const [seeMore, setSeeMore] = useState(false);

  // ── Follow / Unfollow the transporter (fleet owner) ────────────────────
  const ownerId = owner?.id;

  // The transporter is a seller record, so its reviews come from the seller
  // reviews endpoint. Show the most recent one; the modal shows the rest.
  const { data: reviewData, isLoading: isReviewsLoading } = useGetSellerReviews(
    ownerId as string,
  );
  const latestReview = reviewData?.reviews?.[0];
  const followMutation = useFollowFarmer();
  const unfollowMutation = useUnfollowFarmer();
  const [isFollowing, setIsFollowing] = useState<boolean>(!!owner?.isFollowing);
  const isFollowPending =
    followMutation.isPending || unfollowMutation.isPending;

  useEffect(() => {
    if (owner?.isFollowing !== undefined) setIsFollowing(!!owner.isFollowing);
  }, [owner?.isFollowing]);

  const handleFollowToggle = async () => {
    if (!ownerId || isFollowPending) return;
    const previous = isFollowing;
    setIsFollowing(!previous); // optimistic
    try {
      if (previous) {
        await unfollowMutation.mutateAsync(ownerId);
      } else {
        await followMutation.mutateAsync(ownerId);
      }
    } catch {
      setIsFollowing(previous); // revert on failure
      toast.error("Failed to update follow status. Please try again.");
    }
  };

  const handleSeeMore = () => {
    setSeeMore(!seeMore); // See More Reviews visibility
  };

  return (
    <div className="relative w-[100%] lg:w-[57%] flex flex-col gap-[10px]">
      <div className="flex flex-col gap-[12px] bg-[#fefefe] px-4 pt-2 pb-6 rounded-[5px] shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
        <p className="font-montserrat font-normal text-[#2b2b2b] text-[12px]">
          Transporters Information
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <UserAvatar
              src={owner?.image}
              name={owner?.name || "Transporter"}
              size={45}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-montserrat font-normal text-[14px] text-[#2b2b2b] truncate">
                  {owner?.name || "Transporter"}
                </span>
                <span className="w-[10px] h-[10px] rounded-[100px] bg-[#2b2b2b]"></span>
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={!ownerId || isFollowPending}
                  className={`cursor-pointer font-montserrat font-normal text-[14px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) =>
                  i < Math.round(owner?.rating ?? 0) ? (
                    <YellowStarIcon key={i} />
                  ) : (
                    <StarIcon key={i} />
                  )
                )}
                <span className="font-montserrat font-normal text-[13px] text-[#2b2b2b]">
                  {(owner?.rating ?? 0).toFixed(1)}
                </span>
              </div>
              <small className="font-montserrat font-normal text-[11px] text-[#2b2b2b] truncate">
                {owner?.followersCount ?? 0} followers
              </small>
              {owner?.state && (
                <small className="font-montserrat font-normal text-[11px] text-[#2b2b2b] truncate">
                  {owner.state}
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col gap-1.5 bg-[#fefefe] px-4 pt-2 pb-6 rounded-[5px] shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
        {isReviewsLoading ? (
          <p className="font-montserrat font-normal text-[12px] text-[#808080] py-4">
            Loading reviews…
          </p>
        ) : !latestReview ? (
          <p className="font-montserrat font-normal text-[12px] text-[#808080] py-4">
            No reviews yet for this transporter.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="relative flex items-center gap-2 flex-wrap">
                <UserAvatar
                  src={latestReview.user.avatar}
                  name={latestReview.user.name}
                  size={30}
                />
                <p className="font-montserrat font-normal text-[14px] text-[#2b2b2b]">
                  {latestReview.user.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) =>
                  i < Math.round(latestReview.rating) ? (
                    <YellowStarIcon key={i} />
                  ) : (
                    <StarIcon key={i} />
                  )
                )}
              </div>
            </div>
            <div className="flex justify-between w-[100%] flex-wrap">
              <p className="font-montserrat w-[80%] font-normal text-[11px] text-[#2b2b2b]">
                {latestReview.comment}
              </p>
              {latestReview.date && (
                <span className="font-montserrat w-[20%] flex justify-end font-normal text-[11px] text-[#808080]">
                  {new Date(latestReview.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {latestReview.image && (
                <Image
                  src={latestReview.image}
                  alt="Ordered Item"
                  width={211}
                  height={77}
                />
              )}
              <div className="flex items-center gap-[46px] truncate">
                <div className="flex items-center gap-[6px]">
                  <ReplyIcon />
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                    {latestReview.replies} replies
                  </span>
                </div>
                <div className="flex items-center gap-[6px]">
                  <LikeIcon />
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                    {latestReview.likes} Likes
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full cursor-pointer flex text-[#538e53] items-center justify-end gap-[4px]"
              onClick={handleSeeMore}
            >
              <span className="font-montserrat font-normal text-[12px] text-[#538e53]">
                See more
              </span>
              <ArrowRightIcon stroke="#538e53" className="w-4 h-4" />
            </button>
          </>
        )}
        {/* Conditionally render Reviews component with animation */}
        {seeMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 top-[15.7rem] z-60"
          >
            <Reviews sellerId={ownerId} onClose={handleSeeMore} />
          </motion.div>
        )}
      </div>
    </div>
  );
};
