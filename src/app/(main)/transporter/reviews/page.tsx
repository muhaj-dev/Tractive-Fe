"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ReviewIcon } from "@/icons/Icon1";
import { LikeIcon, ReplyIcon, StarIcon, YellowStarIcon } from "@/icons/Icons";
import { useAnimation, motion } from "framer-motion";
import Image from "next/image";
import UserAvatar from "@/components/UserAvatar";
import {
  transporterService,
  TransporterReview,
  TransporterReviewBuyer,
} from "@/services/transporterService";

/** A real reviewer for the avatar stack. */
interface Reviewer {
  key: string;
  name: string;
  avatar?: string;
}

interface Rating {
  stars: string;
  count: number;
  percentage: number;
}


const resolveBuyer = (
  buyer: TransporterReview["buyer"],
): TransporterReviewBuyer => {
  if (!buyer) return {};
  if (typeof buyer === "string") return { _id: buyer };
  return buyer;
};

const replyCount = (replies: TransporterReview["replies"]): number => {
  if (typeof replies === "number") return replies;
  if (Array.isArray(replies)) return replies.length;
  return 0;
};

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<TransporterReview[]>([]);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [totalReviewers, setTotalReviewers] = useState<number>(0);
  const [ratings, setRatings] = useState<Rating[]>([
    { stars: "5 star", count: 0, percentage: 0 },
    { stars: "4 star", count: 0, percentage: 0 },
    { stars: "3 star", count: 0, percentage: 0 },
    { stars: "2 star", count: 0, percentage: 0 },
    { stars: "1 star", count: 0, percentage: 0 },
  ]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const control1 = useAnimation();
  const control2 = useAnimation();
  const control3 = useAnimation();
  const control4 = useAnimation();
  const control5 = useAnimation();

  const controls = useMemo(
    () => [control1, control2, control3, control4, control5],
    [control1, control2, control3, control4, control5],
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await transporterService.getReviews();
        if (!isMounted) return;

        const list = response.reviews ?? [];
        setReviews(list);

        const total = response.totalReviews ?? list.length;
        setTotalReviewers(total);

        if (response.overallRating !== undefined) {
          setOverallRating(response.overallRating);
        } else if (list.length) {
          const sum = list.reduce((acc, r) => acc + (r.rating || 0), 0);
          setOverallRating(parseFloat((sum / list.length).toFixed(1)));
        } else {
          setOverallRating(0);
        }

        if (response.ratingDistribution?.length) {
          const ordered = [5, 4, 3, 2, 1].map((star) => {
            const found = response.ratingDistribution!.find(
              (r) => r.rating === star,
            );
            return {
              stars: `${star} star`,
              count: found?.count ?? 0,
              percentage: found?.percentage ?? 0,
            };
          });
          setRatings(ordered);
        } else {
          const totalForPct = list.length || 1;
          setRatings(
            [5, 4, 3, 2, 1].map((star) => {
              const count = list.filter((r) => r.rating === star).length;
              return {
                stars: `${star} star`,
                count,
                percentage: Math.round((count / totalForPct) * 100),
              };
            }),
          );
        }

        // Named reviewers from the API (photo optional — initials stand in),
        // else the people on the reviews themselves.
        const recent: Reviewer[] = (response.recentReviewers ?? [])
          .filter((r) => !!r.name)
          .map((r) => ({ key: r.id || r.name!, name: r.name!, avatar: r.avatar }));
        const fromReviews: Reviewer[] = list
          .map((r) => resolveBuyer(r.buyer))
          .filter((b) => !!b.name)
          .map((b) => ({
            key: b._id || b.name!,
            name: b.name!,
            avatar: b.avatar || b.image,
          }));
        const seen = new Set<string>();
        setReviewers(
          (recent.length ? recent : fromReviews)
            .filter((r) => !seen.has(r.key) && !!seen.add(r.key))
            .slice(0, 4),
        );
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error fetching transporter reviews:", err);
        setError(
          (err as { message?: string })?.message || "Failed to load reviews",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    controls.forEach((control, index) => {
      control.start({
        width: `${ratings[index]?.percentage ?? 0}%`,
        transition: { duration: 1, ease: "easeOut" },
      });
    });
  }, [controls, ratings]);

  const renderStars = (rating: number): React.ReactElement[] => {
    const stars: React.ReactElement[] = [];
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rounded ? <YellowStarIcon key={i} /> : <StarIcon key={i} />,
      );
    }
    return stars;
  };


  if (isLoading) {
    return (
      <div className="relative bg-[#fefefe] flex items-center justify-center w-[95%] mx-auto mb-[2rem] px-6 py-10 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
          <span className="font-montserrat text-[14px] text-[#808080]">
            Loading reviews...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative bg-[#fefefe] flex items-center justify-center w-[95%] mx-auto mb-[2rem] px-6 py-10 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <span className="font-montserrat text-[14px] text-red-500">
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className="relative bg-[#fefefe] flex flex-col items-center w-[95%] mx-auto mb-[2rem] px-6 py-6 gap-3 rounded-[7px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
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
            <div className="flex gap-2 items-center justify-center bg-[#e2e2e2] w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] p-1 rounded-[100px]">
              <ReviewIcon stroke="#2b2b2b" />
            </div>
            <p className="font-montserrat font-normal text-[10px] sm:text-[15px] text-[#2b2b2b] truncate">
              Reviews
            </p>
          </div>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-6 sm:gap-10">
              {/* Real reviewers only — nothing at all when the API has none. */}
              {reviewers.length > 0 && (
                <>
                  <div className="flex -space-x-2">
                    {reviewers.map((reviewer) => (
                      <UserAvatar
                        key={reviewer.key}
                        src={reviewer.avatar}
                        name={reviewer.name}
                        size={35}
                        className="ring-2 ring-[#fefefe]"
                      />
                    ))}
                  </div>
                  <p className="font-montserrat font-normal text-[11px] sm:text-[15px] text-[#2b2b2b]">
                    {Math.max(totalReviewers, reviewers.length).toLocaleString()}{" "}
                    {Math.max(totalReviewers, reviewers.length) === 1
                      ? "review"
                      : "reviews"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {reviews.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <span className="font-montserrat text-[14px] text-[#808080]">
              No reviews yet
            </span>
          </div>
        ) : (
          reviews.map((review) => {
            const buyer = resolveBuyer(review.buyer);
            const avatar = buyer.avatar || buyer.image;
            const reviewKey = review._id || review.id || buyer._id || Math.random();
            return (
              <div
                key={String(reviewKey)}
                className="flex flex-col gap-1.5 pt-2 rounded-[5px]"
              >
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="relative flex items-center gap-2 flex-wrap">
                    <UserAvatar
                      src={avatar}
                      name={buyer.name || "Anonymous"}
                      size={30}
                    />
                    <p className="font-montserrat font-normal text-[14px] text-[#2b2b2b]">
                      {buyer.name || "Anonymous"}
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
                  {review.createdAt && (
                    <span className="font-montserrat w-[20%] flex justify-end font-normal text-[11px] text-[#808080]">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
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
                    <div className="flex items-center gap-[6px]">
                      <ReplyIcon />
                      <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                        {replyCount(review.replies)} replies
                      </span>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <LikeIcon />
                      <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                        {review.likes ?? 0} Likes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
