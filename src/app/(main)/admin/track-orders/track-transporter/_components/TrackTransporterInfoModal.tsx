"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useModalA11y } from "@/hooks/useModalA11y";
import { XModalIcon } from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import {
  FleetTripBuyer,
  FleetTripSummary,
} from "@/services/fleetTripService";
import {
  buyerImage,
  tripFleetIot,
  tripFleetImage,
  tripFleetName,
  tripRoute,
  tripTransporterImage,
  tripTransporterName,
  tripTransporterObject,
} from "@/app/(main)/transporter/_components/tripHelpers";

export type TripInfoMode = "buyer" | "transporter";

interface TrackTransporterInfoModalProps {
  trip: FleetTripSummary;
  mode: TripInfoMode;
  onClose: () => void;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="font-montserrat text-[11px] text-[#808080]">{label}</span>
    <span className="font-montserrat text-[13px] text-[#2b2b2b] break-words">
      {value && value.trim() ? value : "—"}
    </span>
  </div>
);

const BuyerCard: React.FC<{ buyer: FleetTripBuyer }> = ({ buyer }) => (
  <div className="flex flex-col gap-3 rounded-[10px] border border-[#e0e0e0] p-4">
    <div className="flex items-center gap-3">
      <Image
        src={buyerImage(buyer)}
        alt={buyer.name || "Buyer"}
        width={44}
        height={44}
        className="w-11 h-11 rounded-full object-cover"
      />
      <span className="font-montserrat text-[14px] font-medium text-[#2b2b2b]">
        {buyer.businessName || buyer.name || "—"}
      </span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Name" value={buyer.name} />
      <Field label="Phone" value={buyer.phone} />
      <Field label="State" value={buyer.state} />
      <Field label="Email" value={buyer.email} />
      <Field label="Address" value={buyer.address} />
    </div>
  </div>
);

/**
 * Read-only details dialog for the admin track-transporter page. Renders either
 * the trip's buyer(s) or the transporter + fleet, straight from the already
 * loaded `FleetTripSummary` (no extra fetch). The full trip-tracking view is a
 * separate dialog (`TripDetailsModal`).
 */
export const TrackTransporterInfoModal: React.FC<
  TrackTransporterInfoModalProps
> = ({ trip, mode, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  // Focus was left on the page behind: the dialog opened but a keyboard user
  // stayed outside it. Escape is already handled below, so no onEscape here.
  useModalA11y(true, panelRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const buyers = trip.buyers ?? [];
  const transporter = tripTransporterObject(trip);
  const { from, to } = tripRoute(trip);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#2b2b2bbc] flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-transporter-info-title"
          className="relative bg-[#fefefe] rounded-lg w-full max-w-[520px] max-h-[92vh] overflow-y-auto my-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#fefefe] px-4 py-3 border-b border-[#e0e0e0] rounded-t-lg">
            <h2
              id="track-transporter-info-title"
              className="font-montserrat font-medium text-[15px] sm:text-[16px] text-[#2b2b2b]"
            >
              {mode === "buyer" ? "Buyer Information" : "Transporter Information"}
            </h2>
            <button
              onClick={onClose}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <XModalIcon />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {mode === "buyer" ? (
              buyers.length === 0 ? (
                <p className="font-montserrat text-[13px] text-[#808080] py-6 text-center">
                  No buyer information on this trip.
                </p>
              ) : (
                buyers.map((b, i) => (
                  <BuyerCard key={b._id || b.id || i} buyer={b} />
                ))
              )
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {tripTransporterImage(trip) ? (
                    <Image
                      src={tripTransporterImage(trip)}
                      alt={tripTransporterName(trip)}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-montserrat font-bold text-[#2b2b2b]">
                      {tripTransporterName(trip).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-montserrat text-[15px] font-medium text-[#2b2b2b]">
                    {tripTransporterName(trip)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Contact name" value={transporter?.name} />
                  <Field label="Phone" value={transporter?.phone} />
                  <Field label="Email" value={transporter?.email} />
                  <Field
                    label="Location"
                    value={transporter?.state || transporter?.address}
                  />
                </div>

                <div className="rounded-[10px] border border-[#e0e0e0] p-4 flex flex-col gap-3">
                  <span className="font-montserrat text-[13px] font-medium text-[#2b2b2b]">
                    Fleet
                  </span>
                  <div className="flex items-center gap-3">
                    <Image
                      src={tripFleetImage(trip)}
                      alt={tripFleetName(trip)}
                      width={64}
                      height={40}
                      className="w-16 h-10 rounded-[6px] object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="font-montserrat text-[13px] text-[#2b2b2b]">
                        {tripFleetName(trip)}
                      </span>
                      <span className="font-montserrat text-[11px] text-[#808080]">
                        IOT: {tripFleetIot(trip)}
                      </span>
                    </div>
                  </div>
                  <Field label="Route" value={`${from} → ${to}`} />
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
