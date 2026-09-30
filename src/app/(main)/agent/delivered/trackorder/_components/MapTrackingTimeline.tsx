"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import React from "react";
import { TickIcon } from "../../../_components/Icons/AgentIcons";
import { useOrderTracking } from "@/hooks/queries/useOrderQueries";
import type { TrackOrder } from "@/app/(main)/buyer/(account)/track-orders/_components/trackOrdersData";
import "../TrackOrder.css";

// Leaflet touches `window` at import time, so it must skip SSR. Reuse the
// buyer track-orders live map so the agent view stays in sync with it.
const LiveTrackingMap = dynamic(
  () =>
    import(
      "@/app/(main)/buyer/(account)/track-orders/_components/LiveTrackingMap"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#f1f1f1] animate-pulse rounded-[10px]" />
    ),
  },
);

const StepDot = ({ active }: { active: boolean }) => (
  <div
    className={`flex items-center p-[3px] justify-center rounded-full w-4 h-4 z-10 ${
      active
        ? "bg-[#538e53] text-[#fefefe]"
        : "bg-[#fefefe] border-[1px] border-[#808080]"
    }`}
  >
    {active && <TickIcon />}
  </div>
);

interface Props {
  order: TrackOrder;
}

export const MapTrackingTimeline = ({ order }: Props) => {
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
  // order record so the map renders as soon as the backend sets any position.
  const position = tracking?.currentLocation ?? order.liveLocation;
  const locationLabel =
    tracking?.locationLabel || order.liveLocationLabel || null;
  const lastUpdatedAt = tracking?.lastUpdatedAt ?? order.liveUpdatedAt;

  return (
    <div className="w-full h-fit flex flex-col gap-4 bg-[#fefefe] rounded-[10px] shadow-md overflow-hidden">
      <div className="relative w-full h-[300px] sm:h-[400px]">
        {position ? (
          <LiveTrackingMap
            lat={position.lat}
            lng={position.lng}
            label={order.product.name}
            locationLabel={locationLabel}
            lastUpdatedAt={lastUpdatedAt}
          />
        ) : (
          <Image
            src="/images/trackingMap.png"
            alt="Map"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="relative w-[100%] mx-auto h-[50px] sm:h-[60px]">
        <div className="absolute top-[0.5rem] left-[10%] right-[55%] h-[2px] timeline_dashed_line_m1 border-dashed border-[1px] border-[#808080]"></div>
        <div className="absolute top-[0.5rem] left-[45%] right-[10%] h-[2px] timeline_dashed_line_m2 border-dashed border-[1px] border-[#808080]"></div>
        <div className="absolute left-[3%] Picked_Date top-0 flex flex-col gap-1 justify-center items-center">
          <StepDot active={picked} />
          <div className="flex flex-col items-center">
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              Picked
            </span>
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {order.pickedAt}
            </span>
          </div>
        </div>
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 flex flex-col gap-1 justify-center items-center">
          <StepDot active={onTransit} />
          <div className="flex flex-col items-center">
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              On Transit
            </span>
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {order.onTransitAt}
            </span>
          </div>
        </div>
        <div className="absolute right-[2%] deliveredEST_Date top-0 flex flex-col gap-1 justify-center items-center">
          <StepDot active={delivered} />
          <div className="flex flex-col items-center">
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              Delivered
            </span>
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {delivered
                ? order.deliveredAt !== "N/A"
                  ? order.deliveredAt
                  : "Date not recorded"
                : `EST date ${order.estDeliveryDate}`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center flex-nowrap flex-shrink-0 justify-center gap-2 sm:gap-4 pb-4">
        <span className="font-montserrat font-normal text-[11.5px] text-[#2b2b2b]">
          From: {order.fromLocation}
        </span>
        <span className="font-montserrat font-normal text-[11.5px] text-[#2b2b2b]">
          To: {order.toLocation}
        </span>
      </div>
    </div>
  );
};
