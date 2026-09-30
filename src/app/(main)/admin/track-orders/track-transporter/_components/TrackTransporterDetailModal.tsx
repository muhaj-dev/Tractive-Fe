"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { XModalIcon } from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import { FleetTripSummary } from "@/services/fleetTripService";
import {
  buyerImage,
  formatDate,
  tripFleetIot,
  tripFleetImage,
  tripFleetName,
  tripFleetObject,
  tripRoute,
  tripTransporterImage,
  tripTransporterName,
  tripTransporterObject,
  tripCurrentCoords,
} from "@/app/(main)/transporter/_components/tripHelpers";
import { formatUnitAfterQuantity } from "@/utils/productUnits";
import { useModalA11y } from "@/hooks/useModalA11y";

interface TrackTransporterDetailModalProps {
  trip: FleetTripSummary;
  onClose: () => void;
}

/** Order entry as it arrives on `orderIds` (populated) — id + per-order status. */
interface TripOrderRef {
  _id?: string;
  id?: string;
  transportStatus?: string;
  buyer?: string;
}

const Field: React.FC<{ label: string; value?: string | number | null }> = ({
  label,
  value,
}) => {
  const text =
    value === 0
      ? "0"
      : typeof value === "number"
        ? String(value)
        : value && value.toString().trim()
          ? value.toString()
          : "—";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-montserrat text-[11px] text-[#808080]">{label}</span>
      <span className="font-montserrat text-[13px] text-[#2b2b2b] break-words">
        {text}
      </span>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-[10px] border border-[#e0e0e0] p-4 flex flex-col gap-3">
    <span className="font-montserrat text-[13px] font-medium text-[#2b2b2b]">
      {title}
    </span>
    {children}
  </div>
);

/** "loaded" → "Loaded", "on_transit" → "On Transit". Shows the raw backend status. */
const humanizeStatus = (s?: string): string => {
  if (!s) return "—";
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const STATUS_STYLES: Record<string, string> = {
  picked: "bg-[#fff4e5] text-[#b76e00]",
  loaded: "bg-[#fff4e5] text-[#b76e00]",
  on_transit: "bg-[#e8f0fe] text-[#1a56db]",
  delivered: "bg-[#e7f6ec] text-[#1a7f37]",
  completed: "bg-[#e7f6ec] text-[#1a7f37]",
  cancelled: "bg-[#fdecea] text-[#c0392b]",
  planned: "bg-[#f1f1f1] text-[#555]",
  pending: "bg-[#f1f1f1] text-[#555]",
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => (
  <span
    className={`px-2.5 py-1 rounded-full font-montserrat text-[11px] font-medium ${
      STATUS_STYLES[(status ?? "").toLowerCase()] || "bg-[#f1f1f1] text-[#555]"
    }`}
  >
    {humanizeStatus(status)}
  </span>
);

const weightLabel = (trip: FleetTripSummary): string => {
  const kg = trip.loadWeightKg ?? trip.totalLoadKg;
  if (typeof kg !== "number") return "—";
  const t = trip.loadWeightTonnes;
  return typeof t === "number" ? `${kg} kg (${t} t)` : `${kg} kg`;
};

/**
 * Full read-only trip detail for the admin track-transporter board. Renders
 * every field the fleet-trip carries — status, route, fleet, transporter,
 * driver, buyers, packages and the per-order transport status — so an admin can
 * see the complete picture of a shipment from one dialog.
 */
export const TrackTransporterDetailModal: React.FC<
  TrackTransporterDetailModalProps
> = ({ trip, onClose }) => {
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

  const fleet = tripFleetObject(trip);
  const transporter = tripTransporterObject(trip);
  const driver = trip.driver && typeof trip.driver === "object" ? trip.driver : null;
  const buyers = trip.buyers ?? [];
  const packages = trip.packages ?? [];
  const orders = (Array.isArray(trip.orderIds) ? trip.orderIds : []).filter(
    (o): o is TripOrderRef => !!o && typeof o === "object",
  );
  const { from, to } = tripRoute(trip);
  const coords = tripCurrentCoords(trip);
  // Trip-level delivery progress comes off the linked order(s); fall back to a
  // top-level field if the backend ever sets one on the trip itself.
  const transportStatus =
    orders.find((o) => o.transportStatus)?.transportStatus ||
    (typeof trip.transportStatus === "string" ? trip.transportStatus : undefined);

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
          className="relative bg-[#fefefe] rounded-lg w-full max-w-[640px] lg:max-w-[960px] xl:max-w-[1040px] max-h-[92vh] overflow-y-auto my-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#fefefe] px-4 py-3 border-b border-[#e0e0e0] rounded-t-lg">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-montserrat font-medium text-[15px] sm:text-[16px] text-[#2b2b2b] mr-1">
                Trip Details
              </h2>
              <StatusBadge status={trip.status} />
              {transportStatus && <StatusBadge status={transportStatus} />}
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <XModalIcon />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
            {/* Left column: the trip and who is responsible for it. */}
            <div className="flex flex-col gap-4">
            {/* Trip summary */}
            <Section title="Shipment">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-montserrat text-[11px] text-[#808080]">
                    Transport status
                  </span>
                  <div>
                    <StatusBadge status={transportStatus} />
                  </div>
                </div>
                <Field label="Tracking code" value={trip.trackingCode} />
                <Field label="Route" value={`${from} → ${to}`} />
                <Field label="Total weight" value={weightLabel(trip)} />
                <Field
                  label="Whole truck only"
                  value={trip.wholeTruckOnly ? "Yes" : "No"}
                />
                <Field label="Packages" value={trip.packageCount ?? packages.length} />
                <Field label="Buyers" value={trip.buyerCount ?? buyers.length} />
                <Field label="Orders" value={trip.orderCount ?? orders.length} />
                <Field
                  label="Current GPS"
                  value={coords ? `${coords.lat}, ${coords.lng}` : "Not reporting"}
                />
                <Field label="Created" value={formatDate(trip.createdAt)} />
                <Field label="Last updated" value={formatDate(trip.updatedAt)} />
                {trip.startedAt && (
                  <Field label="Started" value={formatDate(trip.startedAt)} />
                )}
                {trip.completedAt && (
                  <Field label="Completed" value={formatDate(trip.completedAt)} />
                )}
                {trip.cancelledAt && (
                  <Field label="Cancelled" value={formatDate(trip.cancelledAt)} />
                )}
              </div>
            </Section>

            {/* Fleet */}
            <Section title="Fleet">
              <div className="flex items-center gap-3">
                <Image
                  src={tripFleetImage(trip)}
                  alt={tripFleetName(trip)}
                  width={72}
                  height={44}
                  className="w-18 h-11 rounded-[6px] object-cover"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Plate number" value={fleet?.plateNumber} />
                <Field label="Model" value={fleet?.model} />
              </div>
            </Section>

            {/* Transporter */}
            <Section title="Transporter">
              <div className="flex items-center gap-3">
                {tripTransporterImage(trip) ? (
                  <Image
                    src={tripTransporterImage(trip)}
                    alt={tripTransporterName(trip)}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center font-montserrat font-bold text-[#2b2b2b]">
                    {tripTransporterName(trip).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-montserrat text-[14px] font-medium text-[#2b2b2b]">
                  {tripTransporterName(trip)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Contact name" value={transporter?.name} />
                <Field label="Phone" value={transporter?.phone} />
                <Field label="Email" value={transporter?.email} />
                <Field label="State" value={transporter?.state} />
                <Field label="Address" value={transporter?.address} />
              </div>
            </Section>

            {/* Driver */}
            <Section title="Driver">
              {driver ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Field label="Name" value={driver.name} />
                  <Field label="Phone" value={driver.phone} />
                  <Field label="License" value={driver.licenseNumber} />
                </div>
              ) : (
                <p className="font-montserrat text-[13px] text-[#808080]">
                  No driver assigned yet.
                </p>
              )}
            </Section>
            </div>

            {/* Right column: everything on the truck — buyers, packages, orders. */}
            <div className="flex flex-col gap-4">
            {/* Buyers */}
            <Section title={`Buyers (${buyers.length})`}>
              {buyers.length === 0 ? (
                <p className="font-montserrat text-[13px] text-[#808080]">
                  No buyer information.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:max-h-[440px] lg:overflow-y-auto lg:pr-1">
                {buyers.map((b, i) => (
                  <div
                    key={b._id || b.id || i}
                    className="rounded-[8px] bg-[#faf7f7] p-3 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={buyerImage(b)}
                        alt={b.name || "Buyer"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="font-montserrat text-[13px] font-medium text-[#2b2b2b]">
                        {b.businessName || b.name || "—"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Name" value={b.name} />
                      <Field label="Phone" value={b.phone} />
                      <Field label="Email" value={b.email} />
                      <Field label="State" value={b.state} />
                      <Field label="Address" value={b.address} />
                    </div>
                  </div>
                ))}
                </div>
              )}
            </Section>

            {/* Packages */}
            <Section title={`Packages (${packages.length})`}>
              {packages.length === 0 ? (
                <p className="font-montserrat text-[13px] text-[#808080]">
                  No packages on this trip.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:max-h-[240px] lg:overflow-y-auto lg:pr-1">
                {packages.map((p, i) => (
                  <div
                    key={p.productId || p._id || i}
                    className="flex items-center gap-3"
                  >
                    <div className="bg-[#f1f1f1] flex items-center justify-center w-12 h-12 rounded-[6px] shrink-0">
                      <Image
                        src={p.image || "/images/foodTracked.png"}
                        alt={p.name || "Package"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-[4px] object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-montserrat text-[13px] text-[#2b2b2b]">
                        {p.name || "—"}
                      </span>
                      <span className="font-montserrat text-[11px] text-[#808080]">
                        {(p.quantity ?? "—")} {formatUnitAfterQuantity(p.unit, p.quantity)}
                        {typeof p.loadWeightKg === "number"
                          ? ` · ${p.loadWeightKg} kg`
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </Section>

            {/* Orders */}
            <Section title={`Orders (${orders.length})`}>
              {orders.length === 0 ? (
                <p className="font-montserrat text-[13px] text-[#808080]">
                  No linked orders.
                </p>
              ) : (
                <div className="flex flex-col gap-2 lg:max-h-[240px] lg:overflow-y-auto lg:pr-1">
                  {orders.map((o, i) => (
                    <div
                      key={o._id || o.id || i}
                      className="flex items-center justify-between gap-2 border-b border-[#f0f0f0] pb-2 last:border-0 last:pb-0"
                    >
                      <span className="font-montserrat text-[12px] text-[#2b2b2b] break-all">
                        {o._id || o.id || "—"}
                      </span>
                      <StatusBadge status={o.transportStatus} />
                    </div>
                  ))}
                </div>
              )}
            </Section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
