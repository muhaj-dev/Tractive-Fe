"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAdminFleetPayments } from "@/hooks/queries/useTransporterQueries";
import {
  AdminFleetPaymentRecord,
  FleetPaymentParty,
  FleetPaymentStatus,
  fleetService,
} from "@/services/fleetService";
import {
  FleetPaymentsTable,
  FleetPaymentRow,
} from "./_components/FleetPaymentsTable";
import { FleetPaymentDetailModal } from "./_components/FleetPaymentDetailModal";
import { ConfirmActionModal } from "../_components/ConfirmActionModal";
import { TableSkeleton } from "../_components/TableSkeleton";

type SlideType = "All" | "Pending" | "Approved" | "Rejected" | "Refunded";

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

const stringField = <T,>(
  source: T | undefined,
  key: string,
): string | undefined => {
  if (!source || typeof source !== "object") return undefined;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

const partyField = (
  source: string | FleetPaymentParty | undefined,
  key: keyof FleetPaymentParty,
): string | undefined => {
  if (!source || typeof source !== "object") return undefined;
  const value = source[key];
  return typeof value === "string" ? value : undefined;
};

const mapToRow = (p: AdminFleetPaymentRecord): FleetPaymentRow => {
  const fleet = typeof p.fleet === "object" ? p.fleet : undefined;
  const fleetName =
    stringField(fleet, "fleetName") ||
    stringField(fleet, "plateNumber") ||
    "Fleet";
  const fleetImg =
    stringField(fleet, "image") ||
    (Array.isArray((fleet as { images?: string[] })?.images)
      ? (fleet as { images?: string[] })?.images?.[0]
      : undefined);

  const buyer = p.buyer ?? p.payer;

  return {
    id: (p._id || p.id) as string,
    status: ((p.status as string) || "pending").toLowerCase(),
    payerName: partyField(buyer, "name") || partyField(buyer, "email") || "—",
    payerEmail: partyField(buyer, "email") || "",
    payerAvatar: partyField(buyer, "avatar") || "",
    fleetName,
    fleetImage: fleetImg,
    plateNumber: stringField(fleet, "plateNumber"),
    amount: typeof p.amount === "number" ? p.amount : undefined,
    paymentMethod: p.paymentMethod,
    reason:
      typeof p.refundReason === "string" ? p.refundReason : p.reason,
    createdAt: p.createdAt,
  };
};

const tabToApiStatus = (tab: SlideType): FleetPaymentStatus | undefined => {
  switch (tab) {
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    case "Refunded":
      return "refunded" as FleetPaymentStatus;
    case "Pending":
      return "pending";
    default:
      return undefined;
  }
};

export default function FleetPaymentsPage() {
  const [activeTab, setActiveTab] = useState<SlideType>("All");
  const [allChecked, setAllChecked] = useState<boolean>(false);
  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const pageSizeOptions = [5, 10, 20, 50];

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
    Rejected: 0,
    Refunded: 0,
  });

  const { data, isLoading, refetch } = useAdminFleetPayments({
    status: tabToApiStatus(activeTab),
    page,
    limit,
  });

  const rawList = useMemo(() => data?.data ?? [], [data]);
  const totalItems = data?.pagination?.total ?? rawList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  useEffect(() => {
    setCounts((prev) => ({
      ...prev,
      [activeTab]: data?.pagination?.total ?? rawList.length,
    }));
  }, [activeTab, data, rawList.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const rows = useMemo(() => rawList.map(mapToRow), [rawList]);

  const visibleRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        checked: checkedRowIds.has(r.id),
      })),
    [rows, checkedRowIds],
  );

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    id: string;
  } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const handleApprove = (id: string) => setConfirmAction({ type: "approve", id });
  const handleReject = (id: string) => setConfirmAction({ type: "reject", id });
  // Refund needs a reason — route through the detail modal form.
  const handleRefund = (id: string) => setDetailId(id);

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const status: "approved" | "rejected" =
      confirmAction.type === "approve" ? "approved" : "rejected";
    setIsSubmittingAction(true);
    try {
      await fleetService.adminUpdateFleetPaymentStatus(confirmAction.id, {
        status,
      });
      toast.success(`Fleet payment ${status}`);
      setConfirmAction(null);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update fleet payment",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCheckboxChange = (id: string) => {
    setCheckedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = !allChecked;
    setAllChecked(next);
    setCheckedRowIds(next ? new Set(rows.map((r) => r.id)) : new Set());
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
        id: "rejected-tab",
        label: "Rejected",
        displayLabel: "Rejected",
        count: counts.Rejected,
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
    setAllChecked(false);
    setCheckedRowIds(new Set());
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
      return <TableSkeleton columns={6} rows={limit > 6 ? 6 : limit} />;
    }
    if (visibleRows.length === 0) {
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
            No {activeTab.toLowerCase() === "all" ? "" : activeTab.toLowerCase()} fleet payments
          </p>
          <p className="font-montserrat text-xs text-[#808080] max-w-[320px]">
            There are no fleet payments to show right now.
          </p>
        </div>
      );
    }
    return (
      <FleetPaymentsTable
        rows={visibleRows}
        handleApprove={handleApprove}
        handleReject={handleReject}
        handleRefund={handleRefund}
        handleCheckboxChange={handleCheckboxChange}
        handleSelectAll={handleSelectAll}
        allChecked={allChecked}
        onRowClick={setDetailId}
      />
    );
  };

  return (
    <div className="w-[95%] mx-auto mb-5 rounded-[10px] bg-[#fefefe] shadow-md">
      <h1 className="mb-4 px-6 pt-6 text-base font-normal font-montserrat sm:text-lg">
        Fleet Payments
      </h1>

      <div className="flex flex-col overflow-x-auto flex-nowrap">
        <div
          className="relative mb-2 flex items-center gap-3 px-6 flex-nowrap"
          ref={containerRef}
          role="tablist"
          aria-label="Fleet payment status tabs"
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

      <FleetPaymentDetailModal
        isOpen={!!detailId}
        paymentId={detailId}
        onClose={() => setDetailId(null)}
        onUpdated={refetch}
      />

      <ConfirmActionModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "approve"
            ? "Approve fleet payment?"
            : "Reject fleet payment?"
        }
        description={
          confirmAction?.type === "approve"
            ? "This marks the payment as approved. The transporter and buyer will be notified."
            : "This marks the payment as rejected. The buyer will be notified and may need to retry."
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
