import {
  AdminUserHistoryItem,
  HistoryResource,
  HistoryRole,
} from "@/services/adminUserService";
import { formatQuantityWithUnit } from "@/utils/productUnits";

export interface HistoryColumn {
  header: string;
  key: string;
  minWidth?: string;
  render?: (item: AdminUserHistoryItem) => string;
}

const get = (item: AdminUserHistoryItem, ...paths: string[]): unknown => {
  for (const path of paths) {
    const parts = path.split(".");
    let cursor: unknown = item;
    let found = true;
    for (const part of parts) {
      if (cursor && typeof cursor === "object" && part in (cursor as object)) {
        cursor = (cursor as Record<string, unknown>)[part];
      } else {
        found = false;
        break;
      }
    }
    if (found && cursor !== undefined && cursor !== null && cursor !== "") {
      return cursor;
    }
  }
  return undefined;
};

const asString = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj.title === "string") return obj.title;
    if (typeof obj._id === "string") return obj._id;
  }
  return "—";
};

const formatDate = (value: unknown): string => {
  if (!value || typeof value !== "string") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const formatAmount = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return NGN.format(n);
};

const idShort = (value: unknown): string => {
  const s = asString(value);
  if (s === "—" || s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
};

const productNameFromLine = (line: unknown): string => {
  if (!line || typeof line !== "object") return "—";
  const obj = line as Record<string, unknown>;
  const nested = obj.product;
  if (nested && typeof nested === "object") {
    const nm = (nested as Record<string, unknown>).name;
    if (typeof nm === "string" && nm) return nm;
  }
  if (typeof obj.name === "string" && obj.name) return obj.name;
  if (typeof obj.productName === "string" && obj.productName) return obj.productName;
  return "—";
};

const ordersColumns: HistoryColumn[] = [
  {
    header: "Order ID",
    key: "id",
    minWidth: "min-w-[120px]",
    render: (item) => idShort(get(item, "_id", "id", "orderId")),
  },
  {
    header: "Products",
    key: "products",
    minWidth: "min-w-[180px]",
    render: (item) => {
      const products = get(item, "products");
      if (Array.isArray(products) && products.length > 0) {
        const names = products
          .map(productNameFromLine)
          .filter((n) => n !== "—");
        if (names.length === 0) return `${products.length} item(s)`;
        return names.length > 2
          ? `${names.slice(0, 2).join(", ")} +${names.length - 2}`
          : names.join(", ");
      }
      return asString(get(item, "productName", "title"));
    },
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[110px]",
    render: (item) => formatAmount(get(item, "totalAmount", "amount", "price")),
  },
  {
    header: "Payment",
    key: "status",
    minWidth: "min-w-[100px]",
    render: (item) => asString(get(item, "status")),
  },
  {
    header: "Transport",
    key: "transportStatus",
    minWidth: "min-w-[110px]",
    render: (item) => asString(get(item, "transportStatus")),
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

const transactionsColumns: HistoryColumn[] = [
  {
    header: "Transaction ID",
    key: "id",
    minWidth: "min-w-[140px]",
    render: (item) => idShort(get(item, "_id", "id", "transactionId", "reference")),
  },
  {
    header: "Order",
    key: "order",
    minWidth: "min-w-[140px]",
    render: (item) => idShort(get(item, "order._id", "order", "orderId")),
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[110px]",
    render: (item) => formatAmount(get(item, "amount", "totalAmount")),
  },
  {
    header: "Status",
    key: "status",
    minWidth: "min-w-[100px]",
    render: (item) => asString(get(item, "status")),
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

const transportPaymentsColumns: HistoryColumn[] = [
  {
    header: "Payment ID",
    key: "id",
    minWidth: "min-w-[140px]",
    render: (item) => idShort(get(item, "_id", "id", "paymentId", "reference")),
  },
  {
    header: "Trip / Order",
    key: "trip",
    minWidth: "min-w-[140px]",
    render: (item) => idShort(get(item, "trip", "tripId", "order", "orderId")),
  },
  {
    header: "Transporter",
    key: "transporter",
    minWidth: "min-w-[140px]",
    render: (item) => asString(get(item, "transporter.name", "transporterName", "transporter")),
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[110px]",
    render: (item) => formatAmount(get(item, "amount", "totalAmount")),
  },
  {
    header: "Status",
    key: "status",
    minWidth: "min-w-[100px]",
    render: (item) => asString(get(item, "status")),
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

const salesColumns: HistoryColumn[] = [
  {
    header: "Order ID",
    key: "id",
    minWidth: "min-w-[120px]",
    render: (item) => idShort(get(item, "orderId", "_id", "id", "saleId")),
  },
  {
    header: "Buyer",
    key: "buyer",
    minWidth: "min-w-[140px]",
    render: (item) => asString(get(item, "buyer.name", "buyerName", "buyer")),
  },
  {
    header: "Product",
    key: "product",
    minWidth: "min-w-[140px]",
    render: (item) => asString(get(item, "product.name", "productName", "title")),
  },
  {
    header: "Quantity",
    key: "quantity",
    minWidth: "min-w-[100px]",
    render: (item) => {
      const qty = asString(get(item, "quantity"));
      const unit = asString(get(item, "unit", "product.unit"));
      if (qty === "—") return "—";
      return unit !== "—" ? formatQuantityWithUnit(qty, unit) : qty;
    },
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[110px]",
    render: (item) =>
      formatAmount(
        get(item, "lineSubtotal", "amount", "totalAmount", "unitPrice", "price"),
      ),
  },
  {
    header: "Order Status",
    key: "orderStatus",
    minWidth: "min-w-[110px]",
    render: (item) => asString(get(item, "orderStatus", "status")),
  },
  {
    header: "Transport",
    key: "transportStatus",
    minWidth: "min-w-[110px]",
    render: (item) => asString(get(item, "transportStatus")),
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

const productsColumns: HistoryColumn[] = [
  {
    header: "Product",
    key: "name",
    minWidth: "min-w-[160px]",
    render: (item) => asString(get(item, "name", "title")),
  },
  {
    header: "Category",
    key: "category",
    minWidth: "min-w-[140px]",
    render: (item) => {
      const sub = asString(get(item, "subcategory"));
      let cat = asString(get(item, "category.name", "category"));
      if (cat === "—") {
        const list = get(item, "categories");
        if (Array.isArray(list) && list.length > 0) {
          cat = list.map((c) => String(c)).join(", ");
        }
      }
      if (cat !== "—" && sub !== "—") return `${cat} · ${sub}`;
      return cat !== "—" ? cat : sub;
    },
  },
  {
    header: "Price",
    key: "price",
    minWidth: "min-w-[110px]",
    render: (item) => formatAmount(get(item, "price", "amount")),
  },
  {
    header: "Quantity",
    key: "quantity",
    minWidth: "min-w-[100px]",
    render: (item) => {
      const qty = asString(get(item, "quantity", "stock"));
      const unit = asString(get(item, "unit"));
      if (qty === "—") return "—";
      return unit !== "—" ? formatQuantityWithUnit(qty, unit) : qty;
    },
  },
  {
    header: "Status",
    key: "status",
    minWidth: "min-w-[100px]",
    render: (item) => asString(get(item, "status")),
  },
  {
    header: "Created",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

const transporterPaymentsColumns: HistoryColumn[] = [
  {
    header: "Payment ID",
    key: "id",
    minWidth: "min-w-[140px]",
    render: (item) => idShort(get(item, "_id", "id", "paymentId", "reference")),
  },
  {
    header: "Trip / Order",
    key: "trip",
    minWidth: "min-w-[140px]",
    render: (item) => idShort(get(item, "trip", "tripId", "order", "orderId")),
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[110px]",
    render: (item) => formatAmount(get(item, "amount", "totalAmount")),
  },
  {
    header: "Status",
    key: "status",
    minWidth: "min-w-[100px]",
    render: (item) => asString(get(item, "status")),
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

const tripsColumns: HistoryColumn[] = [
  {
    header: "Trip ID",
    key: "id",
    minWidth: "min-w-[120px]",
    render: (item) => idShort(get(item, "_id", "id", "tripId")),
  },
  {
    header: "Pickup",
    key: "pickup",
    minWidth: "min-w-[120px]",
    render: (item) => asString(get(item, "pickup.address", "pickupAddress", "pickup", "from")),
  },
  {
    header: "Destination",
    key: "destination",
    minWidth: "min-w-[120px]",
    render: (item) => asString(get(item, "destination.address", "destinationAddress", "destination", "to")),
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[110px]",
    render: (item) => formatAmount(get(item, "amount", "fare", "totalAmount")),
  },
  {
    header: "Status",
    key: "status",
    minWidth: "min-w-[100px]",
    render: (item) => asString(get(item, "status", "transportStatus")),
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[110px]",
    render: (item) => formatDate(get(item, "createdAt", "date")),
  },
];

export const HISTORY_COLUMNS: Record<
  HistoryRole,
  Partial<Record<HistoryResource, HistoryColumn[]>>
> = {
  buyer: {
    orders: ordersColumns,
    transactions: transactionsColumns,
    "transport-payments": transportPaymentsColumns,
  },
  agent: {
    sales: salesColumns,
    products: productsColumns,
  },
  transporter: {
    orders: ordersColumns,
    payments: transporterPaymentsColumns,
    trips: tripsColumns,
  },
};

export const getHistoryColumns = (
  role: HistoryRole,
  resource: HistoryResource,
): HistoryColumn[] => HISTORY_COLUMNS[role]?.[resource] ?? [];

export const getHistoryRowId = (item: AdminUserHistoryItem, index: number): string => {
  const id = get(item, "_id", "id");
  return typeof id === "string" && id ? id : `row-${index}`;
};
