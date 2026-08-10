"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ReviewIcon } from "@/icons/Icon1";
import { LikeIcon, ReplyIcon, StarIcon, YellowStarIcon } from "@/icons/Icons";
import { useAnimation, motion } from "framer-motion";
import Image from "next/image";
import {
  useReviews,
  useReviewsSummary,
  useReplyToReview,
} from "@/hooks/queries/useReviewQueries";

// Sample fallback data
const fallbackReviewData = {
  overallRating: 4.0,
  totalReviewers: 0,
  ratings: [
    { stars: "5 star", count: 0, percentage: 0 },
    { stars: "4 star", count: 0, percentage: 0 },
    { stars: "3 star", count: 0, percentage: 0 },
    { stars: "2 star", count: 0, percentage: 0 },
    { stars: "1 star", count: 0, percentage: 0 },
  ],
  reviews: [],
  reviewerAvatars: [
    "/images/bidder1.png",
    "/images/bidder2.png",
    "/images/bidder3.png",
    "/images/bidder4.png",
  ],
};

const ReviewsPage: React.FC = () => {
  // Reviews + summary now flow through TanStack Query (shared cache, no manual
  // useState/useEffect fetching). Mutations invalidate the list so likes and
  // replies resync from the server.
  const {
    data: reviewsResponse,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useReviews();
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useReviewsSummary();

  const replyToReview = useReplyToReview();

  const reviews = reviewsResponse?.reviews ?? [];
  const isLoading = reviewsLoading || summaryLoading;
  const error = reviewsError
    ? (reviewsError as { message?: string })?.message || "Failed to load reviews"
    : null;

  // Summary view-model, falling back to empty distribution when unavailable.
  const reviewData = useMemo(
    () =>
      summary ?? {
        overallRating: fallbackReviewData.overallRating,
        totalReviews: fallbackReviewData.totalReviewers,
        ratingDistribution: fallbackReviewData.ratings.map((rating, index) => ({
          rating: 5 - index,
          count: rating.count,
          percentage: rating.percentage,
        })),
        recentReviewers: fallbackReviewData.reviewerAvatars,
      },
    [summary],
  );

  // Reply UI: which review's composer is open + its draft text.
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  // Initialize individual animation controls for each rating
  const control1 = useAnimation();
  const control2 = useAnimation();
  const control3 = useAnimation();
  const control4 = useAnimation();
  const control5 = useAnimation();

  // Memoize the controls array
  const controls = useMemo(
    () => [control1, control2, control3, control4, control5],
    [control1, control2, control3, control4, control5]
  );

  // Animate progress bars when data changes
  useEffect(() => {
    if (reviewData?.ratingDistribution) {
      controls.forEach((control, index) => {
        const percentage =
          reviewData.ratingDistribution[index]?.percentage || 0;
        control.start({
          width: `${percentage}%`,
          transition: { duration: 1, ease: "easeOut" },
        });
      });
    }
  }, [reviewData, controls]);

  // Helper to render star icons based on rating
  const renderStars = (rating: number): React.ReactElement[] => {
    const stars: React.ReactElement[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? <YellowStarIcon key={i} /> : <StarIcon key={i} />
      );
    }
    return stars;
  };

  // Toggle the reply composer for a review.
  const toggleReply = (reviewId: string) => {
    setOpenReplyId((prev) => (prev === reviewId ? null : reviewId));
    setReplyDraft("");
  };

  // Submit a reply — on success the list invalidates and the composer closes.
  const handleSubmitReply = (reviewId: string) => {
    const message = replyDraft.trim();
    if (!message) return;
    replyToReview.mutate(
      { reviewId, payload: { message } },
      {
        onSuccess: () => {
          setOpenReplyId(null);
          setReplyDraft("");
        },
      },
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Define left offsets for mobile and sm screens
  const leftOffsetsMobile = [0, 10, 20, 30];
  const leftOffsetsSm = [0, 12, 28, 40];

  if (isLoading) {
    return (
      <div className="relative bg-[#fefefe] flex flex-col items-center w-[95%] mx-auto mb-[2rem] px-6 py-6 gap-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[14px] font-montserrat text-[#808080]">
              Loading reviews...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#fefefe] flex flex-col items-center w-[95%] mx-auto mb-[2rem] px-6 py-6 gap-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
      {error && (
        <div className="w-full p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-montserrat text-sm">{error}</p>
          <button
            onClick={() => {
              refetchReviews();
              refetchSummary();
            }}
            className="mt-2 px-4 py-2 cursor-pointer bg-[#538e53] text-white text-xs font-montserrat rounded hover:bg-[#467746]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center w-full flex-col sm:flex-row gap-3 pt-3.5">
        {/* Ratings Summary */}
        <div className="flex flex-col w-[100%] bg-[#f1f1f1] p-1.5">
          <div className="flex items-center gap-[4px]">
            <div className="flex items-center gap-1.5">
              {renderStars(reviewData?.overallRating || 0)}
            </div>
            <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
              {(reviewData?.overallRating || 0).toFixed(1)}
            </span>
          </div>
          <span className="w-full h-[1px] bg-[#fefefe] mt-1"></span>
          <div className="flex flex-col w-[100%] bg-[#f1f1f1] p-0.5">
            {reviewData?.ratingDistribution.map((rating, index) => (
              <div
                key={rating.rating}
                className="flex items-center gap-1 sm:gap-2 w-full"
              >
                <div className="flex items-center gap-1">
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                    {rating.rating} star
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
        </div>

        {/* Reviews Count and Recent Reviewers */}
        <div className="flex flex-col gap-2 w-[100%] sm:w-[100%] bg-[#f1f1f1] p-4">
          <div className="flex gap-2 items-center justify-start">
            <div className="flex gap-2 items-center justify-center bg-[#e2e2e2] w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] p-1 rounded-[100px]">
              <ReviewIcon stroke="#2b2b2b" />
            </div>
            <p className="font-montserrat font-normal text-[10px] sm:text-[15px] text-[#2b2b2b] truncate">
              Reviews
            </p>
          </div>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="relative w-[40px] h-[40px] overflow-visible">
                {reviewData?.recentReviewers &&
                reviewData.recentReviewers.length > 0
                  ? reviewData.recentReviewers
                      .slice(0, 4)
                      .map((reviewer, index) => (
                        <div
                          key={index}
                          className={`absolute left-[${leftOffsetsMobile[index]}px] sm:left-[${leftOffsetsSm[index]}px] z-50 w-[35px] h-[35px] rounded-full bg-gray-300 flex items-center justify-center border-2 border-[#fefefe]`}
                        >
                          <span className="font-montserrat text-xs font-bold text-gray-600">
                            {reviewer.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ))
                  : fallbackReviewData.reviewerAvatars.map((avatar, index) => (
                      <Image
                        key={index}
                        src={avatar}
                        alt={`Reviewer ${index + 1}`}
                        width={50}
                        height={50}
                        className={`absolute left-[${leftOffsetsMobile[index]}px] sm:left-[${leftOffsetsSm[index]}px] z-50 w-[35px] h-[35px] rounded-full border-2 border-[#fefefe]`}
                        onError={(e) => {
                          console.error(`Failed to load image: ${avatar}`);
                          e.currentTarget.src = "/images/placeholder.png";
                        }}
                      />
                    ))}
              </div>
              <p className="font-montserrat font-normal text-[11px] sm:text-[15px] text-[#2b2b2b]">
                + {(reviewData?.totalReviews || 0).toLocaleString()} reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-6 w-full">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-montserrat text-[#808080]">
              No reviews yet for this agent
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const isReplyOpen = openReplyId === review._id;
            const isReplying =
              replyToReview.isPending &&
              replyToReview.variables?.reviewId === review._id;
            return (
              <div
                key={review._id}
                className="flex flex-col gap-1.5 pt-2 rounded-[5px] border-b border-gray-100 pb-4"
              >
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="relative flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="font-montserrat text-sm font-bold text-gray-600">
                        {review.buyer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-montserrat font-normal text-[14px] text-[#2b2b2b]">
                      {review.buyer.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <div className="flex justify-between w-[100%] flex-wrap">
                  <p className="font-montserrat w-full md:w-[80%] font-normal text-[11px] text-[#2b2b2b]">
                    {review.comment}
                  </p>
                  <span className="font-montserrat w-full md:w-[20%] flex justify-start md:justify-end font-normal text-[11px] text-[#808080] mt-2 md:mt-0">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-[46px] truncate mt-2">
                  {/* Read-only here: `POST /api/reviews/{id}/like` requires
                      activeRole `buyer`, and this page is the agent's own
                      inbox — the like control lives on the buyer surfaces. */}
                  <div className="flex items-center gap-[6px]">
                    <LikeIcon />
                    <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                      {review.likes || 0} Likes
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-[6px] cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => toggleReply(review._id)}
                  >
                    <ReplyIcon />
                    <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                      {review.replies?.length || 0} replies
                    </span>
                  </button>
                </div>

                {/* Existing replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 pl-4 border-l-2 border-gray-100">
                    {review.replies.map((reply) => (
                      <div key={reply._id} className="flex flex-col gap-0.5">
                        <p className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                          {reply.message}
                        </p>
                        <span className="font-montserrat font-normal text-[10px] text-[#808080]">
                          Agent reply · {formatDate(reply.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply composer */}
                {isReplyOpen && (
                  <div className="flex flex-col gap-2 mt-3">
                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Write a reply…"
                      rows={2}
                      className="w-full resize-none rounded-md border border-gray-200 p-2 font-montserrat text-[12px] text-[#2b2b2b] focus:border-[#538e53] focus:outline-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleReply(review._id)}
                        className="px-3 py-1.5 cursor-pointer rounded border border-gray-200 text-[#808080] text-[11px] font-montserrat hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitReply(review._id)}
                        disabled={isReplying || !replyDraft.trim()}
                        className="px-4 py-1.5 cursor-pointer rounded bg-[#538e53] text-white text-[11px] font-montserrat hover:bg-[#467746] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isReplying ? "Posting…" : "Post reply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
