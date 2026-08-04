import type { OrderRecord } from "@/services/OrderService";

export type TrackOrderStatus = "pending" | "picked" | "on_transit" | "delivered";

export interface TrackOrderPackage {
  id: string;
  productId: string;
  name: string;
  image: string;
  description: string;
}

export interface TrackOrder {
  id: string;
  transporter: {
    name: string;
    logo: string;
    rating: number;
    avatar: string;
    company: string;
    location: string;
    yearsOfService: number;
    followers: number;
    ratingLabel: string;
    phone: string;
  };
  fleet: {
    name: string;
    iot: string;
    image: string;
  };
  product: {
    name: string;
    id: string;
    image: string;
  };
  // The agent who owns the ordered product. Read from the order's own `agent`
  // field, falling back to the populated `product.owner` for older orders.
  // Empty string when neither resolves to an id, in which case the review entry
  // point stays hidden rather than posting against a guessed id.
  agentId: string;
  agentName: string;
  status: TrackOrderStatus;
  pickedAt: string;
  onTransitAt: string;
  deliveredAt: string;
  estDeliveryDate: string;
  fromLocation: string;
  toLocation: string;
  // Receipt confirmation (Item 4): true once the buyer has confirmed delivery.
  // Persisted by the backend so the confirm button stays hidden after a refresh.
  receiptConfirmed: boolean;
  receiptConfirmedAt: string | null;
  // Live GPS embedded in the order list response (null until the backend sets
  // a position). The dedicated /tracking poll overrides this when available.
  liveLocation: { lat: number; lng: number } | null;
  liveLocationLabel: string;
  liveUpdatedAt: string | null;
  packages: TrackOrderPackage[];
}

// ---------------------------------------------------------------------------
// OrderRecord → TrackOrder mapper (shared by the buyer track-orders page and
// the agent Track Order page). Tolerant of partially-populated backend shapes:
// missing transporter/fleet/timeline fields degrade to "N/A" rather than throw.
// ---------------------------------------------------------------------------

export type ApiObject = Record<string, unknown>;

export const asObject = (v: unknown): ApiObject =>
  v && typeof v === "object" ? (v as ApiObject) : {};

export const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const NA = "N/A";
/** Shown in the transporter slot before a carrier has been assigned. */
const UNASSIGNED = "Transporter not assigned";

export const asString = (v: unknown, fallback: string = NA): string =>
  typeof v === "string" && v ? v : fallback;

/** First non-empty string among the candidates, else N/A. */
export const firstString = (...vals: unknown[]): string => {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return NA;
};

export const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : fallback;

