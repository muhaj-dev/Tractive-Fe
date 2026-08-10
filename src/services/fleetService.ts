import api from "@/lib/axios";

export interface FleetRoute {
  fromState: string;
  toState: string;
}

export interface FleetPayload {
  fleetName: string;
  fleetNumber: string;
  iot: string;
  model: string;
  /**
   * Tonnage, e.g. "20 tons". The backend reads `capacity` and derives
   * `capacityKg` from it; sending it is required for flat-rate whole-truck
   * fleets. Previously declared as `size`, which forced `as any` casts at the
   * call sites — verified 19 Jul 2026 that `capacity` is the stored field.
   */
  capacity: string;
  price: number;
  priceNegotiation: boolean;
  images: string[];
  fleetDescription: string;
  fleetStates: string;
  route: FleetRoute;
}

export interface FleetResponse extends FleetPayload {
  _id: string;
  userId: string;
  status: string; // Assuming there's a status field
  createdAt: string;
  updatedAt: string;
  /** Derived by the backend from `capacity`, e.g. "20 tons" -> 20000. */
  capacityKg?: number;
  plateNumber?: string;
}

export interface GetFleetsParams {
  search?: string;
  status?: string;
  year?: number;
  month?: number;
}

export type FleetBookingStatus =
  | "pending_payment"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export interface GetFleetBookingsParams {
  status?: FleetBookingStatus;
}

export type FleetPaymentStatus = "pending" | "approved" | "rejected";

export interface GetAdminFleetPaymentsParams {
  status?: FleetPaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FleetPaymentShipmentItem {
  orderId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  loadWeightKg?: number;
  _id?: string;
}

export interface FleetPaymentParty {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface AdminFleetPaymentRecord {
  _id?: string;
  id?: string;
  status?: FleetPaymentStatus | string;
  amount?: number;
  paymentMethod?: string;
  reason?: string;
  refundReason?: string | null;
  note?: string;
  loadWeightKg?: number;
  wholeTruckOnly?: boolean;
  shipmentItems?: FleetPaymentShipmentItem[];
  createdAt?: string;
  updatedAt?: string;
  buyer?: string | FleetPaymentParty;
  transporter?: string | FleetPaymentParty;
  payer?: string | FleetPaymentParty;
  approvedBy?: null | string | { _id?: string; name?: string; email?: string };
  fleetTripId?: string | null;
  fleetBid?: null | {
    _id?: string;
    amount?: number;
    counterAmount?: number;
    status?: string;
  };
  fleet?:
    | string
    | {
        _id?: string;
        fleetName?: string;
        fleetNumber?: string;
        plateNumber?: string;
        model?: string;
        price?: number;
        status?: string;
        image?: string;
        images?: string[];
        iot?: string;
        route?: { fromState?: string; toState?: string };
      };
  booking?:
    | string
    | {
        _id?: string;
        amount?: number;
        status?: string;
        buyer?: { _id?: string; name?: string };
        loadWeightKg?: number;
        wholeTruckOnly?: boolean;
        note?: string;
        fleetTripId?: string | null;
        shipmentItems?: FleetPaymentShipmentItem[];
      };
  bookingIds?: string[];
  [key: string]: unknown;
}

export interface GetAdminFleetPaymentsResponse {
  data: AdminFleetPaymentRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fleetService = {
  // POST /api/transporters/fleets - Add a new fleet
  createFleet: async (data: FleetPayload) => {
    try {
      const response = await api.post("/api/transporters/fleets", data);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw new Error((error as {response: {data: {message: string}}}).response?.data?.message || "Failed to create fleet");
      }
      throw new Error("Failed to create fleet");
    }
  },

  // GET /api/transporters/fleets - Get all fleets for the transporter
  getFleets: async (params?: GetFleetsParams): Promise<FleetResponse[]> => {
    try {
      const response = await api.get("/api/transporters/fleets", { params });
      const responseData = response.data;
      if (responseData && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (Array.isArray(responseData)) {
        return responseData;
      }
      return [];
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw new Error((error as {response: {data: {message: string}}}).response?.data?.message || "Failed to fetch fleets");
      }
      throw new Error("Failed to fetch fleets");
    }
  },

  // PATCH /api/transporters/fleet/{id} - Update a fleet
  updateFleet: async (id: string, data: Partial<FleetPayload>) => {
    try {
      const response = await api.patch(`/api/transporters/fleet/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw new Error((error as {response: {data: {message: string}}}).response?.data?.message || "Failed to update fleet");
      }
      throw new Error("Failed to update fleet");
    }
  },

  // DELETE /api/transporters/fleet/{id} - Delete a fleet
  deleteFleet: async (id: string) => {
    try {
      const response = await api.delete(`/api/transporters/fleet/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw new Error((error as {response: {data: {message: string}}}).response?.data?.message || "Failed to delete fleet");
      }
      throw new Error("Failed to delete fleet");
    }
  },

