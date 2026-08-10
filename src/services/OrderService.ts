// services/ordersApi.ts

import api from "@/lib/axios";
import axios from "axios";
import { toast } from "sonner";

export interface Order {
  id: string;
  name: string;
  description: string;
  image: string;
  amount: number;
  buyer: string;
  location: string;
  date: string;
  status: "pending" | "parked" | "delivered";
  checked?: boolean;
}

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "delivered";

export type OrderTransportStatus =
  | "pending"
  | "picked"
  | "on_transit"
  | "delivered";

export interface OrdersQueryParams {
  search?: string;
  status?: OrderStatus | "parked";
  transportStatus?: OrderTransportStatus;
  year?: string;
  month?: string;
  buyer?: string;
  location?: string;
  readyForTransport?: boolean;
  paidForTransport?: boolean;
}

export interface OrderProductLine {
  _id?: string;
  product?:
    | string
    | {
        _id?: string;
        name?: string;
        description?: string;
        images?: string[];
        unit?: string;
        price?: number;
        owner?: { _id?: string; name?: string; businessName?: string | null };
      };
  quantity?: number;
  unitPrice?: number;
  lineSubtotal?: number;
  localTransportRequired?: boolean;
  localTransportFee?: number;
  localTransportFrom?: string;
  localTransportTo?: string;
  localTransportNote?: string;
}

export interface OrderTransporterInfo {
  _id?: string;
  name?: string | null;
  logo?: string | null;
  avatar?: string | null;
  image?: string | null;
  company?: string | null;
  businessName?: string | null;
  location?: string | null;
  rating?: number | null;
  ratingLabel?: string | null;
  followers?: number | null;
  yearsOfService?: number | null;
  phone?: string | null;
}

export interface OrderFleetInfo {
  _id?: string;
  fleetName?: string | null;
  plateNumber?: string | null;
  iotId?: string | null;
  model?: string | null;
  image?: string | null;
  route?: string | null;
}

export interface OrderStatusHistoryEntry {
  status?: string;
  timestamp?: string;
  note?: string;
  location?: string;
}

export interface OrderRecord {
  _id?: string;
  id?: string;
  buyer?: string | { _id?: string; name?: string };
  products?: OrderProductLine[];
  bidIds?: string[];
  fleetTripId?: string | null;
  totalAmount?: number;
  status?: string;
  transportStatus?: string;
  readyForTransport?: boolean;
  paidForTransport?: boolean;
  address?: string;
  phone?: string;
  paymentMethod?: string;
  transporter?: string | OrderTransporterInfo | null;
  fleet?: OrderFleetInfo | null;
  trackingCode?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  currentLocation?: { lat?: number | null; lng?: number | null; label?: string } | null;
  currentLocationLabel?: string | null;
  statusHistory?: OrderStatusHistoryEntry[];
  // Transport timeline timestamps (null until each stage is reached).
  pickedAt?: string | null;
  onTransitAt?: string | null;
  deliveredAt?: string | null;
  lastUpdatedAt?: string | null;
  estDeliveryDate?: string | null;
  // Receipt confirmation (Item 4): flag + timestamp set once the buyer confirms.
  receiptConfirmed?: boolean;
  receiptConfirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  products: { product: string; quantity: number }[];
  totalAmount: number;
  address: string;
  phone: string;
  notes?: string;
  bidIds: string[];
}

export type TransportStatus =
  | "pending"
  | "ready"
  | "picked"
  | "on_transit"
  | "delivered"
  | "cancelled";

export interface UpdateTransportStatusPayload {
  transportStatus: TransportStatus;
  note?: string;
  location?: string;
}

