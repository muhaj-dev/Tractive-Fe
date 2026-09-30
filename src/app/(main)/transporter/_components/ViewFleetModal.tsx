"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { XModalIcon } from "./Icons/TransporterIcons";
import { Fleet } from "@/utils/Fleet";
import { useModalA11y } from "@/hooks/useModalA11y";

interface ViewFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: Fleet | null;
}

export const ViewFleetModal: React.FC<ViewFleetModalProps> = ({
  isOpen,
  onClose,
  fleet,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useModalA11y(isOpen && !!fleet, modalRef, { onEscape: onClose });

  if (!fleet) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#2b2b2bbc] flex items-center justify-center z-50 p-4"
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-fleet-title"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-[#fefefe] rounded-lg w-full max-w-[500px] overflow-y-auto max-h-[90vh] p-6"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-[1.2rem] right-[1.2rem] cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <XModalIcon />
            </button>

            <h2
              id="view-fleet-title"
              className="text-[18px] pt-1 font-semibold text-center text-[#2b2b2b] font-montserrat mb-6"
            >
              Fleet Details
            </h2>

            {/* Images section */}
            <div className="w-full flex gap-3 overflow-x-auto pb-4 mb-4 select-none snap-x">
              {fleet.images && fleet.images.length > 0 ? (
                fleet.images.map((imgUrl, i) => (
                  <div key={i} className="relative min-w-[120px] h-[90px] rounded-lg overflow-hidden border border-gray-200 snap-center shadow-sm">
                    <Image
                      src={imgUrl}
                      alt={`${fleet.name} image ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="relative min-w-[120px] h-[90px] rounded-lg overflow-hidden border border-gray-200 bg-[#f1f1f1] flex items-center justify-center shadow-sm">
                   <Image
                      src={fleet.image || "/images/truckcontainer.png"}
                      alt={fleet.name}
                      fill
                      className="object-contain p-2"
                    />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {/* Fleet Name */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Fleet Name</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">{fleet.name}</span>
              </div>

              {/* Fleet Number */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Plate Number</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">{fleet.fleetNumber || 'N/A'}</span>
              </div>

              {/* IOT Tracking */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">IOT Tracking</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">{fleet.IOT}</span>
              </div>

              {/* Model */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Model</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">{fleet.model || 'N/A'}</span>
              </div>

              {/* Size / Capacity */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Capacity</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">{fleet.size || 'N/A'}</span>
              </div>

               {/* Route */}
               <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Route</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">{fleet.route}</span>
              </div>

              {/* Price */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Price</span>
                <span className="text-[14px] text-[#538e53] font-semibold font-montserrat">₦{fleet.price.toLocaleString()}</span>
              </div>

              {/* Price Negotiable */}
              <div className="flex flex-col">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Negotiable</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat">
                  {fleet.priceNegotiation !== undefined ? (fleet.priceNegotiation ? "Yes" : "No") : 'N/A'}
                </span>
              </div>

              {/* Status */}
              <div className="flex flex-col col-span-2">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Status</span>
                <span className="text-[14px] text-[#2b2b2b] font-medium font-montserrat capitalize">{fleet.status}</span>
              </div>

              {/* Description */}
              <div className="flex flex-col col-span-2">
                <span className="text-[12px] text-[#808080] font-montserrat mb-1 border-b border-gray-100 pb-1">Description</span>
                <span className="text-[13px] text-[#2b2b2b] font-normal leading-relaxed font-montserrat bg-[#f9f9f9] p-3 rounded-md border border-gray-100 mt-1">
                  {fleet.fleetDescription || 'No description provided.'}
                </span>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={onClose}
                className="bg-[#538e53] hover:bg-[#467a46] transition-colors text-white font-montserrat font-medium py-2 px-10 rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
