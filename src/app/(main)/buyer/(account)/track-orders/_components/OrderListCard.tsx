"use client";
import React from "react";
import Image from "next/image";
import { TickIcon } from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import { YellowStarIcon, StarIcon } from "@/icons/Icons";
import type { TrackOrder } from "./trackOrdersData";

interface Props {
  order: TrackOrder;
  selected: boolean;
  onSelect: (id: string) => void;
}

const STATUS_LABEL: Record<TrackOrder["status"], string> = {
  pending: "New",
  picked: "Picked",
  on_transit: "On transit",
  delivered: "Notify",
};

/**
 * Placeholder badge text when the transporter has no logo. A real carrier's
 * branding here would misattribute the delivery, so we use initials — and a
 * dash while no transporter has been assigned to the order yet.
 */
const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length || name === "N/A" || name.startsWith("Transporter not"))
    return "—";
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
};

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-[2px]">
    {Array.from({ length: 5 }).map((_, i) =>
      i < rating ? (
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

const StepDot: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className={`flex items-center justify-center w-4 h-4 rounded-full p-[2px] z-10 ${
      active
        ? "bg-[#538e53] text-[#fefefe]"
        : "bg-[#fefefe] border border-[#808080]"
    }`}
  >
    {active && <TickIcon />}
  </div>
);

export const OrderListCard: React.FC<Props> = ({ order, selected, onSelect }) => {
  const picked = ["picked", "on_transit", "delivered"].includes(order.status);
  const onTransit = ["on_transit", "delivered"].includes(order.status);
  const delivered = order.status === "delivered";

  return (
    <button
      type="button"
      onClick={() => onSelect(order.id)}
      className={`text-left w-full rounded-[10px] p-3 sm:p-4 border transition-colors cursor-pointer ${
        selected
          ? "border-[#538e53] bg-[#f3f9f3] shadow-[0_0_0_1px_#538e53]"
          : "border-[#e2e2e2] bg-[#fefefe] hover:bg-[#f3f9f3] hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {order.transporter.logo && order.transporter.logo !== "N/A" ? (
            <Image
              src={order.transporter.logo}
              alt={order.transporter.name}
              width={44}
              height={36}
              className="w-[44px] h-[36px] object-cover rounded-[4px] flex-shrink-0"
            />
          ) : (
            <div className="bg-[#e2e2e2] flex items-center justify-center w-[44px] h-[36px] rounded-[4px] flex-shrink-0">
              <span className="font-montserrat font-bold text-[11px] text-[#808080]">
                {initials(order.transporter.name)}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-montserrat font-medium text-[12px] sm:text-[13px] text-[#2b2b2b] truncate">
              {order.transporter.name}
            </span>
            <Stars rating={order.transporter.rating} />
          </div>
        </div>
        <span className="bg-[#538e53] text-[#fefefe] font-montserrat text-[11px] font-medium rounded-[4px] px-3 py-1 flex-shrink-0">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="relative w-full h-[36px] mb-3">
        <div className="absolute top-[7px] left-[10%] right-[55%] h-[2px] border-t border-dashed border-[#808080]" />
        <div className="absolute top-[7px] left-[45%] right-[10%] h-[2px] border-t border-dashed border-[#808080]" />
        <div className="absolute left-[3%] top-0 flex flex-col items-center gap-1">
          <StepDot active={picked} />
          <span className="font-montserrat text-[10px] text-[#2b2b2b]">
            Picked
          </span>
        </div>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center gap-1">
          <StepDot active={onTransit} />
          <span className="font-montserrat text-[10px] text-[#2b2b2b]">
            On Transit
          </span>
        </div>
        <div className="absolute right-[3%] top-0 flex flex-col items-center gap-1">
          <StepDot active={delivered} />
          <span className="font-montserrat text-[10px] text-[#2b2b2b]">
            Delivered
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#f7f7f7] rounded-[6px] p-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Image
            src={order.fleet.image}
            alt={order.fleet.name}
            width={32}
            height={20}
            className="object-cover rounded-[4px] flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-montserrat text-[11px] text-[#2b2b2b] truncate">
              {order.fleet.name}
            </span>
            <span className="font-montserrat text-[10px] text-[#808080] truncate">
              IOT: {order.fleet.iot}
            </span>
          </div>
        </div>
        <div className="w-px h-8 bg-[#e2e2e2]" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Image
            src={order.product.image}
            alt={order.product.name}
            width={28}
            height={28}
            className="object-cover rounded-[4px] flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-montserrat text-[11px] text-[#2b2b2b] truncate">
              {order.product.name}
            </span>
            <span className="font-montserrat text-[10px] text-[#808080] truncate">
              ID: {order.product.id.slice(0, 5)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};
