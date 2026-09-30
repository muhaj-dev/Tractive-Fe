"use client";
import { AwardIcon, StarIcon, YellowStarIcon } from "@/icons/Icons";
import Image from "next/image";
import React, { useState } from "react";
import {
  MessageFill,
  PhoneCallFill,
} from "../../../_components/Icons/AgentIcons";
import { TransportCallDetails } from "./TransportCallDetails";
import { PackagedTable } from "./PackagedTable";
import type { TrackOrder } from "@/app/(main)/buyer/(account)/track-orders/_components/trackOrdersData";

const NA = "N/A";

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) =>
        i < Math.round(rating) ? (
          <YellowStarIcon key={i} />
        ) : (
          <StarIcon key={i} />
        ),
      )}
    </div>
    <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
      {rating.toFixed(1)}
    </span>
  </div>
);

interface Props {
  order: TrackOrder;
}

export const TransportInfoAndPackageProduct = ({ order }: Props) => {
  const t = order.transporter;
  const phoneNumbers = t.phone ? [t.phone] : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedStates((prev) => ({ ...prev, [number]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [number]: false }));
    }, 2000);
  };

  const companyName = t.name !== NA ? t.name : "Transporter not assigned";
  const modalDetails = {
    company: companyName,
    logoSrc: t.logo !== NA ? t.logo : t.avatar,
    logoAlt: `${companyName} logo`,
    logoWidth: 67,
    logoHeight: 47,
    rating: t.rating.toFixed(1),
    phoneNumbers,
  };

  return (
    <div className="w-full flex flex-col  gap-4 rounded-[10px]">
      <div className="flex ProductTransport_Details gap-4 w-full">
        {/* Transport Information */}
        <div className="flex flex-col bg-[#fefefe] shadow-md rounded-[10px] p-3 sm:p-4 w-full xl:w-[50%]">
          <h2 className="font-montserrat font-normal text-[12px] sm:text-[14px] mb-2 text-[#2b2b2b]">
            Transporter Info
          </h2>
          <div className="flex flex-col gap-2 items-center justify-center">
            <Image
              src={t.avatar}
              alt={companyName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10 sm:w-12 sm:h-12"
            />
            <span className="font-montserrat font-normal text-[13px] sm:text-[14px] text-[#2b2b2b] text-center">
              {companyName}
            </span>
            {t.company !== NA && t.company !== t.name && (
              <span className="font-montserrat font-normal text-[11px] text-[#808080] text-center">
                {t.company}
              </span>
            )}
            <Stars rating={t.rating} />
            <div className="flex flex-col items-center gap-1">
              <button className="border-[1px] border-[#808080] text-[#2b2b2b] font-montserrat font-medium text-[11px] sm:text-[12px] px-4 sm:px-6 py-1.5 sm:py-2 rounded-[50px] cursor-pointer">
                Follow
              </button>
              <span className="font-montserrat font-normal text-[10px] sm:text-[11px] text-[#2b2b2b]">
                {t.followers} {t.followers === 1 ? "Follower" : "Followers"}
              </span>
            </div>
            {t.location !== NA && (
              <span className="font-montserrat font-normal text-[10px] sm:text-[12px] text-[#2b2b2b]">
                {t.location}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 p-2 bg-[#cce5cc] rounded-full cursor-pointer">
                <MessageFill />
              </div>
              <button
                type="button"
                aria-label="Call transporter"
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 p-2 bg-[#cce5cc] rounded-full cursor-pointer"
                onClick={openModal}
              >
                <PhoneCallFill />
              </button>
            </div>
            {t.yearsOfService > 0 && (
              <div className="flex items-center gap-0.5">
                <AwardIcon />
                <span className="font-montserrat font-normal text-center text-[10px] sm:text-[11px] text-[#2b2b2b]">
                  {t.yearsOfService}{" "}
                  {t.yearsOfService === 1 ? "year" : "years"} of transportation
                  service
                </span>
              </div>
            )}
            {t.ratingLabel !== NA && (
              <span className="font-montserrat font-normal text-[10px] sm:text-[12px] text-[#2b2b2b]">
                Rating: {t.ratingLabel}
              </span>
            )}
          </div>
        </div>

        {/* Packaged Products Table */}
        <PackagedTable packages={order.packages} />
      </div>
      <TransportCallDetails
        isOpen={isModalOpen}
        onClose={closeModal}
        modalDetails={modalDetails}
        copiedStates={copiedStates}
        handleCopy={handleCopy}
      />
    </div>
  );
};
