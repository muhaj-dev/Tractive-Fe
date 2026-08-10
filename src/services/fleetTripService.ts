import api from "@/lib/axios";

export type FleetTripStatus =
  | "planned"
  | "pending" // legacy alias for older trips — normalised to "planned" in the UI
  | "picked"
  | "on_transit"
  | "delivered"
  | "cancelled";

export interface FleetTripBuyer {
  _id?: string;
  id?: string;
  name?: string;
  businessName?: string | null;
  email?: string;
  phone?: string;
  avatar?: string;
  image?: string | null;
  address?: string;
  state?: string;
}

export interface FleetTripPackage {
  _id?: string;
  id?: string;
  productId?: string;
  name?: string;
  image?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitWeightKg?: number;
  loadWeightKg?: number;
}

export interface FleetTripRoute {
  fromState?: string;
  toState?: string;
}

export interface FleetTripFleet {
  _id?: string;
  id?: string;
  fleetName?: string;
  fleetNumber?: string;
  plateNumber?: string;
  model?: string;
  iot?: string;
  image?: string;
  images?: string[];
  capacity?: string;
  capacityKg?: number;
  route?: FleetTripRoute;
}

export interface FleetTripTransporter {
  _id?: string;
  id?: string;
  name?: string;
  businessName?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  image?: string | null;
  avatar?: string;
  company?: string;
}

export interface FleetTripDriver {
  _id?: string;
  id?: string;
  name?: string;
  phone?: string;
  licenseNumber?: string;
  image?: string | null;
}

export interface FleetTripCoords {
  lat?: number;
  lng?: number;
  label?: string;
}

