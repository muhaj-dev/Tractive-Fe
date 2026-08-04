import api from "@/lib/axios";

export interface Transporter {
  id: string; // the frontend currently expects `id`
  _id?: string;
  image?: string;
  transporterName?: string;
  businessName?: string;
  name?: string;
  rating?: number;
  rateStatus?: string;
  transporterYear?: string | number;
  customerNumber?: number;
  coverageStates?: string[];
  customersCount?: number;
  transporterBio?: string;
  locationFrom?: string;
  locationTo?: string;
  [key: string]: unknown;
}

export interface ApiTruckBidder {
  id: string;
  name: string;
  loadWeightKg: number;
  loadWeightTonnes: number;
  equivalent50kgBags: number;
  equivalent100kgBags: number;
  loadDisplay: string;
}

export interface ApiTruckBidSummary {
  totalBids: number;
  activeBidsCount: number;
  successfulBidsCount: number;
  highestBidAmount: number | null;
  latestBidAmount: number | null;
  activeBidders: ApiTruckBidder[];
  successfulBidders: ApiTruckBidder[];
}

/** The truck's lane. This is where From/To live — there is no flat
 * `locationFrom`/`locationTo` on the wire. */
export interface ApiTruckRoute {
  fromState?: string;
  toState?: string;
}

export interface ApiTruck {
  _id: string;
  plateNumber: string;
  fleetName: string;
  fleetNumber?: string;
  iot?: string;
  model: string;
  capacity: string;
  capacityKg: number;
  capacityTonnes?: number;
  currentLoadKg: number;
  currentLoadTonnes?: number;
  remainingCapacityKg: number;
  remainingCapacityTonnes?: number;
  remainingCapacityDisplay: string;
  price: number;
  pricingModel: string;
  wholeTruckOnly: boolean;
  priceNegotiation?: boolean;
  estimatedDeliveryValue: number | null;
  estimatedDeliveryUnit: string | null;
  estimatedDeliveryText: string | null;
  bidSummary: ApiTruckBidSummary;
  priceUnitLabel: string;
  pricePerKgEquivalent: number;
  status: string;
  route?: ApiTruckRoute;
  fleetStates?: string;
  fleetDescription?: string;
  images?: string[];
  /** Owner. Comes back as a bare id string; may be populated on other routes. */
  transporter?: string | { _id?: string; id?: string; [key: string]: unknown };
  assignedDriver?: string | { _id?: string; [key: string]: unknown };
  createdAt?: string;
  updatedAt?: string;
  // Not sent by GET /trucks/{id} — kept optional for the list/redux shapes.
  size?: string;
  image?: string;
  locationFrom?: string;
  locationTo?: string;
  rating?: string;
}

export interface GetTransportersParams {
  search?: string;
  location?: string;
  rating?: number;
  yearsOfExperience?: number;
}

export interface TransporterCustomer {
  id: string;
  name: string;
  image?: string;
  state: string;
  mobile: string;
  orders: number | string;
  revenue: number | string;
  date: string;
  email?: string;
  address?: string;
}

export interface GetTransporterCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
  state?: string;
  year?: number;
  month?: string;
}

export interface GetTransporterCustomersResponse {
  data: TransporterCustomer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerChatPayload {
  subject: string;
  message: string;
}

export interface CustomerChatResponse {
  chatId: string;
  message: string;
  timestamp: string;
}

export interface TransporterReviewBuyer {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  avatar?: string;
}

export interface TransporterReview {
  _id?: string;
  id?: string;
  buyer?: TransporterReviewBuyer | string;
  rating: number;
  comment: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  likes?: number;
  replies?: number | unknown[];
}

export interface GetTransporterReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
  search?: string;
}

