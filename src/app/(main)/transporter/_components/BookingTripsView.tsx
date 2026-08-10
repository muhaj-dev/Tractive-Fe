"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, StarIcon, YellowStarIcon } from "@/icons/Icons";
import { TickIcon } from "./Icons/TransporterIcons";
import { CreateFleetTripModal } from "./CreateFleetTripModal";
import { TripDetailsModal, TripTrackingDetails } from "./TripDetailsModal";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useFleetTrips,
  useFleetTripTracking,
  useUpdateFleetTripStatus,
} from "@/hooks/queries/useTransporterQueries";
import { FleetTripSummary } from "@/services/fleetTripService";
import {
  BookingTabKey,
  NEXT_STATUS,
  TABS,
  TAB_TO_STATUS,
  isReached,
  tripEffectiveStatus,
  tripFleetIot,
  tripFleetImage,
  tripFleetName,
  tripPrimaryPackage,
  tripTransporterImage,
  tripTransporterName,
  tripTransporterRating,
} from "./tripHelpers";

interface BookingTripsViewProps {
  defaultTab: BookingTabKey;
}

const tripId = (trip: FleetTripSummary): string =>
  (trip._id || trip.id || "") as string;


/** Five-star row with the numeric rating, matching the reference design. */
const TripStars: React.FC<{ rating: number }> = ({ rating }) => (
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
    <span className="font-montserrat font-medium text-[10px] sm:text-[12px] text-[#2b2b2b]">
      {rating.toFixed(1)}
    </span>
  </div>
);

/** Transporter logo, or a branded initials box when there's no image. */
const TransporterLogo: React.FC<{ src: string; name: string }> = ({
  src,
  name,
}) =>
  src ? (
    <Image
      src={src}
      alt={name}
      width={50}
      height={35}
      className="object-cover rounded-[4px] w-10 h-7 sm:w-12 sm:h-8"
    />
  ) : (
    <div className="flex items-center justify-center w-10 h-7 sm:w-12 sm:h-8 rounded-[4px] bg-[#538e53]">
      <span className="font-montserrat font-bold text-[12px] text-[#fefefe]">
        {name.trim().charAt(0).toUpperCase() || "T"}
      </span>
    </div>
  );

interface TripCardProps {
  trip: FleetTripSummary;
  selected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
  isAdvancing: boolean;
}

