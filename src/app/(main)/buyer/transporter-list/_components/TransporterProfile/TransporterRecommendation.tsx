"use client";
import Link from "next/link";
import React from "react";
import { useGetRecommendedTransporters } from "@/hooks/queries/useTransporterQueries";
import { RecommendedTransporter } from "@/services/transporterService";

/** Decorative fallback only — used when a transporter has no profile image. */
const FALLBACK_IMAGE = "/images/monsterTruck.png";

const displayName = (transporter: RecommendedTransporter) =>
  transporter.businessName || transporter.name || "Transporter";

export const TransporterRecommendation = ({
  transporterId,
}: {
  transporterId?: string;
}) => {
  const { data, isLoading, isError } = useGetRecommendedTransporters();

  // Don't recommend the transporter whose profile is already open.
  const recommendations = (data ?? [])
    .filter((transporter) => transporter._id !== transporterId)
    .slice(0, 6);

  return (
    <div className="flex flex-col w-full rounded-lg mt-4">
      <div className="w-[90%] flex flex-col justify-between mx-auto gap-3 mb-4">
        <p className="text-[13px] sm:text-[14px] md:text-[15px] text-[#141414] font-normal font-montserrat">
          Recommendation (based on your location)
        </p>
        <div className="w-full grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full rounded-md bg-gray-200 animate-pulse aspect-[2/1]"
              />
            ))
          ) : isError ? (
            <p className="text-gray-500 text-sm font-montserrat col-span-full py-4 text-center">
              Couldn&apos;t load recommendations right now.
            </p>
          ) : recommendations.length > 0 ? (
            recommendations.map((transporter) => (
              <Link
                key={transporter._id}
                href={`/buyer/transporter-list/${transporter._id}`}
                className="w-full rounded-md overflow-hidden transition-transform hover:scale-105 cursor-pointer"
              >
                <div
                  className="w-full aspect-[2/1] bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${transporter.image || FALLBACK_IMAGE})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
                    <span className="text-white text-[12px] sm:text-[13px] font-medium font-montserrat drop-shadow-md line-clamp-2">
                      {displayName(transporter)}
                    </span>
                    {transporter.matchedLocation && transporter.locationMatch && (
                      <span className="text-white/80 text-[10px] font-montserrat">
                        {transporter.matchedLocation}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm font-montserrat col-span-full py-4 text-center">
              No recommendations available for your location yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
