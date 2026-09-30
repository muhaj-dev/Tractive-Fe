"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Transaction } from "@/utils/TransactionDataTypes";
import {
  AdminTransactionMethod,
  AdminTransactionStatus,
  transactionService,
} from "@/services/transactionService";
import { Approved } from "./_components/transactionType/Approved";
import { Pending } from "./_components/transactionType/Pending";
import { Refunded } from "./_components/transactionType/Refunded";
import { Failed } from "./_components/transactionType/Failed";
import { All } from "./_components/transactionType/All";
import { TransactionDetailModal } from "./_components/TransactionDetailModal";
import { ConfirmActionModal } from "../_components/ConfirmActionModal";
import { TableSkeleton } from "../_components/TableSkeleton";

type SlideType = "All" | "Pending" | "Approved" | "Failed" | "Refunded";

interface IndicatorStyle {
  left: number;
  width: number;
}

interface TabConfig {
  id: string;
  label: SlideType;
  displayLabel: string;
  count: number;
  textColor: string;
  colorClass: string;
  colorClassFaded: string;
}

const apiStatusToUi = (s: string): Transaction["status"] => {
  const v = (s || "").toLowerCase();
  if (v === "approved") return "Approved";
  if (v === "rejected") return "Failed";
  if (v === "refunded") return "Refunded";
  return "Pending";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapToTransaction = (t: any): Transaction => {
  const payer = t?.payer ?? {};
  const payee = t?.payee ?? (Array.isArray(t?.payees) ? t.payees[0] : null) ?? {};
  // The API now returns products at the top level, but older payloads may nest them under order.products[].product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: any[] = Array.isArray(t?.products)
    ? t.products
    : Array.isArray(t?.order?.products)
      ? t.order.products
      : [];
  const firstRaw = products[0] ?? {};
  const firstProduct = firstRaw?.product ?? firstRaw ?? {};
  const firstProductImage: string | undefined =
    Array.isArray(firstProduct?.images) && firstProduct.images[0]
      ? firstProduct.images[0]
      : undefined;

  return {
    id: (t?._id as string) || (t?.id as string) || "",
    image: (payer?.avatar as string) || "",
    fullname: (payer?.name as string) || "Unknown",
    email: (payer?.email as string) || "",
    paidTo: (payee?.name as string) || "—",
    paymentMethod:
      (t?.method as string) === "card" ? "Credit Card" : "Transfer",
    Amount:
      typeof t?.amount === "number" ? `₦${t.amount.toLocaleString()}` : "—",
    date: t?.createdAt
      ? new Date(t.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
    checked: false,
    status: apiStatusToUi(t?.status as string),
    productName: (firstProduct?.name as string) || undefined,
    productImage: firstProductImage,
    productCount: products.length,
  };
};

const tabToApiStatus = (
  tab: SlideType,
): AdminTransactionStatus | undefined => {
  switch (tab) {
    case "Approved":
      return "approved";
    case "Failed":
      return "rejected";
    case "Refunded":
      return "refunded";
    case "Pending":
      return "pending";
    case "All":
    default:
      return undefined;
  }
};

export default function TransactionPage() {
  const [activeTab, setActiveTab] = useState<SlideType>("All");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allChecked, setAllChecked] = useState<boolean>(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSizeOptions = [5, 10, 20, 50];
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const [methodFilter, setMethodFilter] = useState<AdminTransactionMethod | "">(
    "",
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const toStartOfDayIso = (d: string) =>
    d ? new Date(`${d}T00:00:00.000Z`).toISOString() : undefined;
  const toEndOfDayIso = (d: string) =>
    d ? new Date(`${d}T23:59:59.999Z`).toISOString() : undefined;

  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
  });

  const [counts, setCounts] = useState<Record<SlideType, number>>({
    All: 0,
    Pending: 0,
    Approved: 0,
    Failed: 0,
    Refunded: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await transactionService.getAllTransactions({
        status: tabToApiStatus(activeTab),
        method: methodFilter || undefined,
        fromDate: toStartOfDayIso(fromDate),
        toDate: toEndOfDayIso(toDate),
        page,
        limit,
      });
      setTransactions(res.data.map(mapToTransaction));
      setTotalItems(res.pagination?.total ?? res.data.length);
      setCounts((c) => ({
        ...c,
        [activeTab]: res.pagination?.total ?? res.data.length,
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch transactions",
      );
      setTransactions([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, limit, methodFilter, fromDate, toDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [methodFilter, fromDate, toDate]);

  const clearFilters = () => {
    setMethodFilter("");
    setFromDate("");
    setToDate("");
  };

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "all-tab",
        label: "All",
        displayLabel: "All",
        count: counts.All,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "pending-tab",
        label: "Pending",
        displayLabel: "Pending",
        count: counts.Pending,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "approved-tab",
        label: "Approved",
        displayLabel: "Approved",
        count: counts.Approved,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "failed-tab",
        label: "Failed",
        displayLabel: "Failed",
        count: counts.Failed,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "refunded-tab",
        label: "Refunded",
        displayLabel: "Refunded",
        count: counts.Refunded,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
    ],
    [counts],
  );

  const handleSwitchTab = (tab: SlideType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
  };

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    id: string;
  } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const handleApprove = (id: string) => setConfirmAction({ type: "approve", id });
  const handleDecline = (id: string) => setConfirmAction({ type: "reject", id });
  // Refund requires a reason, so route this action through the detail modal form.
  const handleRefund = (id: string) => setDetailId(id);
  const handleViewProfile = (id: string) => setDetailId(id);

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const status: "approved" | "rejected" =
      confirmAction.type === "approve" ? "approved" : "rejected";
    setIsSubmittingAction(true);
    try {
      await transactionService.adminUpdateTransactionStatus(
        confirmAction.id,
        status,
      );
      toast.success(`Transaction ${status}`);
      setConfirmAction(null);
      fetchTransactions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update transaction",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCheckboxChange = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
    );
  };

  const handleSelectAll = () => {
    const next = !allChecked;
    setAllChecked(next);
    setTransactions((prev) => prev.map((t) => ({ ...t, checked: next })));
  };

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabIndex = tabs.findIndex((tab) => tab.label === activeTab);
      const activeContainer = tabRefs.current[activeTabIndex];
      const container = containerRef.current;
      if (activeContainer && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeContainer.getBoundingClientRect();
        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    };
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  const renderContent = () => {
    if (isLoading) {
      return <TableSkeleton columns={7} rows={limit > 6 ? 6 : limit} />;
    }
    if (transactions.length === 0) {
      const hasFilters = !!methodFilter || !!fromDate || !!toDate;
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#538e53]/10 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#538e53]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="font-montserrat font-medium text-sm text-[#2b2b2b] mb-1">
            {activeTab === "All"
              ? "No transactions"
              : `No ${activeTab.toLowerCase()} transactions`}
          </p>
          <p className="font-montserrat text-xs text-[#808080] max-w-[320px]">
            {hasFilters
              ? "No transactions match the current filters. Try clearing them or switching to another tab."
              : activeTab === "All"
                ? "There are no transactions to show right now."
                : `There are no ${activeTab.toLowerCase()} transactions to show right now.`}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-xs font-montserrat text-[#538e53] border border-[#538e53] rounded-md hover:bg-[#538e53]/5 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      );
    }
    const componentMap: Record<SlideType, React.ReactNode> = {
      All: (
        <All
          transactions={transactions}
          handleApprove={handleApprove}
          handleDecline={handleDecline}
          handleRefund={handleRefund}
          handleViewProfile={handleViewProfile}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={setDetailId}
        />
      ),
      Pending: (
        <Pending
          transactions={transactions}
          handleApprove={handleApprove}
          handleDecline={handleDecline}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={setDetailId}
        />
      ),
      Approved: (
        <Approved
          transactions={transactions}
          handleRefund={handleRefund}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={setDetailId}
        />
      ),
      Failed: (
        <Failed
          transactions={transactions}
          handleApprove={handleApprove}
          handleDecline={handleDecline}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={setDetailId}
        />
      ),
      Refunded: (
        <Refunded
          transactions={transactions}
          handleViewProfile={handleViewProfile}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={setDetailId}
        />
      ),
    };
    return componentMap[activeTab];
  };

  return (
    <div className="w-[95%] mx-auto mb-5 rounded-[10px] bg-[#fefefe] shadow-md">
      <h1 className="mb-4 px-6 pt-6 text-base font-normal font-montserrat sm:text-lg">
        Transactions
      </h1>

      <div className="px-6 pb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wide text-gray-500 font-montserrat mb-1">
            Method
          </label>
          <select
            value={methodFilter}
            onChange={(e) =>
              setMethodFilter(e.target.value as AdminTransactionMethod | "")
            }
            className="border border-gray-300 rounded-md px-2.5 py-2 text-xs font-montserrat bg-white focus:outline-none focus:border-[#538e53] cursor-pointer min-w-[140px]"
          >
            <option value="">All methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wide text-gray-500 font-montserrat mb-1">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || undefined}
            className="border border-gray-300 rounded-md px-2.5 py-2 text-xs font-montserrat bg-white focus:outline-none focus:border-[#538e53]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wide text-gray-500 font-montserrat mb-1">
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
            className="border border-gray-300 rounded-md px-2.5 py-2 text-xs font-montserrat bg-white focus:outline-none focus:border-[#538e53]"
          />
        </div>

        {(methodFilter || fromDate || toDate) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-col overflow-x-auto flex-nowrap">
        <div
          className="relative mb-2 flex items-center gap-3 px-6 flex-nowrap"
          ref={containerRef}
          role="tablist"
          aria-label="Transaction management tabs"
        >
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className="cursor-pointer relative flex items-center gap-1 flex-shrink-0"
              role="tab"
              id={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
            >
              <button
                role="tab"
                id={tab.id}
                onClick={() => handleSwitchTab(tab.label)}
                className={`cursor-pointer px-2 text-sm font-medium sm:text-base ${
                  activeTab === tab.label ? tab.textColor : "text-[#2b2b2b]"
                } transition-colors duration-200`}
                aria-selected={activeTab === tab.label}
                aria-controls={`${tab.label.toLowerCase()}-panel`}
              >
                {tab.displayLabel}
              </button>
            </div>
          ))}
          <motion.div
            className={`absolute -bottom-2 h-[3.7px] rounded-t-[10px] ${
              tabs.find((tab) => tab.label === activeTab)?.colorClass ||
              "bg-green-600"
            }`}
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        <div className="h-[1px] w-[100%] bg-gray-200" />
      </div>

      <div
        className="mb-4"
        role="tabpanel"
        id={`${activeTab.toLowerCase()}-panel`}
        aria-labelledby={tabs.find((tab) => tab.label === activeTab)?.id}
      >
        {renderContent()}
      </div>

      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-xs font-montserrat text-gray-600">
            <span>Rows per page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs font-montserrat bg-white focus:outline-none focus:border-[#538e53] cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="ml-3 text-gray-500">
              Showing {(page - 1) * limit + 1}–
              {Math.min(page * limit, totalItems)} of {totalItems}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-montserrat text-gray-600 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <TransactionDetailModal
        isOpen={!!detailId}
        transactionId={detailId}
        onClose={() => setDetailId(null)}
        onUpdated={fetchTransactions}
      />

      <ConfirmActionModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "approve"
            ? "Approve transaction?"
            : "Reject transaction?"
        }
        description={
          confirmAction?.type === "approve"
            ? "This marks the transaction as approved. The buyer and seller will be notified."
            : "This marks the transaction as rejected. The buyer will be notified and may need to retry."
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Reject"}
        tone={confirmAction?.type === "approve" ? "success" : "danger"}
        isSubmitting={isSubmittingAction}
        onCancel={() => !isSubmittingAction && setConfirmAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
