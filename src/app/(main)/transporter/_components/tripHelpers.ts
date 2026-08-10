import {
  FleetTripBuyer,
  FleetTripFleet,
  FleetTripStatus,
  FleetTripSummary,
  FleetTripTracking,
} from "@/services/fleetTripService";

/** Tab keys used by the tracking board. */
export type BookingTabKey = "new" | "picked" | "on_transit" | "delivered";

/** Each board tab maps to the status it filters the fleet-trips list by. */
export const TAB_TO_STATUS: Record<BookingTabKey, FleetTripStatus> = {
  new: "planned",
  picked: "picked",
  on_transit: "on_transit",
  delivered: "delivered",
};

export const TABS: { key: BookingTabKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "picked", label: "Picked" },
  { key: "on_transit", label: "On Transit" },
  { key: "delivered", label: "Delivered" },
];

/** Forward-only progression of a trip's lifecycle. */
export const STATUS_ORDER: FleetTripStatus[] = [
  "planned",
  "picked",
  "on_transit",
  "delivered",
];

/** The single status a trip can advance to via the quick "Mark …" action. */
export const NEXT_STATUS: Partial<
  Record<FleetTripStatus, { to: FleetTripStatus; label: string }>
> = {
  planned: { to: "picked", label: "Picked" },
  picked: { to: "on_transit", label: "On Transit" },
  on_transit: { to: "delivered", label: "Delivered" },
};

