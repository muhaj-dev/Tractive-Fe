import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ReviewService,
  CreateReviewPayload,
  ReplyToReviewPayload,
} from "@/services/reviewService";
import { toast } from "sonner";

// Query key factory
export const reviewKeys = {
  all: ["reviews"] as const,
  list: () => [...reviewKeys.all, "list"] as const,
  summary: () => [...reviewKeys.all, "summary"] as const,
};

/**
 * Agent reviews list. Cached so the page and summary share one fetch.
 */
export const useReviews = () => {
  return useQuery({
    queryKey: reviewKeys.list(),
    queryFn: () => ReviewService.getReviews(),
    staleTime: 1000 * 60 * 3,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Ratings summary (overall rating + distribution). Derived server-side from
 * the same review set, keyed separately so it can render independently.
 */
export const useReviewsSummary = () => {
  return useQuery({
    queryKey: reviewKeys.summary(),
    queryFn: () => ReviewService.getReviewsSummary(),
    staleTime: 1000 * 60 * 3,
  });
};

/**
 * Create a review for an agent (buyer surface). `ReviewService.createReview`
 * existed but had no caller — buyers had no way to leave a review at all.
 * Invalidates both the list and the summary so the new rating is reflected
 * in the distribution as well as the feed.
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      ReviewService.createReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.summary() });
      toast.success("Review submitted", {
        duration: 3000,
        position: "top-center",
      });
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    }) => {
      // 409 + `hasReviewed` is the backend's duplicate guard, not a failure:
      // the buyer already reviewed this user. Report it as information so the
      // caller can switch the button to its reviewed state.
      if (error?.response?.status === 409) {
        toast(
          error.response.data?.message || "You have already reviewed this user",
          { duration: 3000, position: "top-center" },
        );
        return;
      }
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit review. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

/**
 * Reply to a review (agent surfaces `replyToReview`). On success it
 * invalidates the reviews list so the new reply + count render from cache.
 */
export const useReplyToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      payload,
    }: {
      reviewId: string;
      payload: ReplyToReviewPayload;
    }) => ReviewService.replyToReview(reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list() });
      toast.success("Reply posted", {
        duration: 3000,
        position: "top-center",
      });
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to post reply. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

/**
 * Like a review. Invalidates the list so the like count resyncs from server.
 */
export const useLikeReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => ReviewService.likeReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list() });
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to like review.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};
