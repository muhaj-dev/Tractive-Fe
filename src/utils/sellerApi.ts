import { toast } from "sonner";
import api from "@/lib/axios";

/** One bar of the 5★→1★ breakdown. `percentage` is sent by the API but the UI
 * recomputes it from `count`/`totalReviews` when absent. */
export interface SellerRatingBucket {
  rating: number;
  count: number;
  percentage?: number;
}

export interface Seller {
  sellerId: string;
  name: string;
  email: string;
  productsCount: number;
  farmersCount?: number;
  roles: string[];
  activeRole: string;
  followersCount?: number;
  phoneNumbers?: string[];
  yearsOfExperience?: number;
  bio?: string;
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: SellerRatingBucket[];
  amountOfSales?: number;
  recommendations?: unknown[];
  products?: unknown[];
  image?: string | null;
  rating?: number;
  rateStatus?: string;
  sellerYear?: string | number;
  customerNumber?: number;
  sellerBio?: string | null;
  location?: string;
  isFollowing?: boolean;
  isVerified?: boolean;
}

interface SellersResponse {
  success: boolean;
  data: Seller[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface GetSellersParams {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  year?: number;
  rating?: number;
}

export const getSellers = async (params?: GetSellersParams): Promise<SellersResponse> => {
  try {
    const response = await api.get<SellersResponse>(`/api/sellers`, { params });

    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to load sellers");
      return { success: false, data: [], pagination: { page: 1, limit: 12, total: 0 } };
    }
  } catch (error) {
    console.error("Error fetching sellers:", error);
    toast.error("Error loading sellers list");
    return { success: false, data: [], pagination: { page: 1, limit: 12, total: 0 } };
  }
};

/**
 * GET /api/sellers/{id} — the authoritative seller payload. Only this route
 * carries `ratingDistribution` and `isFollowing`; the /api/sellers list does
 * not, so the list fallback below is a degraded last resort (empty rating bars)
 * and must not be treated as equivalent.
 */
export const getSellerById = async (id: string): Promise<Seller | null> => {
  try {
    const response = await api.get<{ success: boolean; data: Seller }>(
      `/api/sellers/${id}`
    );
    if (response.data.success) {
      return response.data.data;
    }
    console.warn(`Seller ${id} returned success=false; falling back to list.`);
  } catch (error) {
    console.warn(`Direct seller fetch failed for ${id}; falling back to list.`, error);
  }

  try {
    const sellersResponse = await getSellers();
    return sellersResponse.data.find((s) => s.sellerId === id) ?? null;
  } catch (error) {
    console.error("Error fetching seller details:", error);
    return null;
  }
};

export interface GetSellerProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "available" | "out_of_stock" | "discontinued";
  category?: string;
}

export const getSellerProducts = async (id: string, params?: GetSellerProductsParams): Promise<unknown[]> => {
    try {
        const response = await api.get<{ success: boolean; data: unknown[] }>(
            `/api/sellers/${id}/products`,
            { params }
        );
        if (response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching seller products:", error);
        return [];
    }
}

export interface SellerReview {
  id: string;
  user: { name: string; avatar: string };
  rating: number;
  comment: string;
  date: string;
  image: string;
  replies: number;
  likes: number;
}

export interface SellerReviewsResult {
  overallRating: number;
  totalReviewers: number;
  ratings: { stars: string; count: number; percentage: number }[];
  reviews: SellerReview[];
  reviewerAvatars: string[];
}

const EMPTY_REVIEWS: SellerReviewsResult = {
  overallRating: 0,
  totalReviewers: 0,
  ratings: [5, 4, 3, 2, 1].map((s) => ({
    stars: `${s} star`,
    count: 0,
    percentage: 0,
  })),
  reviews: [],
  reviewerAvatars: [],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapSellerReview = (raw: any): SellerReview => {
  const buyer = raw?.buyer ?? raw?.user ?? {};
  const replies = raw?.replies;
  return {
    id: String(raw?._id ?? raw?.id ?? ""),
    user: {
      name: buyer?.name ?? buyer?.fullName ?? "Anonymous",
      avatar: buyer?.image ?? buyer?.avatar ?? "",
    },
    rating: Number(raw?.rating) || 0,
    comment: raw?.comment ?? raw?.message ?? "",
    date: raw?.createdAt ?? raw?.date ?? "",
    image: raw?.image ?? (Array.isArray(raw?.images) ? raw.images[0] : "") ?? "",
    replies: Array.isArray(replies)
      ? replies.length
      : Number(raw?.repliesCount ?? replies) || 0,
    likes: Number(raw?.likesCount ?? raw?.likes) || 0,
  };
};

/**
 * GET /api/sellers/{id}/reviews — normalised into the shape the Reviews UI
 * renders. Returns an all-zero result (never mock data) when the seller has no
 * reviews, so an unrated seller shows a genuine empty state.
 */
export const getSellerReviews = async (
  id: string
): Promise<SellerReviewsResult> => {
  try {
    const response = await api.get(`/api/sellers/${id}/reviews`);
    const body: any = response.data;
    const data = body?.data ?? body;

    const rawReviews: any[] = Array.isArray(data)
      ? data
      : data?.reviews ?? data?.items ?? [];
    const reviews = rawReviews.map(mapSellerReview);

    const totalReviewers =
      Number(data?.totalReviews ?? data?.totalReviewers ?? data?.total) ||
      reviews.length;

    const overallRating =
      Number(data?.overallRating ?? data?.averageRating) ||
      (reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0);

    // The endpoint returns the distribution as an object keyed `5_star`…`1_star`;
    // older/other shapes send an array of `{ rating, count }`. Support both.
    const rawDist = data?.ratingDistribution;
    const dist: any[] = Array.isArray(rawDist)
      ? rawDist
      : rawDist && typeof rawDist === "object"
        ? Object.entries(rawDist).map(([key, count]) => ({
            rating: Number(String(key).replace(/[^0-9]/g, "")),
            count,
          }))
        : [];
    const ratings = [5, 4, 3, 2, 1].map((star) => {
      const entry = dist.find((d) => Number(d?.rating) === star);
      const count =
        entry != null
          ? Number(entry.count) || 0
          : reviews.filter((r) => Math.round(r.rating) === star).length;
      const percentage = Number(
        entry?.percentage ?? (totalReviewers ? (count / totalReviewers) * 100 : 0)
      );
      return { stars: `${star} star`, count, percentage };
    });

    return {
      overallRating: Number(overallRating.toFixed(1)),
      totalReviewers,
      ratings,
      reviews,
      reviewerAvatars: reviews
        .map((r) => r.user.avatar)
        .filter(Boolean)
        .slice(0, 4),
    };
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    return EMPTY_REVIEWS;
  }
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Like a review
export const likeReview = async (reviewId: string): Promise<unknown> => {
    try {
        const response = await api.post(`/api/reviews/${reviewId}/like`);
        return response.data;
    } catch (error) {
        console.error("Error liking review:", error);
        throw error;
    }
}