export const STATUS_LABELS: Record<FleetTripStatus, string> = {
  planned: "Planned",
  pending: "Planned",
  picked: "Picked",
  on_transit: "On Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Map a backend status string to one of the canonical lifecycle states.
 *
 * The backend isn't guaranteed to send the exact `lower_snake_case` we expect:
 * it may return "Picked", "ON_TRANSIT", "in-transit", "onTransit", etc. We lower
 * the string and collapse separators first, then match known aliases — so a trip
 * that's really "picked" never falls back to "planned" and re-offers "Mark
 * Picked" instead of advancing to "On Transit".
 */
export const normalizeTripStatus = (s?: string): FleetTripStatus => {
  const key = (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_"); // "in-transit" / "on transit" -> "in_transit"/"on_transit"

  switch (key) {
    case "planned":
    case "pending": // legacy alias for older trips
    case "new":
      return "planned";
    case "picked":
    case "pickup":
    case "picked_up":
    // The backend writes `status: "loaded"` when a trip is marked picked — it
    // only updates `transportStatus` to "picked". Without this alias the trip
    // falls through to "planned" and reappears in the New tab.
    case "loaded":
      return "picked";
    case "on_transit":
    case "in_transit":
    case "intransit":
    case "ontransit":
    case "transit":
    case "transiting":
      return "on_transit";
    case "delivered":
    case "completed":
    case "complete":
    case "done":
      return "delivered";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "planned";
  }
};

export const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * The lifecycle state a trip is really in.
 *
 * `transportStatus` is the field the backend keeps correct on every transition;
 * `status` lags on a pick (it stays `"loaded"`). Prefer the former and fall
 * back to the latter for older trips that predate it.
 */
export const tripEffectiveStatus = (trip: FleetTripSummary): FleetTripStatus =>
  normalizeTripStatus(trip.transportStatus ?? trip.status);

/** Whether `target` has already been reached given the trip's `current` status. */
export const isReached = (
  current: FleetTripStatus | undefined,
  target: FleetTripStatus,
) => {
  const c = normalizeTripStatus(current);
  if (c === "cancelled") return false;
  return STATUS_ORDER.indexOf(c) >= STATUS_ORDER.indexOf(target);
};

export const tripFleetObject = (trip?: {
  fleet?: FleetTripFleet | string;
}): FleetTripFleet | undefined =>
  trip?.fleet && typeof trip.fleet === "object" ? trip.fleet : undefined;

export const tripFleetName = (trip: FleetTripSummary): string => {
  const f = tripFleetObject(trip) as
    | (FleetTripFleet & { name?: string })
    | undefined;
  // Mirror the order-card priority (model first) so a fleet populated with any
  // of these field names renders a real name instead of the "Fleet" fallback.
  if (f)
    return (
      f.model ||
      f.fleetName ||
      f.name ||
      f.plateNumber ||
      f.fleetNumber ||
      "Fleet"
    );
  return (trip.fleet as string) || "Fleet";
};

export const tripFleetIot = (trip: FleetTripSummary): string => {
  const f = tripFleetObject(trip) as
    | (FleetTripFleet & { iotId?: string })
    | undefined;
  return f?.iot || f?.iotId || f?.fleetNumber || f?.plateNumber || "—";
};

export const tripFleetImage = (trip: FleetTripSummary): string => {
  const f = tripFleetObject(trip);
  return f?.image || (f?.images && f.images[0]) || "/images/Trucker.png";
};

export const tripPrimaryBuyerName = (trip: FleetTripSummary): string => {
  const b = trip.buyers?.[0] as FleetTripBuyer | string | undefined;
  // Tolerate a populated buyer object (name/businessName) or, if the backend
  // left it unpopulated, a bare id string — anything but a raw code on screen.
  if (typeof b === "string" || !b) return "—";
  return b.name || b.businessName || "—";
};

export const tripTransporterObject = (trip?: {
  transporter?: FleetTripSummary["transporter"];
}): NonNullable<FleetTripSummary["transporter"]> | undefined =>
  trip?.transporter && typeof trip.transporter === "object"
    ? trip.transporter
    : undefined;

/** Transporter company name shown on the card header. */
export const tripTransporterName = (trip: FleetTripSummary): string => {
  const t = tripTransporterObject(trip);
  return t?.businessName || t?.company || t?.name || "Transporter";
};

/** Transporter logo/avatar; empty string when none so the UI shows initials. */
export const tripTransporterImage = (trip: FleetTripSummary): string => {
  const t = tripTransporterObject(trip);
  return t?.image || t?.avatar || "";
};

/** Transporter rating (0 when the backend hasn't supplied one yet). */
export const tripTransporterRating = (trip: FleetTripSummary): number => {
  const t = tripTransporterObject(trip) as { rating?: number } | undefined;
  return typeof t?.rating === "number" ? t.rating : 0;
};

/** First package on the trip, with display-ready name/id/image. */
export const tripPrimaryPackage = (
  trip: FleetTripSummary,
): { name: string; id: string; image: string } => {
  const p = trip.packages?.[0];
  return {
    name: p?.name || "—",
    id: (p?.productId || p?._id || p?.id || "—") as string,
    image: p?.image || "/images/foodTracked.png",
  };
};

export const buyerImage = (b?: FleetTripBuyer): string =>
  b?.image || b?.avatar || "/images/profileSettingImage.png";

/** Resolve the trip's origin/destination from explicit fields or the fleet route. */
export const tripRoute = (
  trip?: FleetTripSummary | FleetTripTracking,
): { from: string; to: string } => {
  const f = tripFleetObject(trip);
  const from =
    (typeof trip?.origin === "string" && trip.origin) ||
    trip?.fromLocation ||
    f?.route?.fromState ||
    "—";
  const to =
    (typeof trip?.destination === "string" && trip.destination) ||
    trip?.toLocation ||
    f?.route?.toState ||
    "—";
  return { from, to };
};

/** Best-effort date for a given milestone, from explicit fields or the timeline. */
export const findTimelineDate = (
  trip: FleetTripSummary | FleetTripTracking | undefined,
  status: FleetTripStatus,
): string | undefined => {
  if (!trip) return undefined;
  const t = trip as FleetTripTracking;
  const direct =
    status === "picked"
      ? t.pickedAt || t.startedAt
      : status === "on_transit"
        ? t.onTransitAt
        : status === "delivered"
          ? t.deliveredAt || t.completedAt
          : undefined;
  if (direct) return direct as string;
  const event = t.timeline?.find(
    (e) => normalizeTripStatus(String(e.status)) === status,
  );
  return event?.at || event?.timestamp;
};

const toNum = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/**
 * Current GPS position of the trip, if the backend has reported one.
 * Tolerant of the field names the backend may use: top-level lat/lng,
 * currentLat/currentLng, currentLatitude/currentLongitude, a currentLocation
 * object ({lat,lng} | {latitude,longitude} | GeoJSON {coordinates:[lng,lat]}).
 */
export const tripCurrentCoords = (
  trip?: FleetTripSummary | FleetTripTracking,
): { lat: number; lng: number } | null => {
  if (!trip) return null;
  const t = trip as Record<string, unknown>;

  // Flat fields directly on the trip.
  let lat = toNum(trip.currentLatitude) ?? toNum(t.currentLat) ?? toNum(t.lat);
  let lng =
    toNum(trip.currentLongitude) ?? toNum(t.currentLng) ?? toNum(t.lng);
  if (lat !== undefined && lng !== undefined) return { lat, lng };

  // Nested currentLocation object.
  const cl = trip.currentLocation;
  if (cl && typeof cl === "object") {
    const c = cl as Record<string, unknown>;
    lat = toNum(c.lat) ?? toNum(c.latitude);
    lng = toNum(c.lng) ?? toNum(c.lon) ?? toNum(c.longitude);
    if ((lat === undefined || lng === undefined) && Array.isArray(c.coordinates)) {
      // GeoJSON order is [lng, lat]
      lng = toNum(c.coordinates[0]);
      lat = toNum(c.coordinates[1]);
    }
    if (lat !== undefined && lng !== undefined) return { lat, lng };
  }
  return null;
};
