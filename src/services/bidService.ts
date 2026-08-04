import api from "@/lib/axios";
import axios from "axios";

export interface BidListing {
  id: string;
  productName: string;
  productImage: string;
  productDescription?: string;
  productPrice: number;
  proposedPrice: number;
  quantity: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  buyer: {
    name: string;
    email?: string;
    avatar?: string;
  };
  farmerId?: string;
  farmerName?: string;
  createdAt: string;
}

// ... (interfaces)
export interface SingleBid {
  id: string; // Bid ID
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
  counterOffer?: number;
  quantity: number;
  message: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  date: string;
}

export interface BidListingDetails extends BidListing {
  bids: SingleBid[];
}

export interface BidResponse {
  _id: string;
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    unit: string;
    owner: string;
    farmer: string | { _id: string; name: string; businessName: string };
    images: string[];
    videos: string[];
    status: string;
    discount: number;
    categories: string[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  buyer: {
    _id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  agent: string | {
    _id: string;
    email: string;
    roles: string[];
    activeRole: string;
    name: string;
    address: string;
    country: string;
    phone: string;
    state: string;
  };
  amount: number;
  quantity: number;
  unit: string;
  unitWeightKg?: number;
  status: "pending" | "approved" | "rejected" | "countered";
  message: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface WonBidsCheckoutResponse {
  bids: BidResponse[];
  productsSubtotal: number;
  localTransportTotal: number;
  totalAmount: number;
}

export interface BidsByStatusPagination {
  page: number;
  limit: number;
  total: number;
}

export interface BidsByStatusResponse {
  bids: BidResponse[];
  pagination: BidsByStatusPagination;
}

const handleApiError = (error: unknown, operation: string) => {
  console.error(`❌ Error ${operation}:`, error);
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const apiMessage =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) && data.errors[0]?.message) ||
      (Array.isArray(data?.errors) && typeof data.errors[0] === "string"
        ? data.errors[0]
        : null);
    if (apiMessage) throw new Error(apiMessage);
  }
  throw new Error(`Failed to ${operation}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapToBidListing = (item: any): BidListing => {
  return {
    id: item?._id,
    productName: item?.product?.name || "Unknown Product",
    productImage: item?.product?.images?.[0] || "/images/placeholder.png",
    productDescription: item?.product?.description || "",
    productPrice: item?.product?.price || 0,
    proposedPrice: item?.amount || 0,
    quantity: item?.product?.quantity || 0, // Using product quantity as fallback if bid quantity missing
    message: item?.message,
    status: item?.status || "pending",
    buyer: {
      name: item?.buyer?.name || "Unknown Buyer",
      email: item?.buyer?.email,
      avatar: item?.buyer?.avatar, 
    },
    farmerId: typeof item?.product?.farmer === "object" ? item?.product?.farmer?._id : item?.product?.farmer,
    farmerName: typeof item?.product?.farmer === "object" ? item?.product?.farmer?.name : "Unknown Farmer",
    createdAt: item?.createdAt,
  };
};

export const bidService = {
  // GET /api/bids - Get all bids (listings)
  // `filters` (search/year/month) are forwarded as query params. Backend
  // support for these is pending — see API-FEEDBACK-FOR-BACKEND.md (Item 8).
  getBids: async (
    page = 1,
    limit = 10,
    filters?: { search?: string; year?: number; month?: number },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ data: BidListing[]; pagination: any }> => {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filters?.search) params.search = filters.search;
      if (filters?.year !== undefined) params.year = filters.year;
      if (filters?.month !== undefined) params.month = filters.month;

      const response = await api.get("/api/bids", { params });
      const rawData = response.data.data || [];
      const data = rawData.map(mapToBidListing);
      return {
        data,
        pagination: response.data.pagination || {
          page,
          limit,
          total: data.length,
        },
      };
    } catch (error) {
      return handleApiError(error, "fetch bids");
    }
  },

  // GET /api/bids/{id} - Get single bid details (Listing with Bidders)
  getBidDetails: async (id: string): Promise<BidListingDetails> => {
    try {
      const response = await api.get(`/api/bids/${id}`);
      let item = response.data.data || response.data;

      // Handle case where response is wrapped in "bid" object
      if (item.bid) {
        item = item.bid;
      }

      const listing = mapToBidListing(item);

      // Map nested bids if available, or fetch them if separate?
      // Assuming they come nested as 'bids' or 'buyers'
      // If single bid object is returned, treat as single bidder
      let rawBids = item.bids || item.buyers || [];
      
      if (rawBids.length === 0 && item.buyer) {
         rawBids = [item];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bids: SingleBid[] = rawBids.map((b: any) => ({
        id: b?._id || b?.id,
        bidderName: b?.buyer?.name || b?.bidderName || b?.user?.name || "Unknown Bidder",
        bidderAvatar: b?.buyer?.avatar || b?.bidderAvatar || b?.user?.avatar,
        amount: b?.amount || b?.proposedPrice || 0,
        counterOffer: b?.counterOffer,
        quantity: b?.quantity || b?.product?.quantity || 0,
        message: b?.message || "",
        status: b?.status || "pending",
        date: b?.createdAt || b?.date,
      }));

      return {
        ...listing,
        bids,
      };
    } catch (error) {
      return handleApiError(error, "fetch bid details");
    }
  },

  // POST /api/bids - Create a new bid
  createBid: async (data: {
    productId: string;
    amount: number;
    quantity: number;
    message: string;
  }) => {
    try {
      const response = await api.post("/api/bids", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, "create bid");
    }
  },

  // PATCH /api/bids/{id} - Update bid status (Accept/Reject/Counter)
  updateBidStatus: async (
    id: string,
    updates: {
      status: "accepted" | "rejected" | "countered";
      counterOffer?: number;
      message?: string;
    },
  ) => {
    try {
      const response = await api.patch(`/api/bids/${id}`, updates);
      return response.data;
    } catch (error) {
      return handleApiError(error, "update bid status");
    }
  },

  // DELETE /api/bids/{id} - Withdraw a bid the buyer placed. Pending bids only;
  // the backend rejects the call once the bid has been accepted.
  withdrawBid: async (id: string) => {
    try {
      const response = await api.delete(`/api/bids/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, "withdraw bid");
    }
  },

  // GET /api/buyers/biddings - Get my biddings
  getMyBids: async (): Promise<BidResponse[]> => {
    try {
      const response = await api.get("/api/buyers/biddings");
      return response.data.data;
    } catch (error) {
      return handleApiError(error, "fetch my bids");
    }
  },

  // GET /api/buyers/biddings?status=<status> - Get my biddings filtered by status (paginated)
  getBidsByStatus: async (
    status: "pending" | "countered" | "approved" | "accepted" | "rejected",
    page = 1,
    limit = 10,
  ): Promise<BidsByStatusResponse> => {
    try {
      const response = await api.get("/api/buyers/biddings", {
        params: { status, page, limit },
      });
      const payload = response.data?.data ?? response.data;

      let bids: BidResponse[] = [];
      if (Array.isArray(payload)) bids = payload;
      else if (Array.isArray(payload?.bids)) bids = payload.bids;
      else if (Array.isArray(payload?.data)) bids = payload.data;
      else if (Array.isArray(payload?.items)) bids = payload.items;

      const rawPagination =
        response.data?.pagination ?? payload?.pagination ?? null;
      const pagination: BidsByStatusPagination = {
        page: rawPagination?.page ?? page,
        limit: rawPagination?.limit ?? limit,
        total: rawPagination?.total ?? bids.length,
      };

      return { bids, pagination };
    } catch (error) {
      return handleApiError(error, `fetch ${status} bids`);
    }
  },

  // GET /api/buyers/biddings/won - Get won biddings
  getWonBids: async (): Promise<BidResponse[]> => {
    try {
      const response = await api.get("/api/buyers/biddings/won");
      const data = response.data.data;
      if (data && Array.isArray(data.bids)) {
        return data.bids;
      }
      return Array.isArray(data) ? data : [];
    } catch {
       return []; 
    }
  },

  // GET /api/buyers/biddings/won/checkout - Get won biddings for checkout
  getWonBidsCheckout: async (): Promise<WonBidsCheckoutResponse> => {
    try {
      const response = await api.get("/api/buyers/biddings/won/checkout");
      const data = response.data.data;
      const bids = data && Array.isArray(data.bids) ? data.bids : (Array.isArray(data) ? data : []);
      return {
        bids,
        productsSubtotal: data?.productsSubtotal ?? 0,
        localTransportTotal: data?.localTransportTotal ?? 0,
        totalAmount: data?.totalAmount ?? 0,
      };
    } catch (error) {
      return handleApiError(error, "fetch won bids checkout");
    }
  },
};
