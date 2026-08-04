"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useOrders } from "@/hooks/queries/useOrderQueries";
import type { OrderRecord } from "@/services/OrderService";
import type {
  BuyerTransactionRow,
  BuyerTransactionStatus,
} from "./_components/transactionsData";
import { TransactionsFilters } from "./_components/TransactionsFilters";
import { TransactionsTable } from "./_components/TransactionsTable";
import { TableSkeleton } from "@/app/(main)/admin/_components/TableSkeleton";

type TabKey = "pending" | "paid";

const TABS: { key: TabKey; label: string; status: BuyerTransactionStatus }[] = [
  { key: "pending", label: "Pending", status: "pending" },
  { key: "paid", label: "Approved", status: "paid" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type ApiObject = Record<string, unknown>;

const asObject = (v: unknown): ApiObject =>
  v && typeof v === "object" ? (v as ApiObject) : {};

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v ? v : fallback;

const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : fallback;

const formatDate = (iso?: unknown): string => {
  if (typeof iso !== "string" || !iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const VALID_STATUSES: BuyerTransactionStatus[] = [
  "pending",
  "payment_pending",
  "paid",
  "delivered",
];

/**
 * Human label for the order's `paymentMethod`. This column used to be
 * hardcoded to "Bank transfer", which mislabelled every card payment.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  transfer: "Bank transfer",
  deposit: "Deposit",
  cheque: "Cheque",
};

const paymentMethodLabel = (raw: unknown): string => {
  const key = typeof raw === "string" ? raw.toLowerCase() : "";
  if (!key) return "—";
  return PAYMENT_METHOD_LABELS[key] ?? key.replace(/_/g, " ");
};

const orderToRow = (raw: OrderRecord): BuyerTransactionRow | null => {
  const o = raw as ApiObject;
  const id = asString(o._id ?? o.id);
  if (!id) return null;

  const products = asArray(o.products);
  const firstLine = asObject(products[0]);
  const firstProduct = asObject(firstLine.product ?? firstLine);
  const productImages = asArray(firstProduct.images);
  const totalQty = products.reduce<number>((sum, p) => {
    const line = asObject(p);
    return sum + asNumber(line.quantity, 0);
  }, 0);
  const unit = asString(firstLine.unit ?? firstProduct.unit, "");
  const status = (typeof o.status === "string" ? o.status : "") as string;
  // The seller is the owner of the ordered product. `o.buyer` is this buyer's
  // own id (a bare string), so reading it here left the column permanently "—".
  const seller = asObject(firstProduct.owner);

  return {
    id,
    productId: asString(firstProduct._id ?? firstProduct.id, "—"),
    item: asString(firstProduct.name, "—"),
    image: asString(productImages[0], "/images/maize.png"),
    quantity: totalQty ? `${totalQty}${unit ? ` ${unit}` : ""}` : "—",
    amount: asNumber(o.totalAmount, 0),
    seller: asString(seller.businessName ?? seller.name, "—"),
    method: paymentMethodLabel(o.paymentMethod),
    date: formatDate(o.createdAt),
    status: VALID_STATUSES.includes(status as BuyerTransactionStatus)
      ? (status as BuyerTransactionStatus)
      : "pending",
  };
};

export default function BuyerTransactionsPage() {
  const { data: ordersRaw, isLoading, isError, refetch } = useOrders();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    pending: null,
    paid: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const active = tabRefs.current[activeTab];
      const container = containerRef.current;
      if (active && container) {
        const cRect = container.getBoundingClientRect();
        const tRect = active.getBoundingClientRect();
        setIndicatorStyle({
          left: tRect.left - cRect.left,
          width: tRect.width,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab]);

  const allRows: BuyerTransactionRow[] = useMemo(() => {
    if (!Array.isArray(ordersRaw)) return [];
    return ordersRaw
      .map(orderToRow)
      .filter((r): r is BuyerTransactionRow => r !== null);
  }, [ordersRaw]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      pending: 0,
      paid: 0,
    };
    for (const r of allRows) {
      const tab = TABS.find((t) => t.status === r.status);
      if (tab) counts[tab.key]++;
    }
    return counts;
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const targetStatus = TABS.find((t) => t.key === activeTab)!.status;
    const q = searchQuery.toLowerCase();
    const monthIdx = selectedMonth ? MONTHS.indexOf(selectedMonth) + 1 : 0;
    const monthStr = monthIdx ? String(monthIdx).padStart(2, "0") : "";

    return allRows.filter((r) => {
      if (r.status !== targetStatus) return false;
      const matchesSearch =
        !q ||
        r.item.toLowerCase().includes(q) ||
        r.seller.toLowerCase().includes(q) ||
        r.productId.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      const matchesYear = !selectedYear || r.date.includes(selectedYear);
      const matchesMonth = !monthStr || r.date.includes(`/${monthStr}/`);
      return matchesSearch && matchesYear && matchesMonth;
    });
  }, [allRows, activeTab, searchQuery, selectedYear, selectedMonth]);

  return (
    <div className="bg-[#fefefe] rounded-[10px] shadow-sm flex flex-col">
      <div
        ref={containerRef}
        className="relative flex items-center gap-6 px-6 pt-5 overflow-x-auto"
        role="tablist"
        aria-label="Buyer transactions tabs"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-2 font-montserrat text-[14px] font-medium whitespace-nowrap cursor-pointer ${
                isActive ? "text-[#538e53]" : "text-[#2b2b2b]"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-montserrat font-medium rounded-[4px] px-[5px] py-[1px] min-w-[18px] flex items-center justify-center ${
                  isActive
                    ? "bg-[#538e53] text-[#fefefe]"
                    : "bg-[#f1f1f1] text-[#2b2b2b]"
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          );
        })}
        <motion.div
          className="absolute -bottom-[1px] h-[3px] rounded-t-[4px] bg-[#538e53]"
          animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </div>
      <div className="w-full h-px bg-[#e2e2e2]" />

      <TransactionsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      <div className="px-4 pb-6">
        {isLoading ? (
          <TableSkeleton
            columns={6}
            rows={6}
            showCheckbox={false}
            showAvatar
            showActionMenu
          />
        ) : isError ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500">
            <p className="text-base font-montserrat text-[#c0392b]">
              We couldn&apos;t load your transactions.
            </p>
            <p className="text-sm font-montserrat mt-1 mb-4">
              Please check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 rounded-full bg-[#538e53] text-white text-sm font-medium cursor-pointer hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <TransactionsTable rows={filteredRows} />
        )}
      </div>
    </div>
  );
}