  // PATCH /api/transporters/fleet/{id}/status - Update fleet status
  updateFleetStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/api/transporters/fleet/${id}/status`, { status });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw new Error((error as {response: {data: {message: string}}}).response?.data?.message || "Failed to update fleet status");
      }
      throw new Error("Failed to update fleet status");
    }
  },

  // GET /api/transporters/fleet/{id}/bookings - List bookings for a single fleet
  getFleetBookings: async (
    fleetId: string,
    params?: GetFleetBookingsParams
  ): Promise<unknown> => {
    try {
      const response = await api.get(
        `/api/transporters/fleet/${fleetId}/bookings`,
        { params }
      );
      return response.data.data ?? response.data ?? [];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to fetch fleet bookings"
        );
      }
      throw new Error("Failed to fetch fleet bookings");
    }
  },

  // GET /api/fleet-bookings - Flat list across all fleets for the caller's role
  getAllFleetBookings: async (
    params?: GetFleetBookingsParams
  ): Promise<unknown> => {
    try {
      const response = await api.get(`/api/fleet-bookings`, { params });
      return response.data.data ?? response.data ?? [];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to fetch fleet bookings"
        );
      }
      throw new Error("Failed to fetch fleet bookings");
    }
  },

  // GET /api/transporters/fleet/{id}/payments - List payments for a single fleet
  getFleetPayments: async (fleetId: string): Promise<unknown> => {
    try {
      const response = await api.get(
        `/api/transporters/fleet/${fleetId}/payments`
      );
      return response.data.data ?? response.data ?? [];
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to fetch fleet payments"
        );
      }
      throw new Error("Failed to fetch fleet payments");
    }
  },

  /**
   * Every fleet payment belonging to the signed-in transporter.
   *
   * There is no aggregate transporter-scoped endpoint — `/api/admin/fleet-payments`
   * is admin-only (403) and `/api/transporters/transactions` returns product-order
   * transactions, not fleet payments. But `/api/transporters/fleet/{id}/payments`
   * IS transporter-scoped, so we list the transporter's own fleets and fan out
   * over them.
   *
   * A fleet that 403s (one that is not really theirs) is skipped rather than
   * failing the whole list. The payment carries `fleet` as a bare id, so the
   * fleet record is folded in for the name/image/IOT the table renders.
   */
  getMyFleetPayments: async (): Promise<AdminFleetPaymentRecord[]> => {
    const fleets = await fleetService.getFleets();
    const perFleet = await Promise.all(
      fleets.map(async (fleet) => {
        try {
          const raw = await fleetService.getFleetPayments(fleet._id);
          const list: AdminFleetPaymentRecord[] = Array.isArray(raw)
            ? (raw as AdminFleetPaymentRecord[])
            : [];
          return list.map((payment) => ({
            ...payment,
            fleet: {
              _id: fleet._id,
              fleetName: fleet.fleetName,
              fleetNumber: fleet.fleetNumber,
              plateNumber: fleet.plateNumber,
              model: fleet.model,
              images: fleet.images,
              iot: fleet.iot,
            },
          }));
        } catch {
          return [] as AdminFleetPaymentRecord[];
        }
      }),
    );
    return perFleet.flat();
  },

  // GET /api/admin/fleet-payments - Admin list of all fleet payments with filters.
  getAdminFleetPayments: async (
    params?: GetAdminFleetPaymentsParams
  ): Promise<GetAdminFleetPaymentsResponse> => {
    try {
      const response = await api.get(`/api/admin/fleet-payments`, { params });
      const body = response.data;
      const payload = body?.data ?? body;
      const list: AdminFleetPaymentRecord[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.fleetPayments)
          ? payload.fleetPayments
          : Array.isArray(payload?.payments)
            ? payload.payments
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
      const pagination = body?.pagination ?? payload?.pagination;
      return { data: list, pagination };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to fetch fleet payments"
        );
      }
      throw new Error("Failed to fetch fleet payments");
    }
  },

  // GET /api/admin/fleet-payments/{id} - Admin: full detail for a single fleet payment
  getAdminFleetPaymentById: async (
    id: string
  ): Promise<AdminFleetPaymentRecord> => {
    try {
      const response = await api.get(`/api/admin/fleet-payments/${id}`);
      const body = response.data;
      const payload = body?.data ?? body;
      return (payload?.fleetPayment ??
        payload?.payment ??
        payload) as AdminFleetPaymentRecord;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to load fleet payment"
        );
      }
      throw new Error("Failed to load fleet payment");
    }
  },

  // PATCH /api/admin/fleet-payments/{id}/status - Admin approve/reject alias.
  // Preferred admin route. Body: { status: "approved" | "rejected" }.
  adminUpdateFleetPaymentStatus: async (
    id: string,
    payload: { status: "approved" | "rejected"; reason?: string }
  ): Promise<unknown> => {
    try {
      const response = await api.patch(
        `/api/admin/fleet-payments/${id}/status`,
        payload
      );
      return response.data.data ?? response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to update fleet payment status"
        );
      }
      throw new Error("Failed to update fleet payment status");
    }
  },

  // POST /api/admin/fleet-payments/refund - Admin refunds a fleet payment.
  // Body: { fleetPaymentId, reason, refundAmount }.
  adminRefundFleetPayment: async (payload: {
    fleetPaymentId: string;
    reason: string;
    refundAmount: number;
  }): Promise<unknown> => {
    try {
      const response = await api.post(
        `/api/admin/fleet-payments/refund`,
        payload
      );
      return response.data.data ?? response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        throw new Error(
          (error as { response: { data: { message: string } } }).response?.data
            ?.message || "Failed to refund fleet payment"
        );
      }
      throw new Error("Failed to refund fleet payment");
    }
  },
};