export interface CreateOrderResponse {
  success?: boolean;
  order: {
    _id: string;
    buyer: string;
    products: {
      product: string;
      quantity: number;
      unitPrice: number;
      lineSubtotal: number;
      localTransportRequired: boolean;
      localTransportFee: number;
      localTransportFrom: string;
      localTransportTo: string;
      localTransportNote: string;
      _id: string;
    }[];
    bidIds: string[];
    totalAmount: number;
    status: string;
    transportStatus: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}

export interface OrderTrackingInfo {
  currentLocation: { lat: number; lng: number } | null;
  /** Human-readable place name, e.g. currentLocation.label. */
  locationLabel: string | null;
  lastUpdatedAt: string | null;
  /** Untouched response body, kept until the backend shape is confirmed. */
  raw: unknown;
}

const toFiniteNumber = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

/**
 * Normalize GET /api/orders/{orderId}/tracking into OrderTrackingInfo.
 * The backend shape is not confirmed yet, so this tolerates the common
 * variants: { currentLocation: { lat, lng } }, { location }, { position },
 * flat { lat, lng }, { latitude, longitude }, and GeoJSON
 * { coordinates: [lng, lat] }.
 */
export const normalizeOrderTracking = (body: unknown): OrderTrackingInfo => {
  const root =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const candidate = [data.currentLocation, data.location, data.position, data]
    .find((c) => c && typeof c === "object") as
    | Record<string, unknown>
    | undefined;

  let lat: number | null = null;
  let lng: number | null = null;

  if (candidate) {
    lat = toFiniteNumber(candidate.lat) ?? toFiniteNumber(candidate.latitude);
    lng =
      toFiniteNumber(candidate.lng) ??
      toFiniteNumber(candidate.lon) ??
      toFiniteNumber(candidate.longitude);

    if ((lat === null || lng === null) && Array.isArray(candidate.coordinates)) {
      // GeoJSON order is [lng, lat]
      lng = toFiniteNumber(candidate.coordinates[0]);
      lat = toFiniteNumber(candidate.coordinates[1]);
    }
  }

  const lastUpdatedAt =
    typeof data.lastUpdatedAt === "string"
      ? data.lastUpdatedAt
      : typeof data.updatedAt === "string"
        ? data.updatedAt
        : typeof data.timestamp === "string"
          ? data.timestamp
          : null;

  const locationLabel =
    (candidate && typeof candidate.label === "string" && candidate.label) ||
    (typeof data.currentLocationLabel === "string" &&
      data.currentLocationLabel) ||
    null;

  return {
    currentLocation: lat !== null && lng !== null ? { lat, lng } : null,
    locationLabel,
    lastUpdatedAt,
    raw: body,
  };
};

const formatOrderDate = (raw?: string): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().split("T")[0];
};

/**
 * The agent UI labels the packed / ready-for-transport tab "parked", but the
 * backend order `status` enum calls that state "paid". Translate the FE label
 * to the API value when sending it, and back when reading it, so the UI keeps
 * its own vocabulary without the backend ever seeing an unknown status.
 */
const FE_TO_API_STATUS: Record<string, string> = { parked: "paid" };

export const toApiOrderStatus = (status?: string): string | undefined =>
  status ? FE_TO_API_STATUS[status] ?? status : undefined;

const normalizeOrderStatus = (
  status?: string,
): "pending" | "parked" | "delivered" => {
  if (status === "delivered") return "delivered";
  // Backend "paid" == UI "parked".
  if (status === "parked" || status === "paid") return "parked";
  return "pending";
};

/**
 * An order counts as delivered once the trip carrying it reports `delivered`.
 * The backend records that on `transportStatus` and leaves the order's own
 * `status` on `paid`, so filtering on `status` alone never matches a delivery
 * made by a transporter. An agent can also mark an order delivered by hand,
 * which does write `status`, so accept either signal.
 */
export const isOrderDelivered = (record: OrderRecord): boolean =>
  (record.transportStatus ?? "").toLowerCase() === "delivered" ||
  (record.status ?? "").toLowerCase() === "delivered";

/**
 * An order the buyer has created but not yet paid for.
 *
 * `pending` is a fresh order; `payment_pending` is one where a transfer has been
 * declared and is waiting on admin approval. Both are unreachable from the
 * transport tabs (those need `paid`), so they get their own list.
 */
export const isOrderUnpaid = (record: OrderRecord): boolean => {
  const s = (record.status ?? "").toLowerCase();
  return s === "pending" || s === "payment_pending";
};

/** True once a transfer has been declared and is awaiting admin approval. */
export const isOrderAwaitingApproval = (record: OrderRecord): boolean =>
  (record.status ?? "").toLowerCase() === "payment_pending";

export const mapOrderRecord = (record: OrderRecord): Order => {
  const firstLine = record.products?.[0];
  const productRef = firstLine?.product;
  const product =
    productRef && typeof productRef === "object" ? productRef : undefined;

  const buyer = record.buyer;
  // The list endpoint returns `buyer` as an unpopulated ObjectId string; don't
  // render a raw 24-hex id as a name — fall back to "—" until it's populated.
  const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s);
  const buyerName =
    typeof buyer === "string"
      ? isObjectId(buyer)
        ? ""
        : buyer
      : buyer?.name ?? "";

  return {
    id: record._id ?? record.id ?? "",
    name: product?.name ?? "—",
    description: product?.description ?? "",
    image: product?.images?.[0] ?? "/images/noData.png",
    amount: typeof record.totalAmount === "number" ? record.totalAmount : 0,
    buyer: buyerName || "—",
    location: record.address || "—",
    date: formatOrderDate(record.createdAt),
    status: isOrderDelivered(record)
      ? "delivered"
      : normalizeOrderStatus(record.status),
  };
};

// API_URL and Headers managed by axios

