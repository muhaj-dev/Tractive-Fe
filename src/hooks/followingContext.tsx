"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { userService } from "@/services/UserService";
import { useQueryClient } from "@tanstack/react-query";
import {
  syncFollowerCount,
  useGetTopSellers,
} from "@/hooks/queries/useUserQueries";

// Define the shape of the following context. Keyed by sellerId (not name) so
// the state maps 1:1 onto the real follow endpoints.
interface FollowingContextType {
  followStates: Record<string, boolean>;
  loadingStates: Record<string, boolean>;
  toggleFollow: (sellerId: string, sellerName?: string) => Promise<void>;
  isFollowing: (sellerId: string) => boolean;
}

// Create the context with a default value
const FollowingContext = createContext<FollowingContextType | undefined>(
  undefined
);

// Hook to use the following context
export const useFollowing = () => {
  const context = useContext(FollowingContext);
  if (!context) {
    throw new Error("useFollowing must be used within a FollowingProvider");
  }
  return context;
};

// Provider component to wrap the app
export const FollowingProvider = ({ children }: { children: ReactNode }) => {
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  // Seed initial follow states from the top-sellers list (replaces the old
  // hardcoded seller names). Each seller may carry an `isFollowing` flag.
  const { data: topSellersResponse } = useGetTopSellers();
  const queryClient = useQueryClient();

  useEffect(() => {
    const sellers = topSellersResponse?.data;
    if (!Array.isArray(sellers)) return;
    setFollowStates((prev) => {
      const next = { ...prev };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sellers.forEach((s: any) => {
        const id = s?.sellerId ?? s?._id ?? s?.id;
        if (id && next[id] === undefined) next[id] = !!s?.isFollowing;
      });
      return next;
    });
  }, [topSellersResponse]);

  const toggleFollow = async (sellerId: string, sellerName?: string) => {
    if (!sellerId) return;
    setLoadingStates((prev) => ({ ...prev, [sellerId]: true }));
    const currentlyFollowing = !!followStates[sellerId];
    const label = sellerName ?? "seller";
    try {
      const response = currentlyFollowing
        ? await userService.unfollowFarmer(sellerId)
        : await userService.followFarmer(sellerId);
      const newFollowState = !currentlyFollowing;
      // Keep the seller's follower count on other screens in step with the API.
      syncFollowerCount(queryClient, sellerId, response, newFollowState);
      setFollowStates((prev) => ({ ...prev, [sellerId]: newFollowState }));
      toast.success(
        newFollowState
          ? `Started following ${label}!`
          : `Unfollowed ${label}!`
      );
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [sellerId]: false }));
    }
  };

  const isFollowing = (sellerId: string) => !!followStates[sellerId];

  return (
    <FollowingContext.Provider
      value={{ followStates, loadingStates, toggleFollow, isFollowing }}
    >
      {children}
    </FollowingContext.Provider>
  );
};
