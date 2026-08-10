"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { XModalIcon } from "./Icons/TransporterIcons";
import {
  useCreateFleetTrip,
  useFleetBookings,
} from "@/hooks/queries/useTransporterQueries";
import { useGetFleets } from "@/hooks/queries/useFleetQueries";

interface CreateFleetTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional preselected fleet — when triggered from a fleet row */
  initialFleetId?: string;
}

interface BookingShipmentItem {
  productName?: string;
  quantity?: number;
  unit?: string;
}

interface BookingRow {
  _id?: string;
  id?: string;
  buyer?: { _id?: string; name?: string } | string;
  buyerName?: string;
  loadWeightKg?: number;
  weightKg?: number;
  shipmentItems?: BookingShipmentItem[];
  // Set once the booking is bundled into a trip — such bookings must not be
  // selectable again, or the transporter would double-dispatch them.
  fleetTripId?: string | null;
  status?: string;
  createdAt?: string;
}

const getBookingId = (b: BookingRow): string =>
  (b._id as string) || (b.id as string) || "";

const isBookingAssigned = (b: BookingRow): boolean => !!b.fleetTripId;

const getBookingLabel = (b: BookingRow): string => {
  const buyer =
    typeof b.buyer === "string"
      ? b.buyer
      : b.buyer?.name || b.buyerName || "Unknown buyer";
  const products = (Array.isArray(b.shipmentItems) ? b.shipmentItems : [])
    .map((i) => i.productName)
    .filter(Boolean)
    .join(", ");
  const weight = b.loadWeightKg ?? b.weightKg;
  return [buyer, products || null, weight ? `${weight}kg` : null]
    .filter(Boolean)
    .join(" • ");
};

export const CreateFleetTripModal: React.FC<CreateFleetTripModalProps> = ({
  isOpen,
  onClose,
  initialFleetId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [fleetId, setFleetId] = useState<string>(initialFleetId || "");
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(
    new Set(),
  );

  const { data: fleets } = useGetFleets();
  const { data: bookingsRaw, isLoading: isLoadingBookings } = useFleetBookings(
    fleetId,
    { status: "confirmed" },
    { enabled: !!fleetId },
  );

  const bookings: BookingRow[] = useMemo(() => {
    if (Array.isArray(bookingsRaw)) return bookingsRaw as BookingRow[];
    if (
      bookingsRaw &&
      typeof bookingsRaw === "object" &&
      Array.isArray((bookingsRaw as { bookings?: BookingRow[] }).bookings)
    ) {
      return (bookingsRaw as { bookings: BookingRow[] }).bookings;
    }
    return [];
  }, [bookingsRaw]);

  const { mutate: createTrip, isPending } = useCreateFleetTrip();

  // Keyboard/screen-reader behaviour: focus into the dialog, trap Tab, lock body scroll.
  // Escape is already handled by the effect below, so it is not passed here.
  useModalA11y(isOpen, modalRef);

  useEffect(() => {
    if (isOpen) {
      setFleetId(initialFleetId || "");
      setSelectedBookings(new Set());
    }
  }, [isOpen, initialFleetId]);

  useEffect(() => {
    setSelectedBookings(new Set());
  }, [fleetId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleBooking = (id: string) => {
    setSelectedBookings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!fleetId) {
      toast.error("Select a fleet first");
      return;
    }
    if (selectedBookings.size === 0) {
      toast.error("Select at least one booking");
      return;
    }
    createTrip(
      { fleetId, bookingIds: Array.from(selectedBookings) },
      { onSuccess: () => onClose() },
    );
  };

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
            aria-label="Create trip"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#fefefe] rounded-lg w-full max-w-[520px] overflow-y-auto max-h-[90vh] p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-[1.2rem] right-[1.2rem] cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <XModalIcon />
            </button>

            <h2 className="text-[18px] pt-1 font-semibold text-center text-[#2b2b2b] font-montserrat mb-2">
              Create Trip
            </h2>
            <p className="text-[12px] text-center text-[#808080] font-montserrat mb-6">
              Bundle confirmed bookings on a fleet into a single dispatch trip.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium font-montserrat text-[#2b2b2b]">
                  Fleet
                </label>
                <select
                  value={fleetId}
                  onChange={(e) => setFleetId(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm font-montserrat bg-white focus:outline-none focus:border-[#538e53] cursor-pointer"
                  disabled={!!initialFleetId}
                >
                  <option value="">Select fleet…</option>
                  {/* Two fleets can share a name — this account has two called
                      "North Route Fleet" on different routes. Qualify each with its
                      plate/IOT and route so the transporter knows which truck they are
                      dispatching. */}
                  {(fleets || []).map((f) => {
                    const name = f.fleetName || f.plateNumber || f._id;
                    const ident = f.plateNumber || f.iot;
                    const route =
                      f.route?.fromState && f.route?.toState
                        ? `${f.route.fromState} → ${f.route.toState}`
                        : null;
                    const qualifier = [ident, route].filter(Boolean).join(", ");
                    return (
                      <option key={f._id} value={f._id}>
                        {qualifier ? `${name} (${qualifier})` : name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium font-montserrat text-[#2b2b2b]">
                  Confirmed bookings
                </label>
                {!fleetId ? (
                  <div className="text-[12px] text-[#808080] font-montserrat py-3 text-center border border-dashed border-gray-200 rounded-md">
                    Select a fleet to load its confirmed bookings.
                  </div>
                ) : isLoadingBookings ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin h-6 w-6 border-4 border-[#538e53] border-t-transparent rounded-full" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-[12px] text-[#808080] font-montserrat py-3 text-center border border-dashed border-gray-200 rounded-md">
                    No confirmed bookings on this fleet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {bookings.map((b) => {
                      const id = getBookingId(b);
                      const assigned = isBookingAssigned(b);
                      const checked = selectedBookings.has(id) && !assigned;
                      return (
                        <label
                          key={id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md border ${
                            assigned
                              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                              : checked
                                ? "border-[#538e53] bg-[#f3f9f3] cursor-pointer"
                                : "border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={assigned}
                            onChange={() => !assigned && toggleBooking(id)}
                            className={`accent-[#538e53] ${
                              assigned ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                          />
                          <span className="text-[12px] font-montserrat text-[#2b2b2b]">
                            {getBookingLabel(b)}
                            {assigned && (
                              <span className="text-[#808080]">
                                {" "}
                                • already on a trip
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="cursor-pointer px-4 py-2 text-sm font-montserrat text-[#2b2b2b] border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || selectedBookings.size === 0}
                  className="cursor-pointer px-4 py-2 text-sm font-montserrat text-[#fefefe] bg-[#538e53] rounded-md hover:bg-[#467a46] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending
                    ? "Creating…"
                    : selectedBookings.size > 0
                      ? `Create trip (${selectedBookings.size})`
                      : "Create trip"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
