// services/transactionService.ts
import api from "@/lib/axios";

// services/transactionService.ts
// services/transactionService.ts
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // Using axios instance instead

// Populated product/order shapes returned by the API (`/api/transactions`
// populates the order with its products, and the buyer document).
export interface TransactionProduct {
  _id?: string;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  unitWeightKg?: number | null;
  category?: string | null;
  subcategory?: string | null;
  images?: string[];
}

export interface TransactionOrderItem {
  product?: TransactionProduct;
  quantity?: number;
  unit?: string;
  unitPrice?: number | null;
  lineSubtotal?: number | null;
  _id?: string;
}

export interface PopulatedOrder {
  _id: string;
  status?: string;
  transportStatus?: string;
  totalAmount?: number;
  products?: TransactionOrderItem[];
  createdAt?: string;
}

export interface TransactionBuyer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

// Frontend Transaction Interface (includes UI-specific fields)
export interface FrontendTransaction {
  _id: string;
  id: string; // Required for BaseData compatibility
  order: PopulatedOrder;
  buyer: TransactionBuyer;
  amount: number;
  status: "pending" | "approved";
  paymentMethod: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;

  // Commission, as returned by the API.
  commissionAmount?: number;
  /** Fraction, not a percentage: 0.1 means 10%. */
  commissionRate?: number;

  // Frontend-only fields for UI (derived from the first order product)
  name?: string;
  description?: string;
  image?: string;
  sold?: number;
  /** Alias of `commissionAmount`, kept for the existing table columns. */
  commission?: number;
  date?: string;
  productCount?: number;
  checked?: boolean; // For checkbox compatibility
}

/** Used only when the API omits commission (older records). */
const FALLBACK_COMMISSION_RATE = 0.1;

/**
 * The API may express the rate as a fraction (0.1) or a percentage (10).
 * Normalise to a fraction so callers have one thing to reason about.
 */
const toRateFraction = (rate?: number): number | undefined => {
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0) {
    return undefined;
  }
  return rate > 1 ? rate / 100 : rate;
};

const resolveCommission = (
  transaction: Pick<RawTransaction, "amount" | "commissionRate" | "commissionAmount">,
): { rate: number; amount: number } => {
  const rate = toRateFraction(transaction.commissionRate) ?? FALLBACK_COMMISSION_RATE;
  const amount =
    typeof transaction.commissionAmount === "number" &&
    Number.isFinite(transaction.commissionAmount)
      ? transaction.commissionAmount
      : (transaction.amount ?? 0) * rate;
  return { rate, amount };
};

// Raw transaction element as it comes off the wire (order/buyer may be an id
// string or a populated object).
interface RawTransaction {
  _id: string;
  amount: number;
  status: "pending" | "approved";
  paymentMethod: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  order?: string | PopulatedOrder;
  buyer?: string | TransactionBuyer;
  commissionRate?: number;
  commissionAmount?: number;
}

