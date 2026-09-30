
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import api from "@/lib/axios";
import { userService } from "@/services/UserService";
import { toast } from "sonner";
import { productKeys } from "./useProductQueries";
import { transporterKeys } from "./useTransporterQueries";

// Types
export interface ContentPayload {
    role?: string;
    name?: string;
    phone?: string;
    address?: string;
    country?: string;
    state?: string;
    lga?: string; // Local Government Area
    //   villageOrLocalMarket?: string; // Keeping for potential backward compatibility or if mapped
    //   nin?: string;
    //   businessName?: string;
    interests?: readonly string[];
}

export interface SwitchRolePayload {
    activeRole: string;
}

export interface AvailableRolesResponse {
    activeRole: string | null;
    availableRoles: string[];
}

export const useUserProfile = () => {
    const { status } = useSession();
    return useQuery({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const { data } = await api.get("/api/profile");
            return data.user || data;
        },
        enabled: status === "authenticated",
        retry: (failureCount, error: unknown) => {
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 401 || err.response?.status === 403) return false;
            return failureCount < 2;
        }
    });
};

export const useAvailableRoles = () => {
    return useQuery<AvailableRolesResponse>({
        queryKey: ["availableRoles"],
        queryFn: async () => {
            const { data } = await api.get("/api/profile/switch-role");
            return data;
        },
        retry: 1
    })
}

export const useSwitchRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: SwitchRolePayload) => {
            const { data } = await api.patch("/api/profile/switch-role", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            queryClient.invalidateQueries({ queryKey: ["availableRoles"] });
        }
    })
}

export const useAddAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: ContentPayload) => {
            const { data } = await api.post("/api/auth/add-account", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            queryClient.invalidateQueries({ queryKey: ["availableRoles"] });
        }
    })
}

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("/api/profile");
      return response.data?.user ?? null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: { response?: { status?: number } }) =>
      error?.response?.status !== 401 && failureCount < 2,
  });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: ContentPayload) => {
            const { data } = await api.patch("/api/profile", payload);
            return data;
        },
        onSuccess: () => {
            toast.success("Profile updated successfully!", {
                duration: 3000,
                position: "top-center",
            });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to update profile. Please try again.",
                { duration: 4000, position: "top-center" },
            );
        },
    })
}

/**
 * After a follow/unfollow, re-read the profiles that show this seller's
 * follower count. The count is never incremented locally: the follow
 * endpoints' response body is not documented, so the seller record
 * (`followersCount` on GET /api/sellers/{id} and GET /api/transporters/{id})
 * is the source of truth. If the response does carry a count it is applied at
 * once, and the refetch then confirms it.
 */
export const syncFollowerCount = (
    queryClient: ReturnType<typeof useQueryClient>,
    sellerId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: any,
    isFollowing: boolean,
) => {
    const count = [
        response?.followersCount,
        response?.data?.followersCount,
    ].find((v) => typeof v === "number" && Number.isFinite(v));
    if (typeof count === "number") {
        const apply = (old: unknown) =>
            old && typeof old === "object"
                ? { ...old, followersCount: count, isFollowing }
                : old;
        queryClient.setQueryData(["seller", sellerId], apply);
        queryClient.setQueryData(transporterKeys.detail(sellerId), apply);
    }
    queryClient.invalidateQueries({ queryKey: ["seller", sellerId] });
    queryClient.invalidateQueries({ queryKey: transporterKeys.detail(sellerId) });
    queryClient.invalidateQueries({ queryKey: ["sellers"] });
    // Product pages embed the owner's follow status.
    queryClient.invalidateQueries({ queryKey: productKeys.all });
};

/**
 * `subject` names who is being followed in the toasts — transporters use the
 * same seller follow endpoint, and "following this farmer" misreads there.
 */