export const formatDateShort = (iso?: unknown): string => {
  if (typeof iso !== "string" || !iso) return NA;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NA;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const TRANSPORT_STATUS_TO_TRACK: Record<string, TrackOrderStatus> = {
  pending: "pending",
  picked: "picked",
  on_transit: "on_transit",
  in_transit: "on_transit",
  delivered: "delivered",
};

export const mapTransportStatus = (s: unknown): TrackOrderStatus => {
  const v = (typeof s === "string" ? s : "").toLowerCase();
  return TRANSPORT_STATUS_TO_TRACK[v] ?? "pending";
};

export const orderToTrackOrder = (raw: OrderRecord): TrackOrder => {
  const o = raw as ApiObject;
  const id = asString(o._id ?? o.id, "");
  const transporter = asObject(o.transporter);
  const fleet = asObject(o.fleet ?? o.truck);
  const products = asArray(o.products);
  const firstLine = asObject(products[0]);
  const firstProduct = asObject(firstLine.product ?? firstLine);
  // Seller of the first product — used as a display fallback while no
  // transporter has been assigned to the order yet.
  const owner = asObject(firstProduct.owner);
  // The order now carries its own populated `agent` ({_id, name, businessName,
  // image}). `product.owner` stays as the fallback for orders written before
  // that field existed.
  const agent = asObject(o.agent);
  // The backend leaves `transporter` null until one is actually assigned. Until
  // then the transporter identity must stay empty — falling back to the seller
  // told the buyer their goods were with a carrier that does not exist yet.
  const hasTransporter = Object.keys(transporter).length > 0;
  const productImages = asArray(firstProduct.images);
  const status = mapTransportStatus(o.transportStatus);

  // Live GPS embedded in the order list response. Only a real numeric pair
  // counts as a position; { lat: null, lng: null } stays null so the map
  // shows its placeholder instead of jumping to 0,0.
  const cl = asObject(o.currentLocation);
  const clLat = typeof cl.lat === "number" ? cl.lat : null;
  const clLng = typeof cl.lng === "number" ? cl.lng : null;
  const liveLocation =
    clLat !== null && clLng !== null ? { lat: clLat, lng: clLng } : null;
  const liveLocationLabel =
    asString(cl.label, "") || asString(o.currentLocationLabel, "");
  const liveUpdatedAt =
    typeof o.lastUpdatedAt === "string" ? o.lastUpdatedAt : null;

  const updatedAt = formatDateShort(o.updatedAt);
  const pickedAt =
    formatDateShort(o.pickedAt) !== NA
      ? formatDateShort(o.pickedAt)
      : status !== "pending"
        ? updatedAt
        : NA;
  const onTransitAt =
    formatDateShort(o.onTransitAt) !== NA
      ? formatDateShort(o.onTransitAt)
      : status === "on_transit" || status === "delivered"
        ? updatedAt
        : NA;
  const deliveredAt =
    formatDateShort(o.deliveredAt) !== NA
      ? formatDateShort(o.deliveredAt)
      : status === "delivered"
        ? updatedAt
        : NA;

  return {
    id,
    transporter: {
      name: hasTransporter
        ? firstString(transporter.name, transporter.businessName)
        : UNASSIGNED,
      // No placeholder here: the card falls back to a neutral badge when the
      // transporter has no logo (firstString yields "N/A").
      logo: hasTransporter
        ? firstString(transporter.logo, transporter.image)
        : NA,
      rating: asNumber(transporter.rating, 0),
      avatar: hasTransporter
        ? firstString(
            transporter.avatar,
            transporter.image,
            "/images/profileSettingImage.png",
          )
        : "/images/profileSettingImage.png",
      // Strictly the business name — no fallback to the personal name, so the
      // line stays empty until a real businessName exists, then shows on its own.
      company: hasTransporter
        ? firstString(transporter.businessName, transporter.company)
        : NA,
      location: asString(
        transporter.location,
        asString(firstLine.localTransportFrom),
      ),
      yearsOfService: asNumber(transporter.yearsOfService, 0),
      followers: asNumber(transporter.followers, 0),
      ratingLabel: asString(transporter.ratingLabel),
      phone: asString(transporter.phone, ""),
    },
    fleet: {
      name: firstString(
        fleet.model,
        fleet.fleetName,
        fleet.name,
        fleet.plateNumber,
      ),
      iot: firstString(fleet.iotId, fleet.iot, fleet.plateNumber),
      image: asString(
        fleet.image ?? asArray(fleet.images)[0],
        "/images/truckcontainer.png",
      ),
    },
    product: {
      name: asString(firstProduct.name),
      id: asString(firstProduct._id ?? firstProduct.id),
      image: asString(productImages[0], "/images/foodTracked.png"),
    },
    agentId: asString(agent._id ?? agent.id ?? owner._id ?? owner.id, ""),
    agentName: firstString(
      agent.businessName,
      agent.name,
      owner.businessName,
      owner.name,
      "the agent",
    ),
    status,
    pickedAt,
    onTransitAt,
    deliveredAt,
    estDeliveryDate: formatDateShort(o.estDeliveryDate),
    fromLocation: asString(o.fromLocation ?? firstLine.localTransportFrom),
    toLocation: asString(
      o.toLocation ?? firstLine.localTransportTo ?? o.address,
    ),
    // A timestamp implies confirmation even if the boolean flag is absent.
    receiptConfirmed:
      o.receiptConfirmed === true || typeof o.receiptConfirmedAt === "string",
    receiptConfirmedAt:
      typeof o.receiptConfirmedAt === "string" ? o.receiptConfirmedAt : null,
    liveLocation,
    liveLocationLabel,
    liveUpdatedAt,
    packages: products.map((p, i): TrackOrderPackage => {
      const line = asObject(p);
      const prod = asObject(line.product ?? line);
      const imgs = asArray(prod.images);
      return {
        id: asString(line._id ?? prod._id ?? `pkg-${i}`, `pkg-${i}`),
        productId: asString(prod._id ?? prod.id),
        name: asString(prod.name),
        image: asString(imgs[0], "/images/foodTracked.png"),
        description: asString(prod.description, ""),
      };
    }),
  };
};
