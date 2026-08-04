import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { transporterService, GetTransportersParams, ApiTruck } from "@/services/transporterService";
import {
  NegotiationService,
  CreateFleetBidPayload,
  NegotiationRespondPayload,
  TransporterBidRespondPayload,
  CreateFleetPaymentPayload,
  CreateDirectFleetPaymentPayload,
} from "@/services/negotiationService";
import {
  fleetService,
  GetFleetBookingsParams,
  GetAdminFleetPaymentsParams,
} from "@/services/fleetService";
import {
  fleetTripService,
  GetFleetTripsParams,
  CreateFleetTripPayload,
  UpdateFleetTripStatusPayload,
} from "@/services/fleetTripService";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";

export const transporterKeys = {
  all: ["transporters"] as const,
  list: (params?: GetTransportersParams) => [...transporterKeys.all, "list", params] as const,
  detail: (id: string) => [...transporterKeys.all, "detail", id] as const,
  fleet: (id: string) => [...transporterKeys.all, "fleet", id] as const,
  reviews: (id: string) => [...transporterKeys.all, "reviews", id] as const,
  truck: (id: string) => [...transporterKeys.all, "truck", id] as const,
  trucks: (params: Record<string, unknown> | undefined) => [...transporterKeys.all, "trucks", params] as const,
  fleetBids: () => [...transporterKeys.all, "fleet-bids"] as const,
  fleetBidsForFleet: (fleetId: string) =>
    [...transporterKeys.all, "fleet-bids", "fleet", fleetId] as const,
  fleetBookings: (fleetId: string, params?: GetFleetBookingsParams) =>
    [...transporterKeys.all, "fleet-bookings", fleetId, params] as const,
  allFleetBookings: (params?: GetFleetBookingsParams) =>
    [...transporterKeys.all, "fleet-bookings", "all", params] as const,
  fleetPayments: (fleetId: string) =>
    [...transporterKeys.all, "fleet-payments", fleetId] as const,
  adminFleetPayments: (params?: GetAdminFleetPaymentsParams) =>
    [...transporterKeys.all, "admin-fleet-payments", params] as const,
  adminFleetPayment: (id: string) =>
    [...transporterKeys.all, "admin-fleet-payment", id] as const,
  fleetTrips: (params?: GetFleetTripsParams) =>
    [...transporterKeys.all, "fleet-trips", params] as const,
  fleetTripsPaged: (params?: GetFleetTripsParams) =>
    [...transporterKeys.all, "fleet-trips", "paged", params] as const,
  fleetTrip: (tripId: string) =>
    [...transporterKeys.all, "fleet-trip", tripId] as const,
  fleetTripTracking: (tripId: string) =>
    [...transporterKeys.all, "fleet-trip", tripId, "tracking"] as const,
};

export const useGetTransporters = (params?: GetTransportersParams) => {
  return useQuery({
    queryKey: transporterKeys.list(params),
    queryFn: () => transporterService.getTransporters(params),
  });
};

export const useGetTransporter = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: transporterKeys.detail(id),
    queryFn: () => transporterService.getTransporterById(id),
    enabled: !!id && (options?.enabled !== false),
  });
};

export const useGetFleetById = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: transporterKeys.fleet(id),
    queryFn: () => transporterService.getFleetById(id),
    enabled: !!id && (options?.enabled !== false),
  });
};

/** Fleets similar to the one on screen — powers the "Similar Fleet" strip. */
export const useSimilarFleets = (
  id: string | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery<ApiTruck[]>({
    queryKey: [...transporterKeys.fleet(id || ""), "similar"],
    queryFn: () => transporterService.getSimilarFleets(id!),
    enabled: !!id && options?.enabled !== false,
  });
};

export const useGetTruckById = (id: string | null, options?: { enabled?: boolean }) => {
  return useQuery<ApiTruck>({
    queryKey: transporterKeys.truck(id || ""),
    queryFn: () => transporterService.getTruckById(id!),
    enabled: !!id && (options?.enabled !== false),
  });
};

export const useGetTransporterReviews = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: transporterKeys.reviews(id),
    queryFn: () => transporterService.getTransporterReviews(id),
    enabled: !!id && (options?.enabled !== false),
  });
};

export const useGetTransporterTrucks = (params?: {
  status?: string;
  fromState?: string;
  toState?: string;
}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: transporterKeys.trucks(params),
    queryFn: () => transporterService.getTransporterTrucks(params),
    enabled: options?.enabled !== false,
  });
};

