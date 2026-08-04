"use client";
import TruckCard from "@/components/cards/TruckCard";
import React from "react";
import { useSimilarFleets } from "@/hooks/queries/useTransporterQueries";
import type { ApiTruck } from "@/services/transporterService";

interface AlmostFullTruckProps {
  /** Fleet currently on screen — the one we're finding neighbours for. */
  fleetId?: string;
  fromState?: string;
  toState?: string;
  sortOption?: string;
}

const naira = (v?: number) =>
  typeof v === "number" ? `₦${v.toLocaleString()}` : "—";

export const SimilarFleet = ({
  fleetId,
  fromState = "",
  toState = "",
  sortOption = "All",
}: AlmostFullTruckProps) => {
  const { data: fleets = [], isLoading } = useSimilarFleets(fleetId);

  const filtered = fleets.filter((truck: ApiTruck) => {
    const route = truck.route ?? {};
    const matchesFrom = fromState ? route.fromState === fromState : true;
    const matchesTo = toState ? route.toState === toState : true;

    // Capacity comes back in kg, so "Empty" means nothing loaded and
    // "Almost Full" means partially loaded but not yet at capacity.
    const capacity = truck.capacityKg ?? 0;
    const remaining = truck.remainingCapacityKg ?? 0;
    let matchesSort = true;
    if (sortOption === "Empty") {
      matchesSort = capacity > 0 && remaining === capacity;
    } else if (sortOption === "Almost Full") {
      matchesSort = remaining > 0 && remaining < capacity;
    }

    return matchesFrom && matchesTo && matchesSort;
  });

  // Nothing to compare against is a normal state for a one-truck transporter —
  // render nothing rather than an empty heading.
  if (!isLoading && filtered.length === 0) return null;

  return (
    <div className="py-1">
      <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
        Similar Fleet
      </p>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-55 rounded-lg bg-[#f1f1f1] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((truck: ApiTruck) => (
            <TruckCard
              isEmptyTruck={(truck.remainingCapacityKg ?? 0) === (truck.capacityKg ?? 0)}
              key={truck._id}
              id={truck._id}
              image={truck.images?.[0] || "/images/transportTruck.png"}
              images={truck.images}
              truckName={truck.fleetName || truck.model || truck.plateNumber}
              model={truck.model}
              plateNumber={truck.plateNumber}
              fleetDescription={truck.fleetDescription}
              amountPerKg={naira(truck.price)}
              fullLoad={naira(truck.price)}
              totalPrice={truck.price}
              priceNegotiation={truck.priceNegotiation}
              capacityKg={truck.capacityKg}
              remainingCapacityKg={truck.remainingCapacityKg}
              locationFrom={truck.route?.fromState}
              locationTo={truck.route?.toState}
              spaceRemaining={
                truck.remainingCapacityDisplay ??
                `${truck.remainingCapacityKg ?? 0} kg`
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