// Backend Transaction Interface (what API expects)
export interface BackendTransaction {
  _id: string;
  order: string;
  buyer: string;
  amount: number;
  status: "pending" | "approved";
  paymentMethod: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTransactionsParams {
  status?: "pending" | "approved";
  search?: string;
  year?: string;
  month?: string;
}

export interface UpdateStatusData {
  status: "pending" | "approved";
}

export interface ContactCustomerCareData {
  message: string;
  priority: "low" | "medium" | "high";
}

// Create authenticated headers with role validation
// Auth headers are handled by axios interceptor

// Helper function to handle API responses
// Response handling is managed by axios interceptor/wrapper where applicable, but we keep basic error handling here if needed.
// const handleResponse = ... (removed as axios throws on error status by default or we handle it in catch)

export interface CreateTransactionPayload {
  order: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
}

export interface CreateTransactionResponse {
  transaction: {
    _id: string;
    [key: string]: unknown;
  };
  message?: string;
}

export type AdminTransactionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded";
export type AdminTransactionMethod = "cash" | "bank_transfer" | "card";

export interface AdminTransactionListParams {
  status?: AdminTransactionStatus;
  method?: AdminTransactionMethod;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export const transactionService = {
  async createTransaction(payload: CreateTransactionPayload): Promise<CreateTransactionResponse> {
    try {
      const response = await api.post("/api/transactions", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },

  // GET /api/admin/transactions?status=&method=&fromDate=&toDate=&page=&limit=
  async getAllTransactions(
    params: AdminTransactionListParams = {},
  ): Promise<TransactionListResponse> {
    try {
      const response = await api.get("/api/admin/transactions", {
        params: {
          ...(params.status ? { status: params.status } : {}),
          ...(params.method ? { method: params.method } : {}),
          ...(params.fromDate ? { fromDate: params.fromDate } : {}),
          ...(params.toDate ? { toDate: params.toDate } : {}),
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        },
      });
      const body = response.data;
      const payload = body?.data ?? body;
      const data = payload?.transactions ?? payload ?? [];
      return {
        data: Array.isArray(data) ? data : [],
        pagination: payload?.pagination ?? {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          total: Array.isArray(data) ? data.length : 0,
        },
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  },

  // GET /api/admin/transactions/{id}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTransactionById(id: string): Promise<any> {
    try {
      const response = await api.get(`/api/admin/transactions/${id}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  },

  async getTransactions(
    params?: GetTransactionsParams,
  ): Promise<FrontendTransaction[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.status) queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.year) queryParams.append("year", params.year);
      if (params?.month) queryParams.append("month", params.month);

      const url = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await api.get(url);

      // Be defensive about the response envelope — the API may return
      // `{ transactions: [...] }`, `{ data: { transactions: [...] } }`,
      // `{ data: [...] }`, or a bare array.
      const body = response.data;
      const payload = body?.data ?? body;
      const list = payload?.transactions ?? payload ?? [];
      const rawTransactions: RawTransaction[] = Array.isArray(list)
        ? list
        : [];

      // Transform backend data to frontend format with UI enhancements
      const transactions: FrontendTransaction[] = rawTransactions.map(
        (transaction) => {
          const { rate: commissionRate, amount: commissionAmount } =
            resolveCommission(transaction);

          // `order` may come back as an id string or a populated object —
          // keep the populated object so the details modal can read products.
          const order: PopulatedOrder =
            typeof transaction.order === "string"
              ? { _id: transaction.order }
              : transaction.order ?? { _id: "" };
          const orderId = order._id ?? "";

          // `buyer` likewise arrives populated (object) or as an id string.
          const buyer: TransactionBuyer =
            typeof transaction.buyer === "string"
              ? { _id: transaction.buyer, name: "", email: "" }
              : transaction.buyer ?? { _id: "", name: "", email: "" };

          // Derive the Item column from the first real product on the order.
          const firstProduct = order.products?.[0]?.product;
          const productName =
            firstProduct?.name || `Order #${orderId.slice(-8)}`;
          const productDescription = firstProduct?.description || "";
          const productImage =
            firstProduct?.images?.[0] || "/images/placeholder.png";

          return {
            _id: transaction._id,
            id: transaction._id, // Required for BaseData
            order,
            buyer,
            amount: transaction.amount,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            approvedBy: transaction.approvedBy,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            commissionAmount,
            commissionRate,
            // Frontend-only fields for UI
            name: productName,
            description: productDescription,
            image: productImage,
            sold: transaction.amount,
            commission: commissionAmount,
            date: new Date(transaction.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            productCount: order.products?.length ?? 0,
            checked: false, // Default unchecked for checkboxes
          };
        },
      );

      return transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  },

  async updateTransactionStatus(
    id: string,
    statusData: UpdateStatusData,
  ): Promise<FrontendTransaction> {
    try {
      const response = await api.patch(`/api/transactions/${id}/status`, {
        ...statusData,
        id,
      });

      const data = response.data;
      return data.transaction;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  },

  // PATCH /api/admin/transactions/{id}/status — admin alias for approve/reject
  async adminUpdateTransactionStatus(
    id: string,
    status: AdminTransactionStatus,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    try {
      const response = await api.patch(
        `/api/admin/transactions/${id}/status`,
        { status },
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error("Error updating admin transaction status:", error);
      throw error;
    }
  },

  // POST /api/admin/transactions/refund
  async refundTransaction(payload: {
    transactionId: string;
    reason: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    try {
      const response = await api.post(
        `/api/admin/transactions/refund`,
        payload,
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error("Error refunding transaction:", error);
      throw error;
    }
  },

  async contactCustomerCare(
    id: string,
    contactData: ContactCustomerCareData,
  ): Promise<void> {
    try {
      await api.post(
        `/api/transactions/${id}/contact-customer-care`,
        contactData,
      );
    } catch (error) {
      console.error("Error contacting customer care:", error);
      throw error;
    }
  },

  // Helper method to check if user is authenticated - Rely on session check in components
  isAuthenticated(): boolean {
    return true; // Simplify or remove, components should check session
  },

  // Helper method to get user info from token (if needed) - Rely on session
  getUserInfo(): { userId: string; email?: string } | null {
    return null; // Simplify or remove
  },
};
