import { ReviewIcon, XIcon } from "@/icons/Icon1";
import { LikeIcon, ReplyIcon, StarIcon, YellowStarIcon } from "@/icons/Icons";
import { useAnimation, motion } from "framer-motion";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useReplyToReview } from "@/hooks/queries/useReviewQueries";

// Define TypeScript interfaces for the data structure
interface User {
  name: string;
  avatar: string;
}

interface Rating {
  stars: string;
  count: number;
  percentage: number;
}

interface Review {
  id: number;
  user: User;
  rating: number;
  comment: string;
  date: string;
  image: string;
  replies: number;
  likes: number;
}

interface ReviewData {
  overallRating: number;
  totalReviewers: number;
  ratings: Rating[];
  reviews: Review[];
  reviewerAvatars: string[];
}

// Props interface for the Reviews component
interface ReviewsProps {
  sellerId?: string;
  transporterId?: string;
  /**
   * Show the reply composer. `POST /api/reviews/{id}/reply` is gated on
   * `activeRole === "agent"` (a buyer gets 403 "Agent access required"), and
   * this modal renders on the buyer-facing store/transporter pages — so replying
   * is off unless a caller is showing it to the reviewed agent themselves.
   */
  canReply?: boolean;
  onClose: () => void;
}

import { useGetSellerReviews, useLikeReview } from "@/hooks/queries/useSellerQueries";
import { useGetTransporterReviews } from "@/hooks/queries/useTransporterQueries";

const EMPTY_RATINGS: Rating[] = [5, 4, 3, 2, 1].map((s) => ({
  stars: `${s} star`,
  count: 0,
  percentage: 0,
}));

const EMPTY_DATA: ReviewData = {
  overallRating: 0,
  totalReviewers: 0,
  ratings: EMPTY_RATINGS,
  reviews: [],
  reviewerAvatars: [],
};

