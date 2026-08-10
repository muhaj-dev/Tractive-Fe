import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  transactionService,
  CreateTransactionPayload,
  GetTransactionsParams,
  UpdateStatusData,
} from "@/services/transactionService";
import { toast } from "sonner";
import { orderKeys } from "./useOrderQueries";

// Agent transaction list — keyed by filters so each (status/search/year/month)
// combination is cached separately and invalidated together after a mutation.
export const useAgentTransactions = (params: GetTransactionsParams) => {
  return useQuery({
    queryKey: ["agentTransactions", params],
    queryFn: () => transactionService.getTransactions(params),
  });
};

// Approve a pending agent transaction. Invalidates every agentTransactions
// query so both the Pending and Approved tabs refetch from the server.
export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string } & UpdateStatusData) =>
      transactionService.updateTransactionStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agentTransactions"] });
      toast.success(
        variables.status === "approved"
          ? "Transaction approved"
          : "Transaction updated",
        { duration: 3000, position: "top-center" },
      );
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update transaction. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionService.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wonBidsCheckout"] });
      // The order has just moved from unpaid to awaiting approval — the
      // Pending Payment tab has to re-read it or it keeps offering "Complete
      // payment" for a payment already submitted.
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to create transaction. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};
