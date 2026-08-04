"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ImagePreviewBooking from "../../_components/BookingTransport/BookingHeader/ImagePreviewBooking";
import { OwnersInfo } from "../../_components/BookingTransport/TruckAndOwnerInfo/OwnersInfo";
import { SimilarFleet } from "../../_components/BookingTransport/TruckAndOwnerInfo/SimilarFleet";
import { TruckInfo } from "../../_components/BookingTransport/TruckAndOwnerInfo/TruckInfo";
import { TruckShowCase } from "../../_components/BookingTransport/TruckShowCase";
import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useGetTruckById } from "@/hooks/queries/useTransporterQueries";
import { useGetSeller } from "@/hooks/queries/useSellerQueries";

const BookingTransport: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const truckId = params?.id || null;
  const fleetBidId = searchParams?.get("fleetBidId") || undefined;
  const [currentStep, setCurrentStep] = useState(1);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const truckItem = useAppSelector((state) => state.truck.selectedTruck);
  const pendingOrderIds = useAppSelector(
    (state) => state.pendingTransport.orderIds
  );
  const { data: apiTruck, isLoading } = useGetTruckById(truckId);

  // The truck carries its owner as a bare id (`transporter: "<id>"`). The truck
  // payload has no rating or owner name, so we resolve both from the seller
  // record behind that id — it's the same profile the store page renders.
  const transporterRef = apiTruck?.transporter;
  const transporterId =
    (typeof transporterRef === "string"
      ? transporterRef
      : transporterRef?._id ?? transporterRef?.id) ?? "";
  const { data: ownerSeller } = useGetSeller(transporterId);

  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!truckItem && !apiTruck) {
    return (
      <div className="w-[90%] mx-auto py-20 text-center">
        <p className="text-red-500 font-montserrat">Truck not found or invalid ID</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#538e53] text-white rounded-md cursor-pointer font-montserrat"
        >
          Go Back
        </button>
      </div>
    );
  }

  // The truck's rating lives on its owner, not on the truck.
  const ownerRating = ownerSeller?.averageRating;

  // The API response is the source of truth. `truckItem` (put in redux by the
  // list page) is only a placeholder so navigating list → detail doesn't flash;
  // once the request lands, the fresh record replaces it.
  const apiTruckItem = apiTruck
    ? {
        id: apiTruck._id,
        image: apiTruck.images?.[0] ?? apiTruck.image ?? "",
        images: apiTruck.images ?? [],
        rating: (ownerRating ?? 0).toFixed(1),
        truckName: apiTruck.fleetName,
        amountPerKg: `₦${apiTruck.pricePerKgEquivalent}`,
        fullLoad: apiTruck.capacityTonnes
          ? `${apiTruck.capacityTonnes} tonnes`
          : apiTruck.capacity,
        spaceRemaining: apiTruck.remainingCapacityDisplay,
        locationFrom: apiTruck.route?.fromState ?? apiTruck.locationFrom ?? "",
        locationTo: apiTruck.route?.toState ?? apiTruck.locationTo ?? "",
        fleetDescription: apiTruck.fleetDescription,
        model: apiTruck.model,
        size: apiTruck.size,
        plateNumber: apiTruck.plateNumber,
        capacityKg: apiTruck.capacityKg,
        capacity: apiTruck.capacityKg,
        remainingCapacityKg: apiTruck.remainingCapacityKg,
        pricePerKg: apiTruck.pricePerKgEquivalent,
        totalPrice: apiTruck.price,
      }
    : null;

  const effectiveTruckItem = apiTruckItem ?? truckItem!;

  const allImages =
    effectiveTruckItem.images && effectiveTruckItem.images.length > 0
      ? effectiveTruckItem.images
      : [effectiveTruckItem.image];

  const selectedImage = allImages[selectedImageIndex] || allImages[0];

  const owner = transporterId
    ? {
        id: transporterId,
        name: ownerSeller?.name,
        image: ownerSeller?.image ?? undefined,
        rating: ownerRating,
        followersCount: ownerSeller?.followersCount,
        state: ownerSeller?.location,
        isFollowing: ownerSeller?.isFollowing,
      }
    : undefined;

  return (
    <div className="w-[90%] mx-auto py-6 flex flex-col gap-3.5">
      {pendingOrderIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#e9f4ea] border border-[#b7dfc1] rounded-[5px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 12l2 2 4-4"
              stroke="#538e53"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="9" stroke="#538e53" strokeWidth="2" />
          </svg>
          <p className="font-montserrat text-[12px] text-[#2b2b2b]">
            Products from your{" "}
            <span className="font-semibold">
              {pendingOrderIds.length} selected order
              {pendingOrderIds.length > 1 ? "s" : ""}
            </span>{" "}
            are pre-selected below. Review, then Negotiate or Pay.
          </p>
        </div>
      )}
      <ImagePreviewBooking
        item={effectiveTruckItem}
        selectedImage={selectedImage}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        isNegotiating={isNegotiating}
        setIsNegotiating={setIsNegotiating}
        fleetBidId={fleetBidId}
        fleetId={truckId || undefined}
      />
      <TruckShowCase
        images={allImages}
        currentIndex={selectedImageIndex}
        onSelect={setSelectedImageIndex}
      />
      <div className="flex flex-col mb-4 lg:flex-row gap-4 w-full">
        <TruckInfo
          item={effectiveTruckItem}
          apiTruck={apiTruck}
          rating={ownerRating}
          reviewCount={ownerSeller?.totalReviews}
        />
        <OwnersInfo owner={owner} />
      </div>
      <SimilarFleet fleetId={truckId || undefined} />
    </div>
  );
};

export default BookingTransport;