export interface GetTransporterReviewsResponse {
  reviews: TransporterReview[];
  overallRating?: number;
  totalReviews?: number;
  ratingDistribution?: { rating: number; count: number; percentage: number }[];
  recentReviewers?: { id?: string; name?: string; avatar?: string }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransporterTransactionApi {
  _id?: string;
  id?: string;
  status?: "pending" | "approved" | string;
  amount?: number;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  order?: {
    _id?: string;
    iot?: string;
    weightKg?: number;
    weight?: number;
    fleet?: {
      _id?: string;
      fleetName?: string;
      name?: string;
      description?: string;
      image?: string;
      images?: string[];
      plateNumber?: string;
    } | string;
    truck?: {
      _id?: string;
      fleetName?: string;
      name?: string;
      description?: string;
      plateNumber?: string;
      image?: string;
      images?: string[];
    } | string;
    [key: string]: unknown;
  } | string;
  buyer?: {
    _id?: string;
    name?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string;
  payer?: {
    _id?: string;
    name?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
  } | string;
  [key: string]: unknown;
}

export const transporterService = {
  /**
   * Get all transporters
   * GET /api/transporters
   */
  getTransporters: async (params?: GetTransportersParams): Promise<Transporter[]> => {
    try {
      const response = await api.get("/api/transporters", { params });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("[TransporterService] getTransporters error:", error);
      throw error;
    }
  },

  /**
   * Get transporter by id
   * GET /api/transporters/{id}
   */
  getTransporterById: async (id: string): Promise<Transporter> => {
    try {
      const response = await api.get(`/api/transporters/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[TransporterService] getTransporterById ${id} error:`, error);
      throw error;
    }
  },

  /**
   * Get transporter reviews
   * GET /api/transporters/{id}/reviews
   */
  getTransporterReviews: async (id: string): Promise<unknown> => {
    try {
      const response = await api.get(`/api/transporters/${id}/reviews`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[TransporterService] getTransporterReviews ${id} error:`, error);
      throw error;
    }
  },

  /**
   * Get fleet details by id
   * GET /api/transporters/fleet/{id}
   */
  getFleetById: async (id: string): Promise<unknown> => {
    try {
      const response = await api.get(`/api/transporters/fleets/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[TransporterService] getFleetById ${id} error:`, error);
      throw error;
    }
  },

  /**
   * Fleets comparable to the one being viewed — same route/size class.
   * GET /api/transporters/fleet/{id}/similar
   */
  getSimilarFleets: async (id: string): Promise<ApiTruck[]> => {
    try {
      const response = await api.get(`/api/transporters/fleet/${id}/similar`);
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? (data as ApiTruck[]) : [];
    } catch (error) {
      console.error(`[TransporterService] getSimilarFleets ${id} error:`, error);
      // A dead "similar" strip must not take down the booking page.
      return [];
    }
  },

  /**
   * Get truck by id
   * GET /api/transporters/trucks/{id}
   */
  getTruckById: async (id: string): Promise<ApiTruck> => {
    try {
      const response = await api.get(`/api/transporters/trucks/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[TransporterService] getTruckById ${id} error:`, error);
      throw error;
    }
  },

  /**
   * Get transporter trucks
   * GET /api/transporters/trucks
   */
  getTransporterTrucks: async (params?: {
    status?: string;
    fromState?: string;
    toState?: string;
  }): Promise<unknown> => {
    try {
      const response = await api.get("/api/transporters/trucks", { params });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("[TransporterService] getTransporterTrucks error:", error);
      throw error;
    }
  },

  /**
   * Get transporter customers
   * GET /api/transporters/customers?search&year&month&state&page&limit
   */
  getCustomers: async (
    params?: GetTransporterCustomersParams,
  ): Promise<GetTransporterCustomersResponse> => {
    try {
      const response = await api.get("/api/transporters/customers", { params });
      const body = response.data;
      const payload = body?.data ?? body;
      const list: TransporterCustomer[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.customers)
          ? payload.customers
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      const pagination = body?.pagination ?? payload?.pagination;
      return { data: list, pagination };
    } catch (error) {
      console.error("[TransporterService] getCustomers error:", error);
      throw error;
    }
  },

  /**
   * Get a single transporter customer profile
   * GET /api/transporters/customers/{id}
   */
  getCustomerById: async (id: string): Promise<TransporterCustomer> => {
    try {
      const response = await api.get(`/api/transporters/customers/${id}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(`[TransporterService] getCustomerById ${id} error:`, error);
      throw error;
    }
  },

  /**
   * Start a support chat with one of the transporter's customers
   * POST /api/transporters/customers/{id}/chat
   */
  initiateCustomerChat: async (
    id: string,
    payload: CustomerChatPayload,
  ): Promise<CustomerChatResponse> => {
    try {
      const response = await api.post(
        `/api/transporters/customers/${id}/chat`,
        payload,
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `[TransporterService] initiateCustomerChat ${id} error:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get reviews for the authenticated transporter
   * GET /api/transporters/reviews
   */
  getReviews: async (
    params?: GetTransporterReviewsParams,
  ): Promise<GetTransporterReviewsResponse> => {
    try {
      const response = await api.get("/api/transporters/reviews", { params });
      const body = response.data;
      const payload = body?.data ?? body;
      const reviews: TransporterReview[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.reviews)
          ? payload.reviews
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      return {
        reviews,
        overallRating: payload?.overallRating,
        totalReviews: payload?.totalReviews,
        ratingDistribution: payload?.ratingDistribution,
        recentReviewers: payload?.recentReviewers,
        pagination: body?.pagination ?? payload?.pagination,
      };
    } catch (error) {
      console.error("[TransporterService] getReviews error:", error);
      throw error;
    }
  },

  /**
   * Get transporter transactions
   * GET /api/transporters/transactions
   */
  getTransactions: async (): Promise<TransporterTransactionApi[]> => {
    try {
      const response = await api.get("/api/transporters/transactions");
      const body = response.data;
      const payload = body?.data ?? body;
      const list = payload?.transactions ?? payload ?? [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error("[TransporterService] getTransactions error:", error);
      throw error;
    }
  },
};