export const Reviews: React.FC<ReviewsProps> = ({
  sellerId,
  transporterId,
  canReply = false,
  onClose,
}) => {
  const sellerQuery = useGetSellerReviews(sellerId as string);
  const transporterQuery = useGetTransporterReviews(transporterId as string, { enabled: !!transporterId });

  const apiReviewData = sellerId ? sellerQuery.data : transporterQuery.data;
  const isLoading = sellerId ? sellerQuery.isLoading : transporterQuery.isLoading;
  // Distinguish "this user has no reviews" from "the request failed" — the
  // transporter reviews endpoint currently 400s, and silently showing an empty
  // state for that reads as a rating of zero.
  const loadError = sellerId ? sellerQuery.error : transporterQuery.error;

  const likeMutation = useLikeReview();

  // Reply composer. The Reply control used to be an inert <div> that only
  // showed a count — POST /api/reviews/{id}/reply was never called from here.
  const replyToReview = useReplyToReview();
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const toggleReply = (reviewId: string) => {
    setOpenReplyId((current) => (current === reviewId ? null : reviewId));
    setReplyDraft("");
  };

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

  // Render only what the API returns. A seller with no reviews gets a genuine
  // empty state — never invented reviewers, ratings or counts.
  const mappedData: ReviewData = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rd = apiReviewData as any;
    if (!rd) return EMPTY_DATA;

    const rawReviews: unknown[] = Array.isArray(rd.reviews) ? rd.reviews : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: Review[] = rawReviews.map((raw: any, index: number) => {
      const buyer = raw?.user ?? raw?.buyer ?? {};
      const replies = raw?.replies;
      return {
        id: raw?.id ?? raw?._id ?? index,
        user: {
          name: buyer?.name ?? buyer?.fullName ?? "Anonymous",
          avatar: buyer?.avatar ?? buyer?.image ?? "",
        },
        rating: Number(raw?.rating) || 0,
        comment: raw?.comment ?? "",
        date: raw?.date ?? raw?.createdAt ?? "",
        image: raw?.image ?? "",
        replies: Array.isArray(replies)
          ? replies.length
          : Number(raw?.repliesCount ?? replies) || 0,
        likes: Number(raw?.likesCount ?? raw?.likes) || 0,
      };
    });

    const totalReviewers =
      Number(rd.totalReviewers ?? rd.totalReviews) || reviews.length;

    // `ratingDistribution` arrives as `{ "5_star": 1, … }` from the seller
    // endpoint and as an array of `{ rating, count }` elsewhere.
    const rawDist = rd.ratings ?? rd.ratingDistribution;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dist: any[] = Array.isArray(rawDist)
      ? rawDist
      : rawDist && typeof rawDist === "object"
        ? Object.entries(rawDist).map(([key, count]) => ({
            rating: Number(String(key).replace(/[^0-9]/g, "")),
            count,
          }))
        : [];

    const ratings: Rating[] = dist.length
      ? [5, 4, 3, 2, 1].map((star) => {
          const entry = dist.find(
            (d) => Number(d?.rating ?? String(d?.stars).charAt(0)) === star,
          );
          const count = Number(entry?.count) || 0;
          return {
            stars: `${star} star`,
            count,
            // The object shape carries counts only — derive the bar width.
            percentage:
              Number(entry?.percentage) ||
              (totalReviewers ? (count / totalReviewers) * 100 : 0),
          };
        })
      : EMPTY_RATINGS;

    return {
      overallRating: Number(rd.overallRating ?? rd.averageRating) || 0,
      totalReviewers,
      ratings,
      reviews,
      reviewerAvatars: (Array.isArray(rd.reviewerAvatars)
        ? rd.reviewerAvatars
        : Array.isArray(rd.recentReviewers)
          ? rd.recentReviewers
          : []
      ).filter(
        (a: unknown): a is string =>
          typeof a === "string" && /^(https?:\/\/|\/)/.test(a),
      ),
    };
  }, [apiReviewData]);

  const { overallRating, totalReviewers, ratings, reviews, reviewerAvatars } = mappedData;

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

  useEffect(() => {
    // Start animation for each progress bar on mount
    controls.forEach((control, index) => {
      control.start({
        width: `${ratings[index]?.percentage || 0}%`,
        transition: { duration: 1, ease: "easeOut" },
      });
    });
  }, [controls, ratings]);

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

  // Define left offsets for mobile and sm screens
  const leftOffsetsMobile = [0, 10, 20, 30];
  const leftOffsetsSm = [0, 12, 28, 40];

  return (
    <div className="relative bg-[#fefefe] flex flex-col items-center w-full max-w-[600px] md:max-w-[721px] overflow-y-auto max-h-[90vh] hide-scrollbar px-6 py-6 gap-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
      <div className="absolute top-3 right-3 cursor-pointer" onClick={onClose}>
        <XIcon />
      </div>
      <div className="flex items-center w-full flex-col sm:flex-row gap-3 pt-3.5">
        <div className="flex flex-col w-[100%] bg-[#f1f1f1] p-1.5">
          <div className="flex items-center gap-[4px]">
            <div className="flex items-center gap-1.5">
              {renderStars(overallRating)}
            </div>
            <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
              {overallRating.toFixed(1)}
            </span>
          </div>
          <span className="w-full h-[1px] bg-[#fefefe] mt-1"></span>
          <div className="flex flex-col w-[100%] bg-[#f1f1f1] p-0.5">
            {ratings.map((rating, index) => (
              <div
                key={rating.stars}
                className="flex items-center gap-1 sm:gap-2 w-full"
              >
                <div className="flex items-center gap-1">
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
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
        </div>

        <div className="flex flex-col gap-2 w-[100%] sm:w-[100%] bg-[#f1f1f1] p-4">
          <div className="flex gap-2 items-center justify-start">
            <div className="flex gap-2 items-center justify-center bg-[#f1f1f1] w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] p-1 rounded-[100px]">
              <ReviewIcon />
            </div>
            <p className="font-montserrat font-normal text-[10px] sm:text-[15px] text-[#2b2b2b] truncate">
              Reviews
            </p>
          </div>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="relative w-[40px] h-[40px] overflow-visible">
                {reviewerAvatars.length > 0 ? (
                  reviewerAvatars.map((avatar, index) => (
                    <Image
                      key={index}
                      src={avatar}
                      alt={`Reviewer ${index + 1}`}
                      width={50}
                      height={50}
                      className={`absolute left-[${leftOffsetsMobile[index]}px] sm:left-[${leftOffsetsSm[index]}px] z-50
                      }] w-[35px] h-[35px] rounded-full border-2 border-[#fefefe]`}
                      onError={(e) => {
                        console.error(`Failed to load image: ${avatar}`);
                        e.currentTarget.src = "/images/placeholder.png"; // Fallback image
                      }}
                    />
                  ))
                ) : (
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                    No avatars available
                  </span>
                )}
              </div>
              <p className="font-montserrat font-normal text-[11px] sm:text-[15px] text-[#2b2b2b]">
                + {totalReviewers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="flex flex-col gap-6 w-full">
        {isLoading ? (
          <p className="font-montserrat text-[12px] text-[#808080] py-6 text-center">
            Loading reviews…
          </p>
        ) : loadError ? (
          <p className="font-montserrat text-[12px] text-[#c0392b] py-6 text-center">
            Reviews could not be loaded right now.
          </p>
        ) : reviews.length === 0 ? (
          <p className="font-montserrat text-[12px] text-[#808080] py-6 text-center">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-1.5 pt-2 rounded-[5px]"
            >
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="relative flex items-center gap-2 flex-wrap">
                  <Image
                    src={review.user.avatar || "/images/sellerprofile.png"}
                    alt={`${review.user.name} profile`}
                    width={30}
                    height={30}
                    className="w-[30px] h-[30px] rounded-full object-cover"
                  />
                  <p className="font-montserrat font-normal text-[14px] text-[#2b2b2b]">
                    {review.user.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className="flex justify-between w-[100%] flex-wrap">
                <p className="font-montserrat w-[80%] font-normal text-[11px] text-[#2b2b2b]">
                  {review.comment}
                </p>
                {review.date && (
                  <span className="font-montserrat w-[20%] flex justify-end font-normal text-[11px] text-[#808080]">
                    {new Date(review.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {review.image && (
                  <Image
                    src={review.image}
                    alt="Ordered Item"
                    width={211}
                    height={77}
                  />
                )}
                <div className="flex items-center gap-[46px] truncate">
                  {canReply ? (
                    <button
                      type="button"
                      onClick={() => toggleReply(String(review.id))}
                      className="flex items-center gap-[6px] cursor-pointer hover:opacity-80 transition-opacity"
                      aria-expanded={openReplyId === String(review.id)}
                    >
                      <ReplyIcon />
                      <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                        {review.replies} replies
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-[6px]">
                      <ReplyIcon />
                      <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                        {review.replies} replies
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-[6px] cursor-pointer hover:opacity-80 transition-opacity ${likeMutation.isPending && likeMutation.variables === String(review.id) ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => likeMutation.mutate(String(review.id))}
                  >
                    <LikeIcon />
                    <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                      {review.likes} Likes
                    </span>
                  </div>
                </div>

                {canReply && openReplyId === String(review.id) && (
                  <div className="flex flex-col gap-2 w-full">
                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Write a reply…"
                      rows={2}
                      className="w-full rounded-[4px] border border-[#e2e2e2] px-3 py-2 font-montserrat text-[11px] text-[#2b2b2b] outline-none focus:border-[#538e53]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(String(review.id))}
                        disabled={
                          !replyDraft.trim() || replyToReview.isPending
                        }
                        className="rounded-[4px] bg-[#538e53] px-3 py-1.5 font-montserrat text-[11px] text-[#fefefe] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {replyToReview.isPending ? "Posting…" : "Post reply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleReply(String(review.id))}
                        className="rounded-[4px] border border-[#e2e2e2] px-3 py-1.5 font-montserrat text-[11px] text-[#2b2b2b] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
