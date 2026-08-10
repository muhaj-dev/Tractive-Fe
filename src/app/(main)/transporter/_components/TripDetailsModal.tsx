"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PhoneCall, TickIcon, XModalIcon } from "./Icons/TransporterIcons";
import {
  useFleetTripTracking,
  useUpdateFleetTripStatus,
} from "@/hooks/queries/useTransporterQueries";
import {
  FleetTripBuyer,
  FleetTripPackage,
  FleetTripStatus,
  FleetTripSummary,
  FleetTripTracking,
  UpdateFleetTripStatusPayload,
} from "@/services/fleetTripService";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  buyerImage,
  findTimelineDate,
  formatDate,
  isReached,
  normalizeTripStatus,
  tripEffectiveStatus,
  tripCurrentCoords,
  tripRoute,
} from "./tripHelpers";

/* --- Map + lifecycle timeline (matches DummyTrackingPanel) --------------- */

const TripMapTimeline: React.FC<{
  data: FleetTripTracking;
  compact?: boolean;
}> = ({ data, compact }) => {
  const status = tripEffectiveStatus(data);
  const picked = isReached(status, "picked");
  const onTransit = isReached(status, "on_transit");
  const delivered = isReached(status, "delivered");
  const coords = tripCurrentCoords(data);
  const { from, to } = tripRoute(data);

  return (
    <div className="w-full h-fit flex flex-col gap-4 bg-[#fefefe] rounded-[10px] shadow-md">
      <div className="relative">
        <Image
          src="/images/trackingMap.png"
          alt="Map"
          width={699}
          height={508}
          className={`object-cover w-full h-auto rounded-t-[10px] ${
            compact ? "max-h-[220px]" : "max-h-[400px] sm:max-h-[500px]"
          }`}
        />
        {coords && (
          <span className="absolute bottom-2 left-2 bg-[#2b2b2bcc] text-[#fefefe] font-montserrat text-[10px] px-2 py-1 rounded-[4px]">
            📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        )}
      </div>

      <div className="relative w-[100%] mx-auto h-[50px] sm:h-[60px]">
        <div className="absolute top-[0.5rem] left-[10%] right-[55%] h-[2px] timeline_dashed_line_m1 border-dashed border-[1px] border-[#808080]" />
        <div className="absolute top-[0.5rem] left-[45%] right-[10%] h-[2px] timeline_dashed_line_m2 border-dashed border-[1px] border-[#808080]" />
        <div className="absolute left-[3%] Picked_Date top-0 flex flex-col gap-1 justify-center items-center">
          <div
            className={`flex items-center p-[3px] justify-center rounded-full ${
              picked
                ? "bg-[#538e53] text-[#fefefe]"
                : "bg-[#fefefe] border-[1px] border-[#808080] text-[#fefefe]"
            } w-4 h-4 z-10`}
          >
            {picked && <TickIcon />}
          </div>
          <div className="flex flex-col items-center">
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              Picked
            </span>
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {formatDate(findTimelineDate(data, "picked"))}
            </span>
          </div>
        </div>
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 flex flex-col gap-1 justify-center items-center">
          <div
            className={`flex items-center p-[3px] justify-center rounded-full ${
              onTransit
                ? "bg-[#538e53] text-[#fefefe]"
                : "bg-[#fefefe] border-[1px] border-[#808080] text-[#fefefe]"
            } w-4 h-4 z-10`}
          >
            {onTransit && <TickIcon />}
          </div>
          <div className="flex flex-col items-center">
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              On Transit
            </span>
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {formatDate(findTimelineDate(data, "on_transit"))}
            </span>
          </div>
        </div>
        <div className="absolute right-[2%] deliveredEST_Date top-0 flex flex-col gap-1 justify-center items-center">
          <div
            className={`flex items-center p-[3px] justify-center rounded-full ${
              delivered
                ? "bg-[#538e53] text-[#fefefe]"
                : "bg-[#fefefe] border-[1px] border-[#808080] text-[#fefefe]"
            } w-4 h-4 z-10`}
          >
            {delivered && <TickIcon />}
          </div>
          <div className="flex flex-col items-center">
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              Delivered
            </span>
            <span className="font-montserrat font-medium text-[10px] sm:text-[11px] text-[#2b2b2b]">
              {delivered
                ? formatDate(findTimelineDate(data, "delivered"))
                : `EST ${formatDate(data.estDeliveryDate)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4 pb-4">
        <span className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#2b2b2b]">
          From: {from}
        </span>
        <span className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#2b2b2b]">
          To: {to}
        </span>
      </div>
    </div>
  );
};

/* --- Buyers card (matches DummyTrackingPanel buyer info) ----------------- */

const BuyerEntry: React.FC<{ buyer: FleetTripBuyer }> = ({ buyer }) => (
  <div className="flex flex-col gap-2 items-center justify-center">
    <Image
      src={buyerImage(buyer)}
      alt={buyer.name || "Buyer avatar"}
      width={40}
      height={40}
      className="rounded-full object-cover w-10 h-10 sm:w-12 sm:h-12"
    />
    <span className="font-montserrat font-normal text-[13px] sm:text-[14px] text-[#2b2b2b] text-center">
      {buyer.businessName || buyer.name || "—"}
    </span>
    {buyer.state && (
      <span className="font-montserrat font-normal text-[13px] sm:text-[14px] text-[#2b2b2b] text-center">
        {buyer.state}
      </span>
    )}
    {buyer.phone && (
      <div className="flex items-center gap-2">
        <PhoneCall className="w-[15px] h-[15px]" />
        <span className="font-montserrat font-normal text-center text-[14px] text-[#2b2b2b]">
          {buyer.phone}
        </span>
      </div>
    )}
    {buyer.address && (
      <span className="font-montserrat font-normal text-[13px] sm:text-[14px] text-[#2b2b2b] text-center">
        {buyer.address}
      </span>
    )}
  </div>
);

const BuyersInfo: React.FC<{ buyers: FleetTripBuyer[] }> = ({ buyers }) => (
  <div className="flex flex-col bg-[#fefefe] shadow-md rounded-[10px] p-3 sm:p-4 w-full">
    <h2 className="font-montserrat font-normal text-[12px] sm:text-[14px] mb-2 text-[#2b2b2b]">
      Buyers Information
    </h2>
    {buyers.length === 0 ? (
      <p className="font-montserrat text-[12px] text-[#808080] py-3 text-center">
        No buyers on this trip.
      </p>
    ) : buyers.length === 1 ? (
      <BuyerEntry buyer={buyers[0]} />
    ) : (
      <div className="flex flex-col gap-4 divide-y divide-[#e0e0e0]">
        {buyers.map((b, i) => (
          <div key={b._id || b.id || i} className={i === 0 ? "" : "pt-4"}>
            <BuyerEntry buyer={b} />
          </div>
        ))}
      </div>
    )}
  </div>
);

/* --- Packages table (matches DummyTrackingPanel single-column table) ----- */

const PackagesTable: React.FC<{ packages: FleetTripPackage[] }> = ({
  packages,
}) => (
  <div className="w-full bg-[#fefefe] shadow-md rounded-[8px] overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-[100%] border-separate border-spacing-y-3 sm:border-spacing-y-0">
        <thead>
          <tr className="bg-[#fefefe] border-b border-[#e0e0e0]">
            <th
              scope="col"
              className="px-3 py-1 sm:px-2 sm:py-2 text-left font-montserrat font-normal text-[11px] sm:text-[12px] text-[#2b2b2b] border-b-[1px] border-[#e0e0e0]"
            >
              Package
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-center font-montserrat text-[11px] text-[#808080]">
                No packages
              </td>
            </tr>
          ) : (
            packages.map((pkg, i) => {
              const id = (pkg.productId ||
                pkg._id ||
                pkg.id ||
                `pkg-${i}`) as string;
              return (
                <tr
                  key={id}
                  className="bg-[#fefefe] border-b border-[#e0e0e0]"
                >
                  <td className="px-3 py-1 sm:px-2 sm:py-2 text-[10px] sm:text-[11px] font-montserrat font-normal">
                    <div className="flex items-center gap-2">
                      <Image
                        src={pkg.image || "/images/foodTracked.png"}
                        alt={pkg.name || "Package"}
                        width={40}
                        height={24}
                        className="object-cover w-[79px] h-[43px] rounded-[7px]"
                      />
                      <div className="flex flex-col">
                        <span className="truncate text-[12px] sm:text-[13px] font-normal font-montserrat text-[#2b2b2b]">
                          {pkg.name || "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);

/* --- Status update form (PATCH /status) --------------------------------- */

/** ISO timestamp → the `YYYY-MM-DDTHH:mm` shape `datetime-local` requires. */
const toLocalInputValue = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const StatusUpdateForm: React.FC<{
  tripId: string;
  status?: FleetTripStatus;
  trip?: FleetTripSummary;
}> = ({ tripId, status, trip }) => {
  const current = normalizeTripStatus(status);
  const done = current === "delivered" || current === "cancelled";

  const targetOptions = useMemo<FleetTripStatus[]>(() => {
    const idx = STATUS_ORDER.indexOf(current);
    const forward = idx >= 0 ? STATUS_ORDER.slice(idx + 1) : [];
    return [...forward, "cancelled" as FleetTripStatus];
  }, [current]);

  const [target, setTarget] = useState<FleetTripStatus>(targetOptions[0]);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);

  // Origin/destination and ETA are trip-level, so seed them from the trip and
  // let the transporter correct a wrong route or slipping ETA in the same PATCH.
  const tripOrigin = (trip?.origin || trip?.fromLocation || "") as string;
  const tripDestination = (trip?.destination || trip?.toLocation || "") as string;

  const [origin, setOrigin] = useState(tripOrigin);
  const [destination, setDestination] = useState(tripDestination);
  const [estDeliveryDate, setEstDeliveryDate] = useState(
    toLocalInputValue(trip?.estDeliveryDate),
  );

  useEffect(() => {
    setTarget(targetOptions[0]);
  }, [targetOptions]);

  useEffect(() => {
    setOrigin(tripOrigin);
    setDestination(tripDestination);
    setEstDeliveryDate(toLocalInputValue(trip?.estDeliveryDate));
  }, [tripOrigin, tripDestination, trip?.estDeliveryDate]);

  const { mutate: updateStatus, isPending } = useUpdateFleetTripStatus();

  const captureLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Current location captured");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get current location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = () => {
    if (!target) return;
    const payload: UpdateFleetTripStatusPayload = { status: target };
    if (location.trim()) payload.location = location.trim();
    if (note.trim()) payload.note = note.trim();
    if (origin.trim()) payload.origin = origin.trim();
    if (destination.trim()) payload.destination = destination.trim();
    if (coords) {
      payload.lat = coords.lat;
      payload.lng = coords.lng;
    }
    if (estDeliveryDate) {
      const d = new Date(estDeliveryDate);
      if (!Number.isNaN(d.getTime())) payload.estDeliveryDate = d.toISOString();
    }
    updateStatus({ tripId, payload });
  };

  if (done) {
    return (
      <div className="w-full bg-[#fefefe] shadow-md rounded-[10px] p-3 sm:p-4">
        <p className="font-montserrat text-[12px] text-[#808080]">
          This trip is{" "}
          <span className="font-medium text-[#2b2b2b]">
            {STATUS_LABELS[current].toLowerCase()}
          </span>{" "}
          — no further status changes are available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fefefe] shadow-md rounded-[10px] p-3 sm:p-4 flex flex-col gap-3">
      <h2 className="font-montserrat font-medium text-[13px] sm:text-[14px] text-[#2b2b2b]">
        Update Trip Status
      </h2>

      <div className="flex flex-col gap-1">
        <label className="font-montserrat text-[11px] text-[#808080]">
          New status
        </label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as FleetTripStatus)}
          className="border border-gray-300 rounded-md px-3 py-2 text-[13px] font-montserrat bg-white focus:outline-none focus:border-[#538e53] cursor-pointer"
        >
          {targetOptions.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-montserrat text-[11px] text-[#808080]">
          Location label{" "}
          <span className="text-[#a0a0a0]">(optional)</span>
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Ibadan toll gate"
          className="border border-gray-300 rounded-md px-3 py-2 text-[13px] font-montserrat focus:outline-none focus:border-[#538e53]"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-montserrat text-[11px] text-[#808080]">
            Origin <span className="text-[#a0a0a0]">(optional)</span>
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Kaduna"
            className="border border-gray-300 rounded-md px-3 py-2 text-[13px] font-montserrat focus:outline-none focus:border-[#538e53]"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-montserrat text-[11px] text-[#808080]">
            Destination <span className="text-[#a0a0a0]">(optional)</span>
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Lagos"
            className="border border-gray-300 rounded-md px-3 py-2 text-[13px] font-montserrat focus:outline-none focus:border-[#538e53]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-montserrat text-[11px] text-[#808080]">
          Estimated delivery date{" "}
          <span className="text-[#a0a0a0]">(optional)</span>
        </label>
        <input
          type="datetime-local"
          value={estDeliveryDate}
          onChange={(e) => setEstDeliveryDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-[13px] font-montserrat focus:outline-none focus:border-[#538e53] cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-montserrat text-[11px] text-[#808080]">
          Note <span className="text-[#a0a0a0]">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. Vehicle departed and is on schedule"
          className="border border-gray-300 rounded-md px-3 py-2 text-[13px] font-montserrat resize-none focus:outline-none focus:border-[#538e53]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-montserrat text-[11px] text-[#808080]">
          GPS coordinates <span className="text-[#a0a0a0]">(optional)</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={captureLocation}
            disabled={locating}
            className="cursor-pointer px-3 py-2 text-[12px] font-montserrat text-[#538e53] border border-[#538e53] rounded-md hover:bg-[#f3f9f3] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {locating ? "Locating…" : "📍 Use my current location"}
          </button>
          {coords && (
            <span className="font-montserrat text-[12px] text-[#2b2b2b]">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              <button
                type="button"
                onClick={() => setCoords(null)}
                className="cursor-pointer ml-2 text-[#b91c1c] underline"
              >
                clear
              </button>
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="cursor-pointer self-end px-5 py-2 text-[13px] font-montserrat text-[#fefefe] bg-[#538e53] rounded-md hover:bg-[#467a46] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Updating…" : `Mark as ${STATUS_LABELS[target]}`}
      </button>
    </div>
  );
};

/* --- Composed details (mirrors DummyTrackingPanel layout) ---------------- */

interface TripTrackingDetailsProps {
  tracking?: FleetTripTracking;
  summary?: FleetTripSummary;
  isLoading?: boolean;
  /** "modal" tightens the map height for the dialog layout. */
  variant?: "panel" | "modal";
}

/**
 * Trip-tracking details display — exactly mirrors the DummyTrackingPanel
 * layout (map + timeline + From/To, then buyer info card alongside a
 * single-column packages table). The status-update form below drives the
 * PATCH /status endpoint with optional location + lat/lng.
 */
export const TripTrackingDetails: React.FC<TripTrackingDetailsProps> = ({
  tracking,
  summary,
  isLoading,
  variant = "panel",
}) => {
  const data = useMemo<FleetTripTracking>(
    () => ({
      ...(summary || {}),
      ...(tracking?.trip || {}),
      ...(tracking || {}),
    }),
    [summary, tracking],
  );

  const tripId = (data._id || data.id || data.tripId || "") as string;
  const hasData = !!tripId;

  if (!hasData && isLoading) {
    return (
      <div className="w-full flex items-center justify-center bg-[#fefefe] rounded-[10px] shadow-md py-16">
        <div className="animate-spin h-8 w-8 border-4 border-[#538e53] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="w-full flex items-center justify-center bg-[#fefefe] rounded-[10px] shadow-md py-16 font-montserrat text-sm text-[#808080]">
        Trip details are unavailable.
      </div>
    );
  }

  return (
    <>
      <TripMapTimeline data={data} compact={variant === "modal"} />

      <div className="w-full flex flex-col gap-4 rounded-[8px]">
        <div className="flex ProductBuyer_Details gap-4 w-full">
          <BuyersInfo buyers={data.buyers ?? []} />
          <PackagesTable packages={data.packages ?? []} />
        </div>
      </div>

      {/* Effective status, not the raw one: the backend leaves `status` on
          "loaded" after a pick and only advances `transportStatus`. Reading the
          raw field made the form offer "Mark as Picked" on an already-picked
          trip, which re-sent the status it was already in. */}
      <StatusUpdateForm
        tripId={tripId}
        status={tripEffectiveStatus(data)}
        trip={data}
      />
    </>
  );
};

/* --- Modal -------------------------------------------------------------- */

interface TripDetailsModalProps {
  tripId: string;
  /** List-row summary, shown immediately while the tracking detail loads. */
  summary?: FleetTripSummary;
  onClose: () => void;
}

/**
 * Tablet/mobile trip-details dialog. On desktop the same content renders
 * inline as a side panel; on smaller screens it surfaces here as a modal.
 */
export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  tripId,
  summary,
  onClose,
}) => {
  const { data: tracking, isLoading } = useFleetTripTracking(tripId, {
    refetchInterval: 5 * 60 * 1000, // poll tracking every 5 minutes
  });

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
          className="relative bg-[#f1f1f1] rounded-lg w-full max-w-[680px] max-h-[92vh] overflow-y-auto my-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#fefefe] px-4 py-3 border-b border-[#e0e0e0] rounded-t-lg">
            <h2 className="font-montserrat font-medium text-[15px] sm:text-[16px] text-[#2b2b2b]">
              Trip Details
            </h2>
            <button
              onClick={onClose}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <XModalIcon />
            </button>
          </div>
          <div className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
            <TripTrackingDetails
              tracking={tracking}
              summary={summary}
              isLoading={isLoading}
              variant="modal"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