export const useFollowFarmer = (subject = "farmer") => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (farmerId: string) => userService.followFarmer(farmerId),
        onSuccess: (response, farmerId) => {
            toast.success(`You are now following this ${subject}`);
            syncFollowerCount(queryClient, farmerId, response, true);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            const message = error?.response?.data?.message || `Failed to follow ${subject}`;
            toast.error(message);
        }
    })
}

export const useUnfollowFarmer = (subject = "farmer") => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (farmerId: string) => userService.unfollowFarmer(farmerId),
        onSuccess: (response, farmerId) => {
             toast.success(`You have unfollowed this ${subject}`);
             syncFollowerCount(queryClient, farmerId, response, false);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
             const message = error?.response?.data?.message || `Failed to unfollow ${subject}`;
             toast.error(message);
        }
    })
}

export const useAddToWishlist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (productId: string) => userService.addToWishlist(productId),
        onSuccess: () => {
             toast.success("Added to wishlist");
             queryClient.invalidateQueries({ queryKey: productKeys.all });
             queryClient.invalidateQueries({ queryKey: ["profile"] });
             queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
             const message = error?.response?.data?.error || error?.response?.data?.message || "Failed to add to wishlist";
             toast.error(message);
        }
    })
}

/** Wishlist a truck rather than a product — `POST /api/wishlist {fleetId}`. */
export const useAddFleetToWishlist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (fleetId: string) => userService.addFleetToWishlist(fleetId),
        onSuccess: () => {
             toast.success("Fleet added to wishlist");
             queryClient.invalidateQueries({ queryKey: ["wishlist"] });
             queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
             const message = error?.response?.data?.error || error?.response?.data?.message || "Failed to add fleet to wishlist";
             toast.error(message);
        }
    })
}

export const useRemoveFleetFromWishlist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (fleetId: string) => userService.removeFleetFromWishlist(fleetId),
        onSuccess: () => {
             toast.success("Fleet removed from wishlist");
             queryClient.invalidateQueries({ queryKey: ["wishlist"] });
             queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
             const message = error?.response?.data?.error || error?.response?.data?.message || "Failed to remove fleet from wishlist";
             toast.error(message);
        }
    })
}

export const useRemoveFromWishlist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (productId: string) => userService.removeFromWishlist(productId),
        onSuccess: () => {
             toast.success("Removed from wishlist");
             queryClient.invalidateQueries({ queryKey: productKeys.all });
             queryClient.invalidateQueries({ queryKey: ["profile"] });
             queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
             const message = error?.response?.data?.error || error?.response?.data?.message || "Failed to remove from wishlist";
             toast.error(message);
        }
    })
}

export const useGetWishlist = (page: number = 1, limit: number = 20) => {
    return useQuery({
        queryKey: ["wishlist", page, limit],
        queryFn: () => userService.getWishlist(page, limit),
    })
}

/** Ids of the fleets already on the buyer's wishlist. Wishlist rows carry
 * `type: "fleet" | "product"`; fleet rows populate `fleet`, product rows don't.
 * React Query dedupes this across every truck card on the page. */
export const useWishlistedFleetIds = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["wishlist", "fleet-ids"],
        queryFn: () => userService.getWishlist(1, 100),
        staleTime: 60 * 1000,
        // Non-buyer roles get a 403 here — one attempt is enough.
        retry: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
    const fleetIds = new Set<string>(
        items
            .map((item) => item?.fleet?._id ?? item?.fleet)
            .filter((id: unknown): id is string => typeof id === "string")
    );

    return { fleetIds, isLoading };
};

export const useGetTopSellers = () => {
  return useQuery({
    queryKey: ["topSellers"],
    queryFn: () => userService.getTopSellers(),
  });
};

// ── Change Password ───────────────────────────────────────────────────────────
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      api.post("/api/auth/change-password", data),
    onSuccess: () => {
      toast.success("Password changed successfully!", {
        duration: 3000,
        position: "top-center",
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      // The endpoint reports failures as { error: "Invalid current password" }.
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to change password. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

