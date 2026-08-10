"use client";
import { LocationIcon } from "@/icons/Icon1";
import { YellowStarIcon } from "@/icons/Icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { setSelectedTruck } from "@/lib/features/truck/truckSlice";
import {
  useAddFleetToWishlist,
  useRemoveFleetFromWishlist,
  useWishlistedFleetIds,
} from "@/hooks/queries/useUserQueries";

interface CardProps {
  id: string;
  image: string;
  images?: string[];
  truckName: string;
  amountPerKg?: string;
  locationFrom?: string;
  locationTo?: string;
  fullLoad?: string;
  rating?: string;
  spaceRemaining?: string;
  fleetDescription?: string;
  model?: string;
  size?: string;
  plateNumber?: string;
  capacityKg?: number;
  remainingCapacityKg?: number;
  pricePerKg?: number;
  totalPrice?: number;
  priceNegotiation?: boolean;
  isEmptyTruck?: boolean;
  /** Buyer-only affordance — hide it wherever `/api/wishlist` isn't available. */
  showWishlist?: boolean;
  className?: string;
  imageClass?: string;
  truckNameClass?: string;
}

export default function TruckCard({
  id,
  image,
  images,
  truckName,
  amountPerKg,
  fullLoad,
  locationFrom,
  locationTo,
  rating,
  spaceRemaining,
  fleetDescription,
  model,
  size,
  plateNumber,
  capacityKg,
  remainingCapacityKg,
  pricePerKg,
  totalPrice,
  priceNegotiation,
  isEmptyTruck = false,
  showWishlist = true,
  className = "",
  imageClass = "",
  truckNameClass = "",
}: CardProps) {
  const dispatch = useAppDispatch();

  const { fleetIds } = useWishlistedFleetIds();
  const addFleet = useAddFleetToWishlist();
  const removeFleet = useRemoveFleetFromWishlist();
  const isSaving = addFleet.isPending || removeFleet.isPending;

  // Optimistic local state, reconciled whenever the wishlist query settles.
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!isSaving) setIsWishlisted(fleetIds.has(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fleetIds.has(id), isSaving]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaving) return;

    const wasWishlisted = isWishlisted;
    setIsWishlisted(!wasWishlisted);

    try {
      if (wasWishlisted) {
        await removeFleet.mutateAsync(id);
      } else {
        await addFleet.mutateAsync(id);
      }
    } catch {
      setIsWishlisted(wasWishlisted);
    }
  };

  const handleClick = () => {
    dispatch(
      setSelectedTruck({
        id,
        image,
        images: images || [image],
        truckName,
        amountPerKg: amountPerKg || "",
        fullLoad: fullLoad || "",
        locationFrom: locationFrom || "",
        locationTo: locationTo || "",
        rating: rating || "0",
        spaceRemaining: spaceRemaining || "0kg",
        fleetDescription: fleetDescription || "",
        model: model || "",
        size: size || "",
        plateNumber: plateNumber || "",
        capacityKg,
        remainingCapacityKg,
        pricePerKg,
        totalPrice,
        priceNegotiation,
      })
    );
  };

  return (
    <div
      className={`bg-[#f9f9f9] rounded-lg shadow-md w-[100%] overflow-hidden ${className}`}
    >
      <div className="relative">
        <Image
          src={image}
          alt={truckName}
          width={381} // The original width ratio based value, can keep it but CSS controls actual display
          height={140}
          className={`w-full h-[140px] sm:h-[160px] object-cover rounded-t-lg ${imageClass}`}
        />
        {showWishlist && (
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={isSaving}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted ? "Remove truck from wishlist" : "Add truck to wishlist"
            }
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 right-2 bg-[#ffffff80] rounded-full p-1 cursor-pointer hover:scale-110 transition-transform ${
              isSaving ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="21"
              viewBox="0 0 22 21"
              fill={isWishlisted ? "#2A942A" : "none"}
              aria-hidden="true"
            >
              <path
                d="M11.454 19.21C11.114 19.33 10.554 19.33 10.214 19.21C7.31398 18.22 0.833984 14.09 0.833984 7.09C0.833984 4 3.32398 1.5 6.39398 1.5C8.21398 1.5 9.82398 2.38 10.834 3.74C11.3478 3.04588 12.017 2.48173 12.788 2.09274C13.559 1.70376 14.4104 1.50076 15.274 1.5C18.344 1.5 20.834 4 20.834 7.09C20.834 14.09 14.354 18.22 11.454 19.21Z"
                stroke="#2A942A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <Link
        href={`/buyer/transporter-list/booking-transporter/${id}`}
        onClick={handleClick}
        className="flex flex-col gap-3"
      >
        <div className="px-2.5 pt-2">
          <div className="flex items-center gap-3">
            <h2
              className={`text-[13px] font-medium font-montserrat ${truckNameClass}`}
            >
              {truckName}
            </h2>
            <div className="flex items-center gap-0.5">
              <YellowStarIcon />
              <span className="font-montserrat text-[12px] text-[#2b2b2b] font-normal">
                {rating}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-2.5">
          <div className="flex items-center gap-[3px]">
            <LocationIcon />
            <p className="font-montserrat text-[11px] text-[#2b2b2b] font-medium">
              {locationFrom} to {locationTo}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-montserrat text-[11px] text-[#2b2b2b] font-normal">
              Per Kg:
              <span className="font-medium"> {amountPerKg}</span>
            </p>
            <span className="w-[2px] h-[1rem] bg-[#808080]"></span>
            <p className="font-montserrat text-[11px] text-[#2b2b2b] font-normal">
              Full Load:
              <span className="font-medium"> {fullLoad}</span>
            </p>
          </div>
        </div>

        <div className="w-[100%] bg-[#CCE5CCB2] gap-0.5 flex items-center justify-center p-[4px]">
          <p
            className={`font-montserrat text-[11px] font-normal ${
              isEmptyTruck ? "text-[#2b2b2b]" : "text-[#8B4513]"
            }`}
          >
            {isEmptyTruck ? "Full Load:" : "Space Remaining:"}
          </p>
          <span className="font-montserrat text-[11px] text-[#2b2b2b] font-normal">
            {spaceRemaining}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="bg-[#538e53] w-[50%] h-[2.9rem] text-[#fefefe] font-normal text-[14px] rounded-tl-[10px] rounded-br-[10px] px-4 py-2 transition duration-200 ease-in-out cursor-pointer"
          >
            Book
          </button>
        </div>
      </Link>
    </div>
  );
}