export interface FleetTripSummary {
  _id?: string;
  id?: string;
  /** `/tracking` exposes the trip id under `tripId` instead of `_id`. */
  tripId?: string;
  status?: FleetTripStatus;
  /**
   * The backend advances this in lockstep with `status` for `on_transit` and
   * `delivered`, but on a pick it writes `transportStatus: "picked"` and leaves
   * `status` on `"loaded"`. Treat it as the more reliable of the two.
   */
  transportStatus?: string;
  fleet?: FleetTripFleet | string;
  fleetId?: string;
  transporter?: FleetTripTransporter;
  driver?: FleetTripDriver | null;
  buyers?: FleetTripBuyer[];
  packages?: FleetTripPackage[];
  bookingIds?: unknown[];
  orderIds?: unknown[];
  paymentIds?: unknown[];
  trackingCode?: string;
  fromLocation?: string;
  toLocation?: string;
  origin?: string | null;
  destination?: string | null;
  currentLocation?: FleetTripCoords | string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  pickedAt?: string | null;
  onTransitAt?: string | null;
  deliveredAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  estDeliveryDate?: string;
  loadWeightKg?: number;
  loadWeightTonnes?: number;
  totalLoadKg?: number;
  capacityKg?: number;
  wholeTruckOnly?: boolean;
  packageCount?: number;
  buyerCount?: number;
  orderCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface FleetTripTimelineEvent {
  status: FleetTripStatus | string;
  /** Newer responses use `timestamp`; older ones use `at`. Read both. */
  at?: string;
  timestamp?: string;
  note?: string;
  location?: string;
}

/**
 * Detailed tracking payload from GET /fleet-trips/{id}/tracking.
 * It carries every summary field plus a status timeline; some backends
 * also nest the trip under `trip`, so consumers should merge defensively.
 */
export interface FleetTripTracking extends FleetTripSummary {
  trip?: FleetTripSummary;
  timeline?: FleetTripTimelineEvent[];
}

export interface GetFleetTripsParams {
  status?: FleetTripStatus;
  fleetId?: string;
  search?: string;
  /** Four-digit year, e.g. "2025". Filters on the trip's creation date. */
  year?: string;
  /** 1-12. Filters on the trip's creation date. */
  month?: number;
  page?: number;
  limit?: number;
}

export interface FleetTripPagination {
  page: number;
  limit: number;
  total: number;
}

export interface FleetTripListResponse {
  trips: FleetTripSummary[];
  pagination: FleetTripPagination;
}

export interface CreateFleetTripPayload {
  fleetId: string;
  bookingIds: string[];
}

/**
 * PATCH /fleet-trips/{id}/status — the tracking-update contract.
 * `status` is the only required field; everything else refines the tracking card.
 * `estDeliveryDate` must be an ISO-8601 string.
 */
export interface UpdateFleetTripStatusPayload {
  status: FleetTripStatus;
  note?: string;
  location?: string;
  origin?: string;
  destination?: string;
  lat?: number;
  lng?: number;
  estDeliveryDate?: string;
}

const unwrap = <T>(body: unknown): T => {
  if (body && typeof body === "object" && "data" in (body as Record<string, unknown>)) {
    return (body as { data: T }).data;
  }
  return body as T;
};

export const fleetTripService = {
  /**
   * GET /api/transporters/fleet-trips
   * Lists tracking trips for the transporter/admin tracking board.
   */
  getFleetTrips: async (
    params?: GetFleetTripsParams,
  ): Promise<FleetTripSummary[]> => {
    const { trips } = await fleetTripService.getFleetTripsPaged(params);
    return trips;
  },

  /**
   * GET /api/transporters/fleet-trips
   * Same endpoint as `getFleetTrips`, but keeps the `pagination` envelope so
   * callers can render page controls and real tab totals instead of counting
   * the rows on the current page.
   */
  getFleetTripsPaged: async (
    params: GetFleetTripsParams = {},
  ): Promise<FleetTripListResponse> => {
    try {
      const response = await api.get("/api/transporters/fleet-trips", {
        params: {
          ...(params.status ? { status: params.status } : {}),
          ...(params.fleetId ? { fleetId: params.fleetId } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.month ? { month: params.month } : {}),
          ...(params.year ? { year: params.year } : {}),
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        },
      });
      const payload = unwrap<unknown>(response.data);
      let trips: FleetTripSummary[] = [];
      if (Array.isArray(payload)) {
        trips = payload as FleetTripSummary[];
      } else if (payload && typeof payload === "object") {
        const maybe = payload as { trips?: FleetTripSummary[] };
        if (Array.isArray(maybe.trips)) trips = maybe.trips;
      }
      // The envelope may carry pagination alongside `data`, or nested inside it.
      const nested = (payload && typeof payload === "object"
        ? (payload as { pagination?: Partial<FleetTripPagination> }).pagination
        : undefined);
      const raw = response.data?.pagination ?? nested;
      return {
        trips,
        pagination: {
          page: raw?.page ?? params.page ?? 1,
          limit: raw?.limit ?? params.limit ?? 10,
          total: raw?.total ?? trips.length,
        },
      };
    } catch (error) {
      console.error("[FleetTripService] getFleetTrips error:", error);
      throw error;
    }
  },

  /**
   * POST /api/transporters/fleet-trips
   * Manually creates a tracking trip from selected confirmed bookingIds on a fleet.
   */
  createFleetTrip: async (
    payload: CreateFleetTripPayload,
  ): Promise<FleetTripSummary> => {
    try {
      const response = await api.post("/api/transporters/fleet-trips", payload);
      return unwrap<FleetTripSummary>(response.data);
    } catch (error) {
      console.error("[FleetTripService] createFleetTrip error:", error);
      throw error;
    }
  },

  /**
   * GET /api/transporters/fleet-trips/{tripId}
   */
  getFleetTrip: async (tripId: string): Promise<FleetTripSummary> => {
    try {
      const response = await api.get(`/api/transporters/fleet-trips/${tripId}`);
      return unwrap<FleetTripSummary>(response.data);
    } catch (error) {
      console.error(`[FleetTripService] getFleetTrip ${tripId} error:`, error);
      throw error;
    }
  },

  /**
   * GET /api/transporters/fleet-trips/{tripId}/tracking
   */
  getFleetTripTracking: async (tripId: string): Promise<FleetTripTracking> => {
    try {
      const response = await api.get(
        `/api/transporters/fleet-trips/${tripId}/tracking`,
      );
      return unwrap<FleetTripTracking>(response.data);
    } catch (error) {
      console.error(
        `[FleetTripService] getFleetTripTracking ${tripId} error:`,
        error,
      );
      throw error;
    }
  },

  /**
   * PATCH /api/transporters/fleet-trips/{tripId}/status
   */
  updateFleetTripStatus: async (
    tripId: string,
    payload: UpdateFleetTripStatusPayload,
  ): Promise<FleetTripSummary> => {
    try {
      const response = await api.patch(
        `/api/transporters/fleet-trips/${tripId}/status`,
        payload,
      );
      return unwrap<FleetTripSummary>(response.data);
    } catch (error) {
      console.error(
        `[FleetTripService] updateFleetTripStatus ${tripId} error:`,
        error,
      );
      throw error;
    }
  },
};