export const useCreateFleetBid = () => {
  return useMutation({
    mutationFn: ({ fleetId, payload }: { fleetId: string; payload: CreateFleetBidPayload }) =>
      NegotiationService.createFleetBid(fleetId, payload),
    onSuccess: () => {
      toast.success("Bid sent successfully!", { duration: 4000, position: "top-center" });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to send bid. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

// --- Fleet Bids Hooks ---

export const useBuyerFleetBids = () => {
  return useQuery({
    queryKey: transporterKeys.fleetBids(),
    queryFn: () => NegotiationService.getBuyerFleetBids(),
    staleTime: 3 * 60 * 1000,
  });
};

export const useRespondToFleetBid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fleetId,
      bidId,
      payload,
    }: {
      fleetId: string;
      bidId: string;
      payload: NegotiationRespondPayload;
    }) => NegotiationService.respondToFleetBid(fleetId, bidId, payload),
    onSuccess: () => {
      toast.success("Response sent successfully!", { duration: 4000, position: "top-center" });
      queryClient.invalidateQueries({ queryKey: transporterKeys.fleetBids() });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to respond. Please try again."),
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

export const useCreateFleetPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFleetPaymentPayload) =>
      NegotiationService.createFleetPayment(payload),
    onSuccess: () => {
      toast.success("Payment submitted successfully!", { duration: 4000, position: "top-center" });
      queryClient.invalidateQueries({ queryKey: transporterKeys.fleetBids() });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Payment failed. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

// --- Transporter-side fleet bid hooks ---

export const useFleetBidsForTransporter = (
  fleetId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetBidsForFleet(fleetId),
    queryFn: () => NegotiationService.getFleetBidsForTransporter(fleetId),
    enabled: !!fleetId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  });
};

export const useRespondToFleetBidAsTransporter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fleetId,
      bidId,
      payload,
    }: {
      fleetId: string;
      bidId: string;
      payload: TransporterBidRespondPayload;
    }) =>
      NegotiationService.respondToFleetBidAsTransporter(fleetId, bidId, payload),
    onSuccess: (_data, variables) => {
      toast.success("Response sent successfully!", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({
        queryKey: transporterKeys.fleetBidsForFleet(variables.fleetId),
      });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to respond. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

// --- Fleet bookings & payments hooks ---

export const useFleetBookings = (
  fleetId: string,
  params?: GetFleetBookingsParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetBookings(fleetId, params),
    queryFn: () => fleetService.getFleetBookings(fleetId, params),
    enabled: !!fleetId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAllFleetBookings = (
  params?: GetFleetBookingsParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.allFleetBookings(params),
    queryFn: () => fleetService.getAllFleetBookings(params),
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  });
};

export const useFleetPayments = (
  fleetId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetPayments(fleetId),
    queryFn: () => fleetService.getFleetPayments(fleetId),
    enabled: !!fleetId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  });
};

// --- Fleet trips hooks ---

export const useFleetTrips = (
  params?: GetFleetTripsParams,
  options?: { enabled?: boolean; refetchInterval?: number },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetTrips(params),
    queryFn: () => fleetTripService.getFleetTrips(params),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 1000 * 60 * 2,
    // Hold the current list while a new search/status query loads, so typing in
    // the search box doesn't flash a full-screen spinner on every keystroke.
    placeholderData: keepPreviousData,
  });
};

/**
 * Same list as `useFleetTrips`, but keeps the `pagination` envelope so the
 * caller can drive server-side paging and show real totals.
 */
export const useFleetTripsPaged = (
  params?: GetFleetTripsParams,
  options?: { enabled?: boolean; refetchInterval?: number },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetTripsPaged(params),
    queryFn: () => fleetTripService.getFleetTripsPaged(params),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 1000 * 60 * 2,
    // Hold the current page while a new search/status/page query loads, so
    // typing in the search box doesn't flash a full-screen spinner.
    placeholderData: keepPreviousData,
  });
};

export const useFleetTrip = (
  tripId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetTrip(tripId),
    queryFn: () => fleetTripService.getFleetTrip(tripId),
    enabled: !!tripId && options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
  });
};

export const useFleetTripTracking = (
  tripId: string,
  options?: { enabled?: boolean; refetchInterval?: number },
) => {
  return useQuery({
    queryKey: transporterKeys.fleetTripTracking(tripId),
    queryFn: () => fleetTripService.getFleetTripTracking(tripId),
    enabled: !!tripId && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 1000 * 30,
  });
};

export const useCreateFleetTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFleetTripPayload) =>
      fleetTripService.createFleetTrip(payload),
    onSuccess: () => {
      toast.success("Trip created successfully!", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "fleet-trips"],
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "fleet-bookings"],
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to create trip. Please try again."),
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

export const useUpdateFleetTripStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      payload,
    }: {
      tripId: string;
      payload: UpdateFleetTripStatusPayload;
    }) => fleetTripService.updateFleetTripStatus(tripId, payload),
    onSuccess: (_data, variables) => {
      toast.success("Trip status updated!", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({
        queryKey: transporterKeys.fleetTrip(variables.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: transporterKeys.fleetTripTracking(variables.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "fleet-trips"],
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update trip status."),
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

// --- Admin fleet-payment review ---

export const useAdminFleetPayments = (
  params?: GetAdminFleetPaymentsParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.adminFleetPayments(params),
    queryFn: () => fleetService.getAdminFleetPayments(params),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminFleetPaymentById = (
  id: string | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: transporterKeys.adminFleetPayment(id || ""),
    queryFn: () => fleetService.getAdminFleetPaymentById(id as string),
    enabled: !!id && options?.enabled !== false,
    staleTime: 1000 * 60,
  });
};

export const useAdminUpdateFleetPaymentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { status: "approved" | "rejected"; reason?: string };
    }) => fleetService.adminUpdateFleetPaymentStatus(id, payload),
    onSuccess: () => {
      toast.success("Fleet payment updated!", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "fleet-payments"],
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "admin-fleet-payments"],
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "admin-fleet-payment"],
      });
      queryClient.invalidateQueries({
        queryKey: [...transporterKeys.all, "fleet-trips"],
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update fleet payment."),
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

export const useCreateDirectFleetPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fleetId,
      payload,
    }: {
      fleetId: string;
      payload: CreateDirectFleetPaymentPayload;
    }) => NegotiationService.createDirectFleetPayment(fleetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: transporterKeys.fleetBids() });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Payment failed. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};
