"use client";
import React from "react";
import { UserAvatar } from "@/components/UserAvatar";
import {
  PhoneCallFill,
  MessageFill,
} from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import { YellowStarIcon, StarIcon } from "@/icons/Icons";
import type { TrackOrder } from "./trackOrdersData";
import { useTransporterFollow } from "@/hooks/useTransporterFollow";

interface Props {
  order: TrackOrder;
}

const NA = "N/A";

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-[2px]">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(rating) ? (
        <YellowStarIcon key={i} className="w-3 h-3" />
      ) : (
        <StarIcon key={i} className="w-3 h-3" />
      ),
    )}
    <span className="ml-1 font-montserrat text-[10px] text-[#2b2b2b]">
      {rating.toFixed(1)}
    </span>
  </div>
);

export const TransporterInfoPanel: React.FC<Props> = ({ order }) => {
  const t = order.transporter;
  const {
    canFollow,
    isFollowing,
    isPending,
    isStatusLoading,
    followersCount,
    toggleFollow,
  } =
    useTransporterFollow(order.transporter.id);
  // The order payload's count goes stale after a follow; the seller record
  // is re-read on every follow/unfollow, so prefer it when it answers.
  const followers = followersCount ?? t.followers;
  return (
    <div className="bg-[#fefefe] rounded-[10px] shadow-md p-4 flex flex-col items-center gap-2">
      <p className="self-start font-montserrat text-[11px] text-[#808080]">
        Transporters info
      </p>
      <UserAvatar
        src={t.avatar}
        name={t.id ? t.name : undefined}
        size={48}
      />
      <span className="font-montserrat font-medium text-[14px] text-[#2b2b2b]">
        {t.name}
      </span>
      {/* Business name — only shown when it's a distinct value, not a repeat
          of the personal name (businessName is null for many transporters). */}
      {t.company && t.company !== NA && t.company !== t.name && (
        <span className="font-montserrat text-[11px] text-[#808080]">
          {t.company}
        </span>
      )}
      <Stars rating={t.rating} />
      {/* Hidden until a transporter is assigned, and for transporters that
          aren't agents — the backend only accepts follows for agent accounts. */}
      {t.id && canFollow && (
        <button
          type="button"
          onClick={toggleFollow}
          disabled={isPending || isStatusLoading}
          aria-pressed={isFollowing}
          className={`border rounded-[20px] px-6 py-1 font-montserrat text-[11px] hover:bg-[#f5f5f5] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isFollowing
              ? "border-[#d2d2d2] text-[#808080]"
              : "border-[#808080] text-[#2b2b2b]"
          }`}
        >
          {isPending ? "..." : isFollowing ? "Following" : "Follow"}
        </button>
      )}
      <span className="font-montserrat text-[11px] text-[#808080]">
        {followers} {followers === 1 ? "follower" : "followers"}
      </span>
      <span className="font-montserrat text-[11px] text-[#2b2b2b]">
        {t.location}
      </span>

      <div className="flex items-center gap-3 mt-1">
        <span className="bg-[#eaf3ea] w-9 h-9 rounded-full flex items-center justify-center cursor-pointer">
          <PhoneCallFill />
        </span>
        <span className="bg-[#eaf3ea] w-9 h-9 rounded-full flex items-center justify-center cursor-pointer">
          <MessageFill />
        </span>
      </div>

      <p className="font-montserrat text-[11px] text-[#2b2b2b] mt-1">
        {t.yearsOfService}{" "}
        {t.yearsOfService === 1 ? "year" : "years"} of transportation service
      </p>
      <p className="font-montserrat text-[11px] text-[#2b2b2b]">
        Rating: <span className="font-medium">{t.ratingLabel}</span>
      </p>
    </div>
  );
};
