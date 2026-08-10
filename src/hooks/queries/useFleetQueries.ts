import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fleetService, FleetPayload, GetFleetsParams } from "@/services/fleetService";
import { transporterService } from "@/services/transporterService";
import {
  mapFleetPaymentTransaction,
  mapTransporterTransaction,
} from "@/utils/TransporterTransactionData";
import { toast } from "sonner";

export const fleetKeys = {
  all: ["fleets"] as const,
  list: (params?: GetFleetsParams) => [...fleetKeys.all, "list", params] as const,
};

export const useAddFleet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FleetPayload) => fleetService.createFleet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Fleet added successfully", { duration: 3000 });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add fleet", { duration: 3000 });
    },
  });
};

export const useGetFleets = (params?: GetFleetsParams) => {
  return useQuery({
    queryKey: fleetKeys.list(params),
    queryFn: () => fleetService.getFleets(params),
  });
};

/**
 * Every transaction a transporter should see: the product-order transactions the
 * backend already returned, plus their own fleet payments — which were missing
 * entirely, leaving the Pending tab permanently empty.
 *
 * Rows are sorted newest first and de-duplicated by id, so a payment that ever
 * shows up in both sources is only counted once.
 */
export const useTransporterTransactions = () => {
  return useQuery({
    queryKey: ["transporter-transactions", "with-fleet-payments"],
    queryFn: async () => {
      const [orderTransactions, fleetPayments] = await Promise.all([
        transporterService.getTransactions().catch(() => []),
        fleetService.getMyFleetPayments().catch(() => []),
      ]);
      const rows = [
        ...fleetPayments.map(mapFleetPaymentTransaction),
        ...orderTransactions.map(mapTransporterTransaction),
      ];
      const seen = new Set<string>();
      return rows
        .filter((row) => {
          if (!row.id || seen.has(row.id)) return false;
          seen.add(row.id);
          return true;
        })
        .sort((a, b) => toTime(b.date) - toTime(a.date));
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Rows carry an already-formatted dd/mm/yyyy string, so sorting needs it parsed back.
const toTime = (ddmmyyyy: string): number => {
  const [dd, mm, yyyy] = (ddmmyyyy || "").split("/");
  if (!dd || !mm || !yyyy) return 0;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
};

export const useUpdateFleet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FleetPayload> }) => 
      fleetService.updateFleet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Fleet updated successfully", { duration: 3000 });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update fleet", { duration: 3000 });
    },
  });
};

export const useDeleteFleet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fleetService.deleteFleet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Fleet deleted successfully", { duration: 3000 });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete fleet", { duration: 3000 });
    },
  });
};

export const useUpdateFleetStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      fleetService.updateFleetStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Fleet status updated successfully", { duration: 3000 });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update fleet status", { duration: 3000 });
    },
  });
};
