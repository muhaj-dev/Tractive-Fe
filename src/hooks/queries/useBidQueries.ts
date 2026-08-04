import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { bidService } from "@/services/bidService";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";

export const bidKeys = {
  all: ["bids"] as const,
  lists: () => [...bidKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...bidKeys.lists(), filters] as const,
  bidders: (productId: string) =>
    [...bidKeys.all, "bidders", productId] as const,
  winning: (productId: string) =>
    [...bidKeys.all, "winning", productId] as const,
};

/**
 * Hook to fetch bidders for a specific product
 */
export const useBidders = (productId: string | undefined) => {
  return useQuery({
    queryKey: bidKeys.bidders(productId || ""),
    queryFn: () => productService.getBidders(productId!),
    enabled: !!productId,
  });
};

/**
 * Hook to fetch winning bidder for a specific product
 */
export const useWinningBidder = (productId: string | undefined) => {
  return useQuery({
    queryKey: bidKeys.winning(productId || ""),
    queryFn: () => productService.getWinningBidder(productId!),
    enabled: !!productId,
  });
};

export const useMyBids = () => {
  return useQuery({
    queryKey: ["myBids"],
    queryFn: () => bidService.getMyBids(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export const useCounteredBids = (
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["myBids", "countered", page, limit],
    queryFn: () => bidService.getBidsByStatus("countered", page, limit),
    enabled,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const usePendingBids = (
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["myBids", "pending", page, limit],
    queryFn: () => bidService.getBidsByStatus("pending", page, limit),
    enabled,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useRejectedBids = (
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["myBids", "rejected", page, limit],
    queryFn: () => bidService.getBidsByStatus("rejected", page, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useWonBids = () => {
  return useQuery({
    queryKey: ["wonBids"],
    queryFn: () => bidService.getWonBids(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useWonBidsCheckout = () => {
  return useQuery({
    queryKey: ["wonBidsCheckout"],
    queryFn: () => bidService.getWonBidsCheckout(),
    staleTime: 0, // Always fresh for checkout
  });
};

/**
 * Withdraw a pending bid the buyer placed (`DELETE /api/bids/{id}`). Fleet bids
 * have no equivalent route yet, so this covers product bids only.
 */
export const useWithdrawBid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bidService.withdrawBid(id),
    onSuccess: () => {
      toast.success("Bid withdrawn", {
        duration: 4000,
        position: "top-center",
      });
      queryClient.invalidateQueries({ queryKey: ["myBids"] });
      queryClient.invalidateQueries({ queryKey: ["wonBids"] });
      queryClient.invalidateQueries({ queryKey: ["wonBidsCheckout"] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to withdraw bid."), {
        duration: 4000,
        position: "top-center",
      });
    },
  });
};

export const useBuyerUpdateBidStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      counterOffer,
      message,
    }: {
      id: string;
      status: "accepted" | "rejected" | "countered";
      counterOffer?: number;
      message?: string;
    }) =>
      bidService.updateBidStatus(id, {
        status,
        ...(counterOffer !== undefined ? { counterOffer } : {}),
        ...(message ? { message } : {}),
      }),
    onSuccess: (_data, variables) => {
      const label =
        variables.status === "countered"
          ? "Counter offer sent"
          : variables.status === "accepted"
            ? "Counter accepted"
            : "Bid rejected";
      toast.success(label, { duration: 4000, position: "top-center" });
      // Invalidate every cache keyed under "myBids" (including status-scoped queries)
      queryClient.invalidateQueries({ queryKey: ["myBids"] });
      queryClient.invalidateQueries({ queryKey: ["wonBids"] });
      queryClient.invalidateQueries({ queryKey: ["wonBidsCheckout"] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update bid."), {
        duration: 4000,
        position: "top-center",
      });
    },
  });
};