export class OrdersApiService {
  /**
   * Create a new order from selected won bids
   */
  static async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    try {
      const response = await api.post("/api/orders", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  /**
   * Fetch orders with optional filters.
   * Unwraps `{ success, data, pagination }` envelope and returns the array.
   */
  static async getOrders(params?: OrdersQueryParams): Promise<OrderRecord[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append("search", params.search);
      if (params?.status)
        queryParams.append("status", toApiOrderStatus(params.status)!);
      if (params?.transportStatus)
        queryParams.append("transportStatus", params.transportStatus);
      if (params?.year) queryParams.append("year", params.year);
      if (params?.month) queryParams.append("month", params.month);
      if (params?.buyer) queryParams.append("buyer", params.buyer);
      if (params?.location) queryParams.append("location", params.location);
      if (params?.readyForTransport) queryParams.append("readyForTransport", "true");
      if (params?.paidForTransport) queryParams.append("paidForTransport", "true");

      const url = `/api/orders${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await api.get(url);
      const body = response.data;
      if (Array.isArray(body)) return body as OrderRecord[];
      if (body && Array.isArray(body.data)) return body.data as OrderRecord[];
      return [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (
        error instanceof Error &&
        !error.message.includes("Unauthorized") &&
        !error.message.includes("Forbidden")
      ) {
        toast.error("Failed to load orders. Please try again.");
      }
      throw error;
    }
  }

  /**
   * Get single order details.
   * Returns the full populated `OrderRecord` (transporter/fleet/products/
   * timeline), unwrapping the `{ success, data }` envelope when present.
   */
  static async getOrderById(id: string): Promise<OrderRecord> {
    try {
      const response = await api.get(`/api/orders/${id}`);
      const body = response.data;
      if (body && typeof body === "object" && !Array.isArray(body) && body.data) {
        return body.data as OrderRecord;
      }
      return body as OrderRecord;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      if (
        error instanceof Error &&
        !error.message.includes("Unauthorized") &&
        !error.message.includes("Forbidden") &&
        !error.message.includes("not found")
      ) {
        toast.error("Failed to load order details. Please try again.");
      }
      throw error;
    }
  }

  /**
   * Buyer-facing live tracking (GPS position) for an order.
   * GET /api/orders/{orderId}/tracking
   */
  static async getOrderTracking(orderId: string): Promise<OrderTrackingInfo> {
    try {
      const response = await api.get(`/api/orders/${orderId}/tracking`);
      return normalizeOrderTracking(response.data);
    } catch (error) {
      console.error(`Error fetching tracking for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Buyer confirms they received a delivered order.
   * POST /api/orders/{orderId}/confirm-receipt
   */
  static async confirmOrderReceipt(orderId: string): Promise<unknown> {
    try {
      const response = await api.post(`/api/orders/${orderId}/confirm-receipt`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error confirming receipt for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get buyer details for an order assigned to the transporter.
   * GET /api/transporters/orders/{orderId}/buyer
   */
  static async getTransporterOrderBuyer(orderId: string): Promise<unknown> {
    try {
      const response = await api.get(
        `/api/transporters/orders/${orderId}/buyer`,
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `Error fetching buyer for transporter order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get product details for an order assigned to the transporter.
   * GET /api/transporters/orders/{orderId}/product
   */
  static async getTransporterOrderProduct(orderId: string): Promise<unknown> {
    try {
      const response = await api.get(
        `/api/transporters/orders/${orderId}/product`,
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `Error fetching product for transporter order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update the delivery/transport status on an order the transporter is fulfilling.
   * PATCH /api/transporters/orders/{orderId}/status
   */
  static async updateTransportStatus(
    orderId: string,
    payload: UpdateTransportStatusPayload,
  ): Promise<unknown> {
    try {
      const response = await api.patch(
        `/api/transporters/orders/${orderId}/status`,
        payload,
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `Error updating transport status for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get tracking info (timeline + GPS) for an order assigned to the transporter.
   * GET /api/transporters/orders/{orderId}/tracking
   */
  static async getTransporterOrderTracking(
    orderId: string,
  ): Promise<unknown> {
    try {
      const response = await api.get(
        `/api/transporters/orders/${orderId}/tracking`,
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `Error fetching tracking for transporter order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    id: string,
    status: "parked" | "delivered",
  ): Promise<Order> {
    try {
      const response = await api.patch(`/api/orders/${id}/status`, {
        status: toApiOrderStatus(status),
        id,
      });

      const statusText = status === "parked" ? "parked" : "delivered";
      toast.success(`Order marked as ${statusText} successfully!`);

      return response.data;
    } catch (error) {
      // Axios puts the server's explanation on `error.response.data`, while
      // `error.message` is only ever "Request failed with status code 4xx".
      // Reading `.message` alone (as this used to) discarded the one piece of
      // information that says WHY the transition was refused, and the
      // Unauthorized/Forbidden/not-found checks below never matched anything
      // because that string never contains those words.
      const serverMessage = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string; error?: string })
            ?.message ??
          (error.response?.data as { message?: string; error?: string })
            ?.error ??
          undefined
        : undefined;

      console.error(
        `Error updating order ${id} status → "${toApiOrderStatus(status)}":`,
        {
          status: error && axios.isAxiosError(error) ? error.response?.status : undefined,
          serverMessage,
          responseBody: axios.isAxiosError(error) ? error.response?.data : undefined,
        },
      );

      toast.error(serverMessage || "Failed to update order status. Please try again.");
      throw error;
    }
  }
}
