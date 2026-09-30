import {
  type OrderRecord,
  isOrderAwaitingApproval,
  isOrderDelivered,
} from "@/services/OrderService";
import { formatQuantityWithUnit } from "@/utils/productUnits";

/** What a buyer needs to see about an order, flattened for a table row. */
export interface BuyerOrderRow {
  id: string;
  item: string;
  image: string;
  quantity: string;
  amount: number;
  seller: string;
  date: string;
  /** Plain-language state, not the backend enum. */
  statusLabel: string;
  statusTone: string;
  /** Unpaid and not yet submitted — the only row that offers an action. */
  canPay: boolean;
  record: OrderRecord;
}

type ApiObject = Record<string, unknown>;

const asObject = (v: unknown): ApiObject =>
  v && typeof v === "object" ? (v as ApiObject) : {};

const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v ? v : fallback;

const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : fallback;

const formatDate = (raw?: string): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/**
 * The state a buyer actually cares about, derived rather than shown raw.
 *
 * The backend enum ("pending", "payment_pending", "paid", "delivered") mixes
 * payment and delivery, so it is translated here into one readable phrase.
 */
const describeStatus = (
  o: OrderRecord,
): { label: string; tone: string; canPay: boolean } => {
  if (isOrderDelivered(o)) {
    return { label: "Delivered", tone: "bg-[#eaf6ea] text-[#2a6b2a]", canPay: false };
  }
  if (isOrderAwaitingApproval(o)) {
    return {
      label: "Awaiting confirmation",
      tone: "bg-[#fff4e5] text-[#b26a00]",
      canPay: false,
    };
  }
  const status = (o.status ?? "").toLowerCase();
  if (status === "pending") {
    return { label: "Payment due", tone: "bg-[#fdecea] text-[#c0392b]", canPay: true };
  }
  if (status === "paid") {
    const transport = (o.transportStatus ?? "").toLowerCase();
    if (transport === "picked")
      return { label: "Picked up", tone: "bg-[#e8f0fe] text-[#2563eb]", canPay: false };
    if (transport === "on_transit")
      return { label: "In transit", tone: "bg-[#e8f0fe] text-[#2563eb]", canPay: false };
    return {
      label: "Awaiting transport",
      tone: "bg-[#f1f1f1] text-[#2b2b2b]",
      canPay: false,
    };
  }
  return { label: "—", tone: "bg-[#f1f1f1] text-[#808080]", canPay: false };
};

export const orderToRow = (record: OrderRecord): BuyerOrderRow | null => {
  const o = record as unknown as ApiObject;
  const id = asString(o._id ?? o.id);
  if (!id) return null;

  const products = Array.isArray(o.products) ? (o.products as unknown[]) : [];
  const firstLine = asObject(products[0]);
  const firstProduct = asObject(firstLine.product ?? firstLine);
  const images = Array.isArray(firstProduct.images)
    ? (firstProduct.images as unknown[])
    : [];
  const owner = asObject(firstProduct.owner);

  const totalQty = products.reduce<number>(
    (sum, p) => sum + asNumber(asObject(p).quantity, 0),
    0,
  );
  const unit = asString(firstLine.unit ?? firstProduct.unit, "");
  const extra = products.length - 1;
  const name = asString(firstProduct.name, "Order");

  const status = describeStatus(record);

  return {
    id,
    item: extra > 0 ? `${name} +${extra} more` : name,
    image: asString(images[0], "/images/noData.png"),
    quantity: totalQty ? formatQuantityWithUnit(totalQty, unit) : "—",
    amount: asNumber(o.totalAmount, 0),
    seller: asString(owner.businessName ?? owner.name, "—"),
    date: formatDate(asString(o.createdAt)),
    statusLabel: status.label,
    statusTone: status.tone,
    canPay: status.canPay,
    record,
  };
};

export const toRows = (orders: unknown): BuyerOrderRow[] =>
  (Array.isArray(orders) ? (orders as OrderRecord[]) : [])
    .map(orderToRow)
    .filter((r): r is BuyerOrderRow => r !== null);
