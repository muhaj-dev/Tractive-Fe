"use client";
import TruckCard from "@/components/cards/TruckCard";
import React from "react";
import { useGetTransporterTrucks } from "@/hooks/queries/useTransporterQueries";
import { Loader2 } from "lucide-react";

interface AlmostFullTruckProps {
  fromState?: string;
  toState?: string;
}

export const AlmostFullTruck = ({
  fromState = "",
  toState = "",
}: AlmostFullTruckProps) => {
  const { data: trucksData, isLoading, isError } = useGetTransporterTrucks({
    status: "almost_full",
    fromState: fromState || undefined,
    toState: toState || undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTrucks = Array.isArray(trucksData) ? trucksData : (trucksData as any)?.trucks || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedTrucks = rawTrucks.map((truck: any, index: number) => {
    const capacityKg = truck.capacityKg || 0;
    const remainingCapacityKg = truck.remainingCapacityKg ?? capacityKg;
    const totalPrice = truck.price || 0;
    const pricePerKg = truck.pricePerKgEquivalent || 0;
    const capacityTons = (capacityKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const remainingCapacityTons = (remainingCapacityKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 });

    return {
      id: truck._id || truck.id || `truck-${index}`,
      image: (truck.images && truck.images.length > 0) ? truck.images[0] : truck.image || "/images/transportTruck.png",
      images: truck.images || [],
      truckName: truck.fleetName || truck.model || truck.truckName || truck.name || "Unknown Truck",
      rating: String(truck.rating || 0),
      amountPerKg: `₦${pricePerKg.toLocaleString()}`,
      fullLoad: `${capacityTons} tons`,
      locationFrom: truck.route?.fromState || truck.locationFrom || truck.origin || "Unknown",
      locationTo: truck.route?.toState || truck.locationTo || truck.destination || "Unknown",
      spaceRemaining: `${remainingCapacityTons} tons`,
      fleetDescription: truck.fleetDescription || "",
      model: truck.model || "",
      size: truck.size || truck.capacity || "",
      plateNumber: truck.plateNumber || "",
      capacityKg,
      remainingCapacityKg,
      pricePerKg,
      totalPrice,
      priceNegotiation: truck.priceNegotiation || false,
    };
  });

  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto py-6 flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-[#2b2b2b] w-6 h-6" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-[90%] mx-auto py-6 flex flex-col justify-center items-center">
        <p className="text-[#808080] font-montserrat text-[14px]">Failed to load almost full trucks.</p>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto py-6">
      <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
        Almost Full
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {formattedTrucks.length > 0 ? (
          formattedTrucks.map((card: ReturnType<typeof rawTrucks.map>[number]) => (
            <TruckCard
              isEmptyTruck={false}
              key={card.id}
              id={card.id}
              image={card.image}
              images={card.images}
              truckName={card.truckName}
              rating={card.rating}
              amountPerKg={card.amountPerKg}
              fullLoad={card.fullLoad}
              locationFrom={card.locationFrom}
              locationTo={card.locationTo}
              spaceRemaining={card.spaceRemaining}
              fleetDescription={card.fleetDescription}
              model={card.model}
              size={card.size}
              plateNumber={card.plateNumber}
              capacityKg={card.capacityKg}
              remainingCapacityKg={card.remainingCapacityKg}
              pricePerKg={card.pricePerKg}
              totalPrice={card.totalPrice}
              priceNegotiation={card.priceNegotiation}
            />
          ))
        ) : (
          <div className="col-span-full py-10 flex justify-center">
             <p className="text-[#808080] font-montserrat text-[14px]">No almost full trucks found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlmostFullTruck;
