import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  OrdersApiService,
  OrdersQueryParams,
  OrderRecord,
  CreateOrderPayload,
  UpdateTransportStatusPayload,
  isOrderUnpaid,
} from "@/services/OrderService";
import { toast } from "sonner";

// Query key factory
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params?: OrdersQueryParams) => [...orderKeys.lists(), params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  transporterBuyer: (orderId: string) =>
    [...orderKeys.all, "transporter", orderId, "buyer"] as const,
  transporterProduct: (orderId: string) =>
    [...orderKeys.all, "transporter", orderId, "product"] as const,
  transporterTracking: (orderId: string) =>
    [...orderKeys.all, "transporter", orderId, "tracking"] as const,
  tracking: (orderId: string) =>
    [...orderKeys.all, orderId, "tracking"] as const,
};

/**
 * Fetch orders — cached by status/filter params.
 * staleTime of 5 minutes avoids repeated network calls on every render.
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => OrdersApiService.createOrder(payload),
    // Creating an order consumes the won bids it was built from and produces a
    // new unpaid order. Without this, "Ready to checkout" kept counting bids
    // that had already become an order, and the Pending Payment tab did not
    // show the order the buyer had just created.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wonBidsCheckout"] });
      queryClient.invalidateQueries({ queryKey: ["wonBids"] });
      queryClient.invalidateQueries({ queryKey: ["myBids"] });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to create order. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

export const useOrders = (params?: OrdersQueryParams) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => OrdersApiService.getOrders(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    // When filter/status params change, keep showing the previous list
    // while the new one loads instead of flashing a loading state.
    placeholderData: keepPreviousData,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      if (error?.response?.status === 401 || error?.response?.status === 403)
        return false;
      return failureCount < 2;
    },
  });
};

/**
 * Single order detail — full populated `OrderRecord`.
 * Used by the agent Track Order page (keyed by order id).
 */
export const useOrderDetail = (
  orderId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => OrdersApiService.getOrderById(orderId),
    enabled: !!orderId && options?.enabled !== false,
    staleTime: 1000 * 60 * 3,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Orders created but not yet paid for.
 *
 * Fetched unfiltered and narrowed here on purpose: `?status=pending` misses
 * orders sitting in `payment_pending`, and `?status=payment_pending` returns an
 * empty list on the API today. Filtering client-side catches both.
 */
export const useUnpaidOrders = () => {
  return useQuery({
    queryKey: orderKeys.list({ unpaid: true } as OrdersQueryParams),
    queryFn: async () => (await OrdersApiService.getOrders()).filter(isOrderUnpaid),
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      if (error?.response?.status === 401 || error?.response?.status === 403)
        return false;
      return failureCount < 2;
    },
  });
};

export const useTransportReadyOrders = () => {
  return useQuery({
    queryKey: orderKeys.list({ readyForTransport: true }),
    queryFn: () => OrdersApiService.getOrders({ readyForTransport: true }),
    staleTime: 1000 * 60 * 3,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      if (error?.response?.status === 401 || error?.response?.status === 403)
        return false;
      return failureCount < 2;
    },
  });
};

/**
 * Orders where the buyer has paid for both the product AND the transport.
 * Placeholder filter `paidForTransport=true` — backend param name to be
 * confirmed; centralized here so swapping is a one-line change.
 */
// --- Transporter delivery flow ---

export const useTransporterOrderBuyer = (
  orderId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: orderKeys.transporterBuyer(orderId),
    queryFn: () => OrdersApiService.getTransporterOrderBuyer(orderId),
    enabled: !!orderId && options?.enabled !== false,
    staleTime: 1000 * 60 * 3,
  });
};

export const useTransporterOrderProduct = (
  orderId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: orderKeys.transporterProduct(orderId),
    queryFn: () => OrdersApiService.getTransporterOrderProduct(orderId),
    enabled: !!orderId && options?.enabled !== false,
    staleTime: 1000 * 60 * 3,
  });
};

export const useTransporterOrderTracking = (
  orderId: string,
  options?: { enabled?: boolean; refetchInterval?: number },
) => {
  return useQuery({
    queryKey: orderKeys.transporterTracking(orderId),
    queryFn: () => OrdersApiService.getTransporterOrderTracking(orderId),
    enabled: !!orderId && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 1000 * 30,
  });
};

/**
 * Buyer-facing live GPS tracking for an order.
 * GET /api/orders/{orderId}/tracking
 */
export const useOrderTracking = (
  orderId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) => {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: () => OrdersApiService.getOrderTracking(orderId),
    enabled: !!orderId && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 1000 * 30,
    // This query polls every 30s while a package is in motion, so react-query
    // retries are redundant: the next tick IS the retry. Retrying any HTTP
    // error here multiplied one broken order into 3 requests per tick — a 500
    // on this endpoint produced 9 identical console errors in ~1 minute.
    // Only retry when there is no HTTP status at all (a genuine network blip);
    // any answer from the server, including a 500, is left for the next poll.
    retry: (failureCount, error: { response?: { status?: number } }) => {
      if (error?.response?.status !== undefined) return false;
      return failureCount < 1;
    },
  });
};

/**
 * Buyer confirms receipt of a delivered order.
 * POST /api/orders/{orderId}/confirm-receipt
 */
export const useConfirmOrderReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      OrdersApiService.confirmOrderReceipt(orderId),
    onSuccess: (_data, orderId) => {
      toast.success("Receipt confirmed. Thanks for shopping with us!", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to confirm receipt. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

export const useUpdateTransportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateTransportStatusPayload;
    }) => OrdersApiService.updateTransportStatus(orderId, payload),
    onSuccess: (_data, variables) => {
      toast.success("Transport status updated!", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({
        queryKey: orderKeys.transporterTracking(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update status. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

/**
 * Orders that are actually in transit or delivered — the "Shipping & Delivered"
 * tab on `/buyer/my-orders`.
 *
 * The backend currently ignores `paidForTransport=true` and returns every order
 * for the buyer, so the tab would otherwise list the whole "Awaiting Transport"
 * set plus unpaid orders. We re-apply the filter client-side: an order has moved
 * into shipping once it is paid AND transport has been arranged — the backend
 * signals that with a `fleetTripId`/`transporter` and a `transportStatus` past
 * `pending`. Drop this `select` once the server honours the param.
 */
const hasShippingStarted = (order: OrderRecord): boolean => {
  if (order.status !== "paid") return false;
  if (order.fleetTripId) return true;
  if (order.transporter) return true;
  const ts = order.transportStatus;
  return !!ts && ts !== "pending";
};

export const usePaidShippingOrders = () => {
  return useQuery({
    queryKey: orderKeys.list({ paidForTransport: true }),
    queryFn: () => OrdersApiService.getOrders({ paidForTransport: true }),
    select: (orders: OrderRecord[]) => orders.filter(hasShippingStarted),
    staleTime: 1000 * 60 * 3,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      if (error?.response?.status === 401 || error?.response?.status === 403)
        return false;
      return failureCount < 2;
    },
  });
};
