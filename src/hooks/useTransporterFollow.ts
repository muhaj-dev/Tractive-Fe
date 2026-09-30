"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  useFollowFarmer,
  useUnfollowFarmer,
} from "@/hooks/queries/useUserQueries";

/**
 * Follow state for a transporter. A transporter is a seller record, so it
 * follows through the seller endpoints (POST/DELETE
 * /api/buyers/sellers/{id}/follow).
 *
 * Whether the buyer already follows them comes from GET /api/sellers/{id},
 * the only route documented to carry `isFollowing` — neither the transporter
 * profile nor the order list is. Without it the button would read "Follow"
 * after every reload, even for a transporter the buyer follows.
 *
 * The backend only accepts a follow when the account is also an agent — a
 * transporter-only account gets 400 "Seller must be an agent account". The
 * seller record carries `roles`, so `canFollow` is false (and the button is
 * hidden) for those instead of offering a button that always fails.
 *
 * The transporter profile has no `followersCount` either, so the count also
 * comes from here. The query key sits under ["seller", id], so the follow
 * mutations' invalidation re-reads it and the count is always the API's.
 */
export const useTransporterFollow = (transporterId: string | undefined) => {
  const id = transporterId ?? "";

  const { data: sellerRecord, isLoading: isStatusLoading } = useQuery({
    queryKey: ["seller", id, "follow-status"],
    queryFn: async () => {
      const response = await api.get(`/api/sellers/${id}`);
      return (response.data?.data ?? response.data) as {
        isFollowing?: boolean;
        followersCount?: number;
        roles?: string[];
      } | null;
    },
    enabled: !!id,
    retry: false,
  });

  const followMutation = useFollowFarmer("transporter");
  const unfollowMutation = useUnfollowFarmer("transporter");
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => {
    if (typeof sellerRecord?.isFollowing === "boolean") {
      setIsFollowing(sellerRecord.isFollowing);
    }
  }, [sellerRecord?.isFollowing]);

  const toggleFollow = async () => {
    if (!id || isPending) return;
    const previous = isFollowing;
    setIsFollowing(!previous); // optimistic
    try {
      if (previous) {
        await unfollowMutation.mutateAsync(id);
      } else {
        await followMutation.mutateAsync(id);
      }
    } catch {
      // The mutation hook already shows the error toast.
      setIsFollowing(previous);
    }
  };

  const followersCount =
    typeof sellerRecord?.followersCount === "number"
      ? sellerRecord.followersCount
      : null;

  const canFollow =
    Array.isArray(sellerRecord?.roles) && sellerRecord.roles.includes("agent");

  return {
    /** False until the seller record confirms an agent account. */
    canFollow,
    isFollowing,
    isPending,
    /** True until the current follow state is known — keep the button disabled. */
    isStatusLoading: !!id && isStatusLoading,
    followersCount,
    toggleFollow,
  };
};
