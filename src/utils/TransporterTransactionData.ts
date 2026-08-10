import type { TransporterTransactionApi } from "@/services/transporterService";
import type { AdminFleetPaymentRecord } from "@/services/fleetService";

export interface TransporterTransaction {
  id: string;
  IOT: string;
  image: string;
  name: string;
  description: string;
  Payment: number;
  KG: number;
  Seller: string;
  date: string;
  checked: boolean;
  status?: string;
}

const formatDate = (value?: string): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const resolvePayerName = (tx: TransporterTransactionApi): string => {
  const payer =
    typeof tx.payer === "object" && tx.payer ? tx.payer : undefined;
  const buyer =
    typeof tx.buyer === "object" && tx.buyer ? tx.buyer : undefined;
  const source = payer ?? buyer;
  if (!source) return "";
  if (source.name) return source.name;
  if (source.fullName) return source.fullName;
  const first = source.firstName ?? "";
  const last = source.lastName ?? "";
  return `${first} ${last}`.trim();
};

const resolveOrder = (tx: TransporterTransactionApi) =>
  typeof tx.order === "object" && tx.order ? tx.order : undefined;

const resolveFleet = (tx: TransporterTransactionApi) => {
  const order = resolveOrder(tx);
  if (!order) return undefined;
  const fleet =
    typeof order.fleet === "object" && order.fleet ? order.fleet : undefined;
  const truck =
    typeof order.truck === "object" && order.truck ? order.truck : undefined;
  return fleet ?? truck;
};

/**
 * A fleet payment — money a buyer paid for one of this transporter's fleets —
 * rendered as a transaction row. These never reached the Transactions tab
 * before: it was fed only product-order transactions, so a transporter could
 * not see money owed to them for their own bookings.
 */
export const mapFleetPaymentTransaction = (
  payment: AdminFleetPaymentRecord,
): TransporterTransaction => {
  const fleet =
    typeof payment.fleet === "object" && payment.fleet ? payment.fleet : undefined;
  const buyer =
    typeof payment.buyer === "object" && payment.buyer ? payment.buyer : undefined;
  const id = payment._id ?? payment.id ?? "";

  // The load is on the payment itself; fall back to summing the shipment lines.
  const weight =
    typeof payment.loadWeightKg === "number"
      ? payment.loadWeightKg
      : (payment.shipmentItems ?? []).reduce(
          (sum, item) => sum + (item.loadWeightKg ?? 0),
          0,
        );

  return {
    id,
    IOT: fleet?.iot || (typeof payment.fleetTripId === "string" ? payment.fleetTripId.slice(-9) : "") || id.slice(-9),
    image: fleet?.image || fleet?.images?.[0] || "/images/truckcontainer.png",
    name: fleet?.fleetName || "Fleet",
    description: fleet?.plateNumber || fleet?.model || "",
    Payment: typeof payment.amount === "number" ? payment.amount : 0,
    KG: weight,
    Seller: buyer?.name || "",
    date: formatDate(payment.createdAt),
    checked: payment.status === "approved",
    status: typeof payment.status === "string" ? payment.status : undefined,
  };
};

export const mapTransporterTransaction = (
  tx: TransporterTransactionApi,
): TransporterTransaction => {
  const order = resolveOrder(tx);
  const fleet = resolveFleet(tx);
  const id = tx._id ?? tx.id ?? "";
  const iot =
    (order && typeof order.iot === "string" ? order.iot : "") ||
    (typeof order === "object" && order?._id ? order._id.slice(-9) : "") ||
    id.slice(-9);
  const image =
    fleet?.image ||
    (Array.isArray(fleet?.images) && fleet?.images?.[0]) ||
    "/images/truckcontainer.png";
  const name = fleet?.fleetName || fleet?.name || "Fleet";
  const description = fleet?.description || fleet?.plateNumber || "";
  const weight =
    (order && typeof order.weightKg === "number" ? order.weightKg : undefined) ??
    (order && typeof order.weight === "number" ? order.weight : undefined) ??
    0;

  return {
    id,
    IOT: iot,
    image,
    name,
    description,
    Payment: typeof tx.amount === "number" ? tx.amount : 0,
    KG: weight,
    Seller: resolvePayerName(tx),
    date: formatDate(tx.createdAt),
    checked: tx.status === "approved",
    status: typeof tx.status === "string" ? tx.status : undefined,
  };
};
