// services/reviewService.ts

import api from "@/lib/axios";

export interface Review {
  _id: string;
  agent: string;
  buyer: {
    _id: string;
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  likes?: number;
  replies?: ReviewReply[];
}

export interface ReviewReply {
  _id: string;
  message: string;
  repliedBy: string;
  createdAt: string;
}

export interface ReviewSummary {
  overallRating: number;
  totalReviews: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  recentReviewers: string[]; // avatar URLs or user IDs
}

export interface GetReviewsResponse {
  reviews: Review[];
}

/**
 * Who is being reviewed, from the UI's point of view.
 *
 * A user carries ONE rating, not one per role: `POST /api/reviews` stores the
 * review against `agent` whoever the target is, and the same average then
 * surfaces on `GET /api/sellers/{id}/reviews`, the transporter list and the
 * agent's own inbox. So this only drives copy/labels — the request body is
 * identical for all three.
 */
export type RevieweeType = "agent" | "seller" | "transporter";

export interface CreateReviewPayload {
  /** Id of the user being reviewed (agent, seller or transporter — same field). */
  agentId: string;
  rating: number;
  comment: string;
}

export interface ReplyToReviewPayload {
  message: string;
}

/**
 * Normalise a `GET /api/reviews/summary` response into `ReviewSummary`.
 * Returns null when the payload lacks the essential fields, so the caller can
 * fall back to client-side derivation. Tolerant of common field-name variants
 * and of `recentReviewers` arriving as strings or `{ name, avatar, id }` objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSummaryResponse = (body: any): ReviewSummary | null => {
  const data = body?.data ?? body;
  if (!data || typeof data !== "object") return null;

  const overallRating = Number(
    data.overallRating ?? data.averageRating ?? data.rating,
  );
  const dist = data.ratingDistribution ?? data.distribution;
  // Essential fields must be present, else fall back.
  if (!Number.isFinite(overallRating) || !Array.isArray(dist)) return null;

  const ratingDistribution = dist.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => ({
      rating: Number(d?.rating ?? d?.stars ?? 0),
      count: Number(d?.count ?? 0),
      percentage: Number(d?.percentage ?? 0),
    }),
  );

  const totalReviews = Number(
    data.totalReviews ?? data.totalReviewers ?? data.total ?? 0,
  );

  const rawReviewers = data.recentReviewers ?? data.reviewers ?? [];
  const recentReviewers: string[] = Array.isArray(rawReviewers)
    ? rawReviewers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) =>
          typeof r === "string" ? r : (r?.name ?? r?.avatar ?? r?.id ?? ""),
        )
        .filter(Boolean)
    : [];

  return {
    overallRating: Number(overallRating.toFixed(1)),
    totalReviews,
    ratingDistribution,
    recentReviewers,
  };
};

/**
 * Review API.
 *
 * Uses the shared `@/lib/axios` instance, which injects the NextAuth Bearer
 * token and handles 401 refresh/logout centrally. (Previously this read a
 * never-set `localStorage.authToken`, so every request went out unauthenticated.)
 */
export class ReviewService {
  /**
   * Get all agent reviews
   * GET /api/reviews
   */
  static async getReviews(): Promise<GetReviewsResponse> {
    try {
      const response = await api.get<
        { reviews?: Review[]; data?: Review[] } | Review[]
      >("/api/reviews");

      const body = response.data;
      const reviews: Review[] = Array.isArray(body)
        ? body
        : body?.reviews ?? body?.data ?? [];

      return { reviews };
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }
  }

  /**
   * Get reviews summary (ratings distribution, overall rating, etc.).
   *
   * Prefers the server-computed `GET /api/reviews/summary` when it exists and
   * returns a usable shape; otherwise falls back to deriving the summary from
   * the reviews list client-side. Either way the returned `ReviewSummary` shape
   * is identical, so the page's UI (and empty state) is unaffected.
   */
  static async getReviewsSummary(): Promise<ReviewSummary> {
    try {
      const response = await api.get("/api/reviews/summary");
      const mapped = mapSummaryResponse(response.data);
      if (mapped) return mapped;
    } catch {
      // 404 / not implemented / network — fall through to client-side derivation.
    }
    return this.deriveSummaryFromReviews();
  }

  /**
   * Derive the summary from the full reviews list (fallback when there is no
   * dedicated summary endpoint). Returns an all-zero summary on error so the
   * page renders its empty state rather than throwing.
   */
  private static async deriveSummaryFromReviews(): Promise<ReviewSummary> {
    try {
      const reviewsResponse = await this.getReviews();
      const reviews = reviewsResponse.reviews;

      // Calculate summary data
      const totalReviews = reviews.length;
      const overallRating =
        totalReviews > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      // Calculate rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
        const count = reviews.filter(
          (review) => review.rating === rating,
        ).length;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return {
          rating,
          count,
          percentage: Math.round(percentage),
        };
      });

      // Get recent reviewers (first 4 for avatars)
      const recentReviewers = reviews
        .slice(0, 4)
        .map((review) => review.buyer.name); // Using names as placeholder for avatars

      const summary = {
        overallRating: parseFloat(overallRating.toFixed(1)),
        totalReviews,
        ratingDistribution,
        recentReviewers,
      };

      return summary;
    } catch (error) {
      console.error("Error fetching reviews summary:", error);

      // Return empty summary on error
      const emptySummary = {
        overallRating: 0,
        totalReviews: 0,
        ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
          rating,
          count: 0,
          percentage: 0,
        })),
        recentReviewers: [],
      };

      return emptySummary;
    }
  }

  /**
   * Create a new review.
   *
   * Sends `agent` (the key documented in swagger) alongside `agentId` (the key
   * the deployed handler reads) so the call is correct against both. A second
   * review of the same user comes back as 409 + `hasReviewed`, which the
   * mutation surfaces as an already-reviewed state rather than an error.
   */
  static async createReview(
    payload: CreateReviewPayload,
  ): Promise<{ review: Review }> {
    try {
      const { agentId, rating, comment } = payload;
      const response = await api.post<{ review: Review }>("/api/reviews", {
        agent: agentId,
        agentId,
        rating,
        comment,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  }

  /**
   * Reply to a review
   */
  static async replyToReview(
    reviewId: string,
    payload: ReplyToReviewPayload,
  ): Promise<{ reply: ReviewReply }> {
    try {
      const response = await api.post<{ reply: ReviewReply }>(
        `/api/reviews/${reviewId}/reply`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error replying to review:", error);
      throw error;
    }
  }

  /**
   * Like a review
   */
  static async likeReview(
    reviewId: string,
  ): Promise<{ message: string; likes: number }> {
    try {
      const response = await api.post<{ message: string; likes: number }>(
        `/api/reviews/${reviewId}/like`,
      );
      return response.data;
    } catch (error) {
      console.error("Error liking review:", error);
      throw error;
    }
  }
}
