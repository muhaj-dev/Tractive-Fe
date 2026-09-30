import React, { useRef } from "react";
import Image from "next/image";
import { CopyIcon, XIcon } from "@/icons/Icon1";
import { StarIcon, YellowStarIcon } from "@/icons/Icons";
import { useModalA11y } from "@/hooks/useModalA11y";


type TransportCallDetailsProps = {
  isOpen: boolean;
  onClose: () => void;
  modalDetails: {
    company: string;
    logoSrc: string;
    logoAlt: string;
    logoWidth: number;
    logoHeight: number;
    rating: string;
    phoneNumbers: string[];
  };
  copiedStates: { [key: string]: boolean };
  handleCopy: (number: string) => void;
};

export const TransportCallDetails = ({
  isOpen,
  onClose,
  modalDetails,
  copiedStates,
  handleCopy,
}: TransportCallDetailsProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, { onEscape: onClose });

  if (!isOpen) return null;

  const {
    company,
    logoSrc,
    logoAlt,
    logoWidth,
    logoHeight,
    rating,
    phoneNumbers,
  } = modalDetails;

  return (
    <div className="fixed inset-0 bg-[#2b2b2b94] bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={company ? `${company} contact details` : "Transporter contact details"}
        className="bg-[#fefefe] flex flex-col items-center justify-center gap-4 rounded-[10px] p-6 w-[90%] max-w-[400px] relative"
      >
        <button
          className="absolute top-2 right-2 text-[#2b2b2b] text-[20px] cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon />
        </button>
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={logoWidth}
          height={logoHeight}
          className="object-cover"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="font-montserrat font-normal text-[14px] text-[#2b2b2b]">
              {company}
            </p>

            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) =>
                  i < Math.round(Number(rating) || 0) ? (
                    <YellowStarIcon key={i} />
                  ) : (
                    <StarIcon key={i} />
                  ),
                )}
              </div>
              <span className="font-montserrat font-medium text-[12px] text-[#2b2b2b]">
                {rating}
              </span>
            </div>
          </div>
          <div className="flex items-start justify-center gap-8 w-full">
            {phoneNumbers.length === 0 && (
              <span className="font-montserrat font-normal text-[12px] text-[#808080]">
                No contact number available
              </span>
            )}
            {phoneNumbers.map((number) => (
              <div
                key={number}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleCopy(number)}
              >
                {copiedStates[number] ? (
                  <span className="font-montserrat font-normal text-[12px] text-[#538e53]">
                    Copied!
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <CopyIcon />
                    <span className="font-montserrat font-normal text-[13px] text-[#2b2b2b]">
                      {number}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
