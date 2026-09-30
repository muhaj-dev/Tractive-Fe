"use client";
import React from "react";
import dynamic from "next/dynamic";
import { TickIcon } from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import NoLiveLocation from "@/components/tracking/NoLiveLocation";
import { useOrderTracking } from "@/hooks/queries/useOrderQueries";
import type { TrackOrder } from "./trackOrdersData";

// Leaflet touches `window` at import time, so it must skip SSR.
const LiveTrackingMap = dynamic(() => import("@/components/tracking/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f1f1f1] animate-pulse rounded-[10px]" />
  ),
});

interface Props {
  order: TrackOrder;
}

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

export const OrderTrackingMap: React.FC<Props> = ({ order }) => {
  const picked = ["picked", "on_transit", "delivered"].includes(order.status);
  const onTransit = ["on_transit", "delivered"].includes(order.status);
  const delivered = order.status === "delivered";

  // Live GPS only matters once the package is moving; poll while in motion.
  const trackingActive = picked && !delivered;
  const { data: tracking } = useOrderTracking(order.id, {
    enabled: picked,
    refetchInterval: trackingActive ? 30_000 : false,
  });
  // Prefer the fresh /tracking poll; fall back to the GPS embedded in the
  // order list so the map renders as soon as the backend sets any position.
  const position = tracking?.currentLocation ?? order.liveLocation;
  const locationLabel = tracking?.locationLabel || order.liveLocationLabel || null;
  const lastUpdatedAt = tracking?.lastUpdatedAt ?? order.liveUpdatedAt;

  return (
    <div className="w-full bg-[#fefefe] rounded-[10px] shadow-md flex flex-col gap-3 overflow-hidden">
      <div className="relative isolate w-full h-[260px] sm:h-[320px] shrink-0">
        {position ? (
          <LiveTrackingMap
            lat={position.lat}
            lng={position.lng}
            label={order.product.name}
            locationLabel={locationLabel}
            lastUpdatedAt={lastUpdatedAt}
          />
        ) : (
          <NoLiveLocation from={order.fromLocation} to={order.toLocation} />
        )}
      </div>

      <div className="relative w-[92%] mx-auto h-[60px] shrink-0">
        <div className="absolute top-[7px] left-[10%] right-[55%] h-[2px] border-t border-dashed border-[#808080]" />
        <div className="absolute top-[7px] left-[45%] right-[10%] h-[2px] border-t border-dashed border-[#808080]" />

        <div className="absolute left-[3%] top-0 flex flex-col items-center gap-1">
          <StepDot active={picked} />
          <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
            Picked
          </span>
          <span className="font-montserrat text-[10px] sm:text-[11px] text-[#2b2b2b]">
            {order.pickedAt}
          </span>
        </div>

        <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center gap-1">
          <StepDot active={onTransit} />
          <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
            On Transit
          </span>
          <span className="font-montserrat text-[10px] sm:text-[11px] text-[#2b2b2b]">
            {order.onTransitAt}
          </span>
        </div>

        <div className="absolute right-[3%] top-0 flex flex-col items-center gap-1">
          <StepDot active={delivered} />
          <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
            Delivered
          </span>
          <span className="font-montserrat text-[10px] sm:text-[11px] text-[#2b2b2b]">
            {delivered
              ? order.deliveredAt !== "N/A"
                ? order.deliveredAt
                : "Date not recorded"
              : `Est date: ${order.estDeliveryDate}`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 pb-4 gap-2">
        <span className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#2b2b2b]">
          From: {order.fromLocation}
        </span>
        <span className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#2b2b2b]">
          To: {order.toLocation}
        </span>
      </div>
    </div>
  );
};