const TripCard: React.FC<TripCardProps> = ({
  trip,
  selected,
  onSelect,
  onAdvance,
  isAdvancing,
}) => {
  const status = tripEffectiveStatus(trip);
  const next = NEXT_STATUS[status];
  const picked = isReached(status, "picked");
  const onTransit = isReached(status, "on_transit");
  const delivered = isReached(status, "delivered");
  const pkg = tripPrimaryPackage(trip);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left flex flex-col gap-3 border-[2px] p-3 sm:p-4 rounded-[10px] transition-colors cursor-pointer ${
        selected ? "border-[#538e53]" : "border-gray-200 hover:border-[#a8c9a8]"
      }`}
    >
      <div className="flex flex-col border-[1px] p-3 sm:p-4 rounded-[10px] border-[#538e53]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <TransporterLogo
              src={tripTransporterImage(trip)}
              name={tripTransporterName(trip)}
            />
            <div className="flex flex-col">
              <span className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#2b2b2b] truncate">
                {tripTransporterName(trip)}
              </span>
              <TripStars rating={tripTransporterRating(trip)} />
            </div>
          </div>
          {next && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (!isAdvancing) onAdvance();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isAdvancing) {
                  e.stopPropagation();
                  onAdvance();
                }
              }}
              aria-disabled={isAdvancing}
              className={`cursor-pointer flex items-center gap-[7px] px-4 sm:px-6 py-2 opacity-[0.9] bg-[#538e53] text-[#f9f9f9] text-[12px] sm:text-[13px] lg:text-[14px] font-normal rounded-[4px] transition-colors hover:bg-[#467a46] ${
                isAdvancing ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {isAdvancing ? "Updating…" : `Mark ${next.label}`}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-[100%] mx-auto h-[40px] sm:h-[50px]">
        <div className="absolute top-[0.5rem] left-[10%] right-[55%] h-[2px] timeline_dashed_line_1 border-dashed border-[1px] border-[#808080]" />
        <div className="absolute top-[0.5rem] left-[45%] right-[10%] h-[2px] timeline_dashed_line_2 border-dashed border-[1px] border-[#808080]" />
        <div className="absolute left-[5%] top-0 flex flex-col gap-1 justify-center items-center">
          <div
            className={`flex items-center p-[3px] justify-center rounded-full ${
              picked
                ? "bg-[#538e53] text-[#fefefe]"
                : "bg-[#fefefe] border-[1px] border-[#808080] text-[#fefefe]"
            } w-4 h-4 z-10`}
          >
            {picked && <TickIcon />}
          </div>
          <span className="font-montserrat font-medium text-[10px] sm:text-[12px] text-[#2b2b2b]">
            Picked
          </span>
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
          <span className="font-montserrat font-medium text-[10px] sm:text-[12px] text-[#2b2b2b]">
            On Transit
          </span>
        </div>
        <div className="absolute right-[5%] top-0 flex flex-col gap-1 justify-center items-center">
          <div
            className={`flex items-center p-[3px] justify-center rounded-full ${
              delivered
                ? "bg-[#538e53] text-[#fefefe]"
                : "bg-[#fefefe] border-[1px] border-[#808080] text-[#fefefe]"
            } w-4 h-4 z-10`}
          >
            {delivered && <TickIcon />}
          </div>
          <span className="font-montserrat font-medium text-[10px] sm:text-[12px] text-[#2b2b2b]">
            Delivered
          </span>
        </div>
      </div>

      <div className="flex flex-col border-[1px] p-3 sm:p-4 rounded-[10px] border-[#538e53]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0">
            <div className="flex items-center justify-center w-12 h-8 sm:w-16 sm:h-10 p-2 bg-[#CCE5CC] rounded-[4px]">
              <Image
                src={tripFleetImage(trip)}
                alt="Fleet"
                width={40}
                height={40}
                className="object-cover w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-montserrat font-medium text-[12px] text-[#2b2b2b] truncate">
                {tripFleetName(trip)}
              </span>
              <p className="font-montserrat font-medium text-[12px] text-[#808080] truncate">
                IOT: {tripFleetIot(trip)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0">
            <div className="flex items-center justify-center w-12 h-8 sm:w-16 sm:h-10 p-2 bg-[#CCE5CC] rounded-[4px]">
              <Image
                src={pkg.image}
                alt={pkg.name}
                width={50}
                height={30}
                className="object-cover w-10 h-6 sm:w-12 sm:h-8 rounded-[2px]"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-montserrat font-medium text-[12px] text-[#2b2b2b] truncate">
                {pkg.name}
              </span>
              <p className="font-montserrat font-medium text-[12px] text-[#808080] truncate">
                ID: {pkg.id.slice(0, 10)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

/** Desktop side panel — fetches the tracking detail for the selected trip. */
const TrackingPanel: React.FC<{
  selectedTripId: string;
  summary?: FleetTripSummary;
}> = ({ selectedTripId, summary }) => {
  const { data: tracking, isLoading } = useFleetTripTracking(selectedTripId, {
    refetchInterval: 5 * 60 * 1000, // poll tracking every 5 minutes
  });
  return (
    <TripTrackingDetails
      tracking={tracking}
      summary={summary}
      isLoading={isLoading}
      variant="panel"
    />
  );
};

interface ConfirmAdvanceModalProps {
  trip: FleetTripSummary;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation step before a trip's status is advanced via "Mark …". */
const ConfirmAdvanceModal: React.FC<ConfirmAdvanceModalProps> = ({
  trip,
  isPending,
  onConfirm,
  onClose,
}) => {
  const next = NEXT_STATUS[tripEffectiveStatus(trip)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, isPending]);

  if (!next) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isPending && onClose()}
        className="fixed inset-0 bg-[#2b2b2bbc] flex items-center justify-center z-[60] p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[#fefefe] rounded-lg w-full max-w-[400px] p-6 flex flex-col gap-4"
        >
          <h2 className="text-[17px] font-semibold text-center text-[#2b2b2b] font-montserrat">
            Mark as {next.label}?
          </h2>
          <p className="text-[12px] sm:text-[13px] text-center text-[#808080] font-montserrat">
            This updates <span className="text-[#2b2b2b]">{tripFleetName(trip)}</span> to{" "}
            <span className="text-[#2b2b2b]">{next.label}</span>.{" "}
            {next.to === "delivered"
              ? "The buyer will then be able to confirm receipt."
              : "This action moves the trip forward and can't be undone."}
          </p>
          <div className="flex justify-center gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer px-4 py-2 text-sm font-montserrat text-[#2b2b2b] border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="cursor-pointer px-4 py-2 text-sm font-montserrat text-[#fefefe] bg-[#538e53] rounded-md hover:bg-[#467a46] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Updating…" : `Yes, mark ${next.label}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const BookingTripsView: React.FC<BookingTripsViewProps> = ({
  defaultTab,
}) => {
  // Seed the search from `?search=` so deep links (e.g. the fleet-list "Track"
  // action) land here pre-filtered to a specific fleet/IOT.
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<BookingTabKey>(defaultTab);
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get("search") ?? "",
  );
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [modalTripId, setModalTripId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  // Trip awaiting confirmation before its status is advanced.
  const [confirmTrip, setConfirmTrip] = useState<FleetTripSummary | null>(null);

  const breakpoint = useBreakpoint();
  // Below the lg breakpoint (tablet & mobile) trip details open in a modal
  // instead of the inline side panel.
  const useModal = breakpoint !== "lg";

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // Server-side search: the debounced query is sent to the API as ?search=,
  // so it matches across all trips/buyers in the tab, not just the loaded page.
  const debouncedSearch = useDebounce(searchQuery.trim(), 400);

  const { data: trips, isLoading } = useFleetTrips({
    status: TAB_TO_STATUS[activeTab],
    search: debouncedSearch || undefined,
  });

  const tripsList: FleetTripSummary[] = useMemo(
    () => (Array.isArray(trips) ? trips : []),
    [trips],
  );

  // The backend already filtered by ?search=, but its ?status= filter is not
  // trustworthy: `?status=picked` comes back with trips that are already
  // `delivered`, so the Picked tab would list finished trips. It also emits
  // statuses outside the documented enum (e.g. `loaded` after a pick), which
  // `normalizeTripStatus` folds back onto a lifecycle state. Re-apply the tab's
  // status here so a tab only ever shows trips actually in that state.
  const filteredTrips = useMemo(
    () =>
      tripsList.filter(
        (t) => tripEffectiveStatus(t) === TAB_TO_STATUS[activeTab],
      ),
    [tripsList, activeTab],
  );

  // Auto-select the first trip for the inline panel (desktop only).
  useEffect(() => {
    if (useModal) return;
    if (filteredTrips.length === 0) {
      setSelectedTripId(null);
      return;
    }
    const stillVisible =
      selectedTripId &&
      filteredTrips.some((t) => tripId(t) === selectedTripId);
    if (!stillVisible) {
      setSelectedTripId(tripId(filteredTrips[0]));
    }
  }, [filteredTrips, selectedTripId, useModal]);

  // Animated tab underline
  useEffect(() => {
    const update = () => {
      const idx = TABS.findIndex((t) => t.key === activeTab);
      const tab = tabRefs.current[idx];
      const container = containerRef.current;
      if (tab && container) {
        const cRect = container.getBoundingClientRect();
        const tRect = tab.getBoundingClientRect();
        setIndicatorStyle({ left: tRect.left - cRect.left, width: tRect.width });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab]);

  const {
    mutate: updateStatus,
    isPending: isAdvancing,
    variables: advanceVars,
  } = useUpdateFleetTripStatus();

  // Clicking "Mark …" only opens the confirmation; the status update runs
  // after the user confirms.
  const handleAdvance = (trip: FleetTripSummary) => {
    const next = NEXT_STATUS[tripEffectiveStatus(trip)];
    if (!tripId(trip) || !next) return;
    setConfirmTrip(trip);
  };

  const confirmAdvance = () => {
    if (!confirmTrip) return;
    const id = tripId(confirmTrip);
    const next = NEXT_STATUS[tripEffectiveStatus(confirmTrip)];
    if (!id || !next) {
      setConfirmTrip(null);
      return;
    }
    updateStatus(
      { tripId: id, payload: { status: next.to } },
      { onSuccess: () => setConfirmTrip(null) },
    );
  };

  const handleSelectTrip = (id: string) => {
    if (useModal) setModalTripId(id);
    else setSelectedTripId(id);
  };

  const selectedSummary = useMemo(
    () => tripsList.find((t) => tripId(t) === selectedTripId),
    [tripsList, selectedTripId],
  );
  const modalSummary = useMemo(
    () => tripsList.find((t) => tripId(t) === modalTripId),
    [tripsList, modalTripId],
  );

  return (
    <div className="w-full bg-[#f1f1f1] mb-[2rem]">
      <div className="w-[95%] mx-auto flex flex-col tracking_timeline_container gap-2 sm:gap-4">
        {/* Left column: list */}
        <div className="w-full flex flex-col gap-4 bg-[#fefefe] pt-4 rounded-[10px]">
          <div className="px-3 sm:px-4">
            <h2 className="font-montserrat text-center font-medium text-[17px] sm:text-[20px] text-[#2b2b2b]">
              Order Tracking
            </h2>
          </div>

          <div className="relative w-full px-2 sm:px-4">
            <input
              type="text"
              placeholder="Search by buyer, fleet or IOT"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 bg-[#f1f1f1] text-[#2b2b2b] rounded-[4px] text-[12px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2B9B1E] placeholder:text-[#2b2b2b] placeholder:text-[12px] sm:placeholder:text-[14px] placeholder:font-montserrat placeholder:font-normal"
              aria-label="Search trips"
            />
            <div className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2">
              <SearchIcon stroke="#808080" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="flex justify-end px-2 sm:px-4">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="cursor-pointer px-4 py-2 bg-[#538e53] text-[#fefefe] text-[11px] sm:text-[12px] font-montserrat rounded-[4px] hover:bg-[#467a46] whitespace-nowrap"
            >
              Create Trip
            </button>
          </div>

          <div className="overflow-x-auto">
            <div
              className="relative flex items-center gap-1 sm:gap-5 mb-2 flex-nowrap px-2 sm:px-4"
              ref={containerRef}
              role="tablist"
            >
              {TABS.map((tab, idx) => (
                <button
                  key={tab.key}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  role="tab"
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-[14px] font-medium cursor-pointer p-3 pb-0 sm:text-base flex-shrink-0 ${
                    activeTab === tab.key ? "text-[#538e53]" : "text-[#2b2b2b]"
                  }`}
                  aria-selected={activeTab === tab.key}
                >
                  {tab.label}
                </button>
              ))}
              <motion.div
                className="absolute -bottom-[0.5rem] rounded-t-[10px] h-[3.7px] bg-[#538e53]"
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>
            <div className="w-full h-[1px] bg-[#e2e2e2]" />
          </div>

          <div className="flex flex-col gap-3 px-3 sm:px-4 pb-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-[#538e53] border-t-transparent rounded-full" />
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="py-10 text-center font-montserrat text-sm text-[#808080]">
                {debouncedSearch
                  ? `No trips match “${debouncedSearch}”.`
                  : "No trips in this status."}
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const id = tripId(trip);
                const advancing = isAdvancing && advanceVars?.tripId === id;
                const isSelected =
                  (useModal ? modalTripId : selectedTripId) === id;
                return (
                  <TripCard
                    key={id}
                    trip={trip}
                    selected={isSelected}
                    onSelect={() => handleSelectTrip(id)}
                    onAdvance={() => handleAdvance(trip)}
                    isAdvancing={advancing}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right column: inline tracking panel (desktop only) */}
        {!useModal && (
          <div className="flex flex-col mapProductTransport_Details gap-2 sm:gap-4 w-full">
            {selectedTripId ? (
              <TrackingPanel
                selectedTripId={selectedTripId}
                summary={selectedSummary}
              />
            ) : (
              <div className="w-full flex items-center justify-center bg-[#fefefe] rounded-[10px] shadow-md py-16 font-montserrat text-sm text-[#808080]">
                Select a trip to view tracking details.
              </div>
            )}
          </div>
        )}
      </div>

      <CreateFleetTripModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {confirmTrip && (
        <ConfirmAdvanceModal
          trip={confirmTrip}
          isPending={
            isAdvancing && advanceVars?.tripId === tripId(confirmTrip)
          }
          onConfirm={confirmAdvance}
          onClose={() => {
            if (!isAdvancing) setConfirmTrip(null);
          }}
        />
      )}

      {/* Tablet/mobile: trip details surface as a modal */}
      {useModal && modalTripId && (
        <TripDetailsModal
          tripId={modalTripId}
          summary={modalSummary}
          onClose={() => setModalTripId(null)}
        />
      )}
    </div>
  );
};
