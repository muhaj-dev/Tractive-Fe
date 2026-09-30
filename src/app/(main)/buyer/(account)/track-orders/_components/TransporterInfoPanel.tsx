"use client";
import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  PhoneCallFill,
  MessageFill,
} from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import { YellowStarIcon, StarIcon } from "@/icons/Icons";
import type { TrackOrder } from "./trackOrdersData";

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
  return (
    <div className="bg-[#fefefe] rounded-[10px] shadow-md p-4 flex flex-col items-center gap-2">
      <p className="self-start font-montserrat text-[11px] text-[#808080]">
        Transporters info
      </p>
      <Avatar
        src={t.avatar}
        alt={t.company}
        size={48}
        className="rounded-full w-12 h-12 object-cover"
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
      <button
        type="button"
        className="border border-[#808080] rounded-[20px] px-6 py-1 font-montserrat text-[11px] text-[#2b2b2b] hover:bg-[#f5f5f5] cursor-pointer"
      >
        Follow
      </button>
      <span className="font-montserrat text-[11px] text-[#808080]">
        {t.followers} {t.followers === 1 ? "follower" : "followers"}
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
