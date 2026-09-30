import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  farmerService,
  Farmer,
  FarmersResponse,
  FarmerFilters,
} from "@/services/FarmerService";
import { toast } from "sonner";

// Query key factory for farmers
export const farmerKeys = {
  all: ["farmers"] as const,
  lists: () => [...farmerKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...farmerKeys.lists(), filters] as const,
  details: () => [...farmerKeys.all, "detail"] as const,
  detail: (id: string) => [...farmerKeys.details(), id] as const,
};

/**
 * Hook to fetch all farmers
 */
export const useFarmers = (filters?: FarmerFilters) => {
  const { status } = useSession();

  return useQuery({
    queryKey: farmerKeys.list(filters as Record<string, unknown>),
    queryFn: () => farmerService.getFarmers(filters),
    enabled: status === "authenticated",
    retry: (failureCount, error: { response?: { status?: number } }) => {
      // Don't retry on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single farmer by ID
 */
export const useFarmer = (id: string | null) => {
  return useQuery({
    queryKey: farmerKeys.detail(id || ""),
    queryFn: () => farmerService.getFarmerById(id!),
    enabled: !!id, // Only run query if we have an ID
    retry: 1,
  });
};

/**
 * Hook to create a new farmer
 */
export const useCreateFarmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Farmer>) => farmerService.createFarmer(data),
    onSuccess: () => {
      // Invalidate all farmer list queries (includes any active filtered queries)
      // so the list refetches automatically and shows the new farmer immediately.
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
      toast.success("Farmer onboarded successfully!");
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } }; message?: string }) => {
      const message =
        // The farmers API reports failures as { error: "..." }.
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create farmer";
      toast.error(message);
    },
  });
};

/**
 * Hook to update a farmer (full update - PUT)
 */
export const useUpdateFarmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Farmer> }) =>
      farmerService.updateFarmer(id, data),
    onSuccess: (updatedFarmer, variables) => {
      // 1. Update the detail cache
      queryClient.setQueryData(farmerKeys.detail(variables.id), updatedFarmer);

      // 2. Update the farmer in every cached list (keyed by filters), then
      // refetch so the list reflects the server's copy.
      queryClient.setQueriesData(
        { queryKey: farmerKeys.lists() },
        (oldData: FarmersResponse | undefined) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            farmers: oldData.farmers.map((f) =>
              f.id === variables.id ? updatedFarmer : f,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });

      toast.success("Farmer updated successfully!");
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } }; message?: string }) => {
      const message =
        // The farmers API reports failures as { error: "..." }.
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update farmer";
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a farmer
 */
export const useDeleteFarmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => farmerService.deleteFarmer(id),
    onSuccess: (_, deletedId) => {
      // 1. Remove from detail cache
      queryClient.removeQueries({ queryKey: farmerKeys.detail(deletedId) });

      // 2. Remove from every cached list. Lists are keyed ["farmers","list",filters],
      // so setQueryData on farmerKeys.lists() alone matched nothing and the
      // deleted farmer stayed on screen.
      queryClient.setQueriesData(
        { queryKey: farmerKeys.lists() },
        (oldData: FarmersResponse | undefined) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            farmers: oldData.farmers.filter((f) => f.id !== deletedId),
            total: Math.max(0, oldData.total - 1),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });

      toast.success("Farmer deleted successfully!");
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } }; message?: string }) => {
      const message =
        // The farmers API reports failures as { error: "..." }.
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete farmer";
      toast.error(message);
    },
  });
};
