
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import api from "@/lib/axios";
import { userService } from "@/services/UserService";
import { toast } from "sonner";
import { productKeys } from "./useProductQueries";

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

export const useFollowFarmer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (farmerId: string) => userService.followFarmer(farmerId),
        onSuccess: () => {
            toast.success("You are now following this farmer");
             // Invalidate product queries to refresh checking status if needed
             // Using productKeys.all to be safe, or we could try to be more specific if we had the product ID
             queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to follow farmer";
            toast.error(message);
        }
    })
}

export const useUnfollowFarmer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (farmerId: string) => userService.unfollowFarmer(farmerId),
        onSuccess: () => {
             toast.success("You have unfollowed this farmer");
             queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
             const message = error?.response?.data?.message || "Failed to unfollow farmer";
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
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to change password. Please try again.",
        { duration: 4000, position: "top-center" },
      );
    },
  });
};

