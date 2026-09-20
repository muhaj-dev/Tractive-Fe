"use client";
// Import necessary React hooks and libraries
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";// Adjust the import path as needed
import { PaidedTrack } from "./_components/PaidedTrack";
import { DeliveredTrack } from "./_components/DeliveredTrack";
import { TrackAgentInfoModal } from "./_components/TrackAgentInfoModal";
import { OrderData } from "@/utils/TrackAgentData";
import { useAgentTrackOrders } from "@/hooks/queries/useAdminTrackOrderQueries";
import {
  adminTrackOrderService,
  AgentTrackStatus,
} from "@/services/adminTrackOrderService";
import { TableSkeleton } from "../../_components/TableSkeleton";

// Define types for slide switching
type SlideType = "Paid" | "Delivered";

const TAB_TO_STATUS: Record<SlideType, AgentTrackStatus> = {
  Paid: "paid",
  Delivered: "delivered",
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Interface for tab indicator styles
interface IndicatorStyle {
  left: number;
  width: number;
}

// Interface for tab configuration
interface TabConfig {
  id: string;
  label: SlideType;
  displayLabel: string;
  count: number;
  textColor: string;
  colorClass: string;
  colorClassFaded: string;
}

// Main Track Agent component
export default function TrackAgentPage() {
  // State to track the currently active tab (Paid, Delivered)
  const [activeTab, setActiveTab] = useState<SlideType>("Paid");

  // Filters live here, not in the table components, so they reach the API.
  // Previously each table filtered only the rows already on screen.
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const pageSizeOptions = [5, 10, 20, 50];

  // Debounce search input (400ms) to avoid firing an API call on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Reset to first page whenever filters or the tab change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedYear, selectedMonth, activeTab]);

  // Fetch real track orders for the active tab's status (A7).
  const { data: ordersResponse, isLoading } = useAgentTrackOrders({
    status: TAB_TO_STATUS[activeTab],
    search: debouncedSearch || undefined,
    year: selectedYear || undefined,
    month: selectedMonth
      ? String(months.indexOf(selectedMonth) + 1)
      : undefined,
    page,
    limit,
  });

  const totalItems = ordersResponse?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // State to manage order data with checkbox status
  const [orderData, setOrderData] = useState<OrderData[]>([]);

  // Sync API data into local state (so checkbox toggles work).
  useEffect(() => {
    setOrderData(ordersResponse?.data ?? []);
  }, [ordersResponse]);

  // Lookup row → known name, so the info popups can show a name immediately
  // while the detail endpoint resolves.
  const orderById = useMemo(() => {
    const map = new Map<string, OrderData>();
    orderData.forEach((o) => map.set(o.id, o));
    return map;
  }, [orderData]);

  // Party details popup (A9): which order is open. Both parties are shown
  // in the one dialog, so there is no second thing to remember.
  const [infoOrderId, setInfoOrderId] = useState<string | null>(null);

  // State to track if all items in the active tab are checked
  const [allChecked, setAllChecked] = useState<boolean>(false);

  // Refs to store tab elements for calculating indicator position
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ref for the tab container to calculate relative positions
  const containerRef = useRef<HTMLDivElement>(null);

  // State for the sliding indicator's position and width
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
  });

  // Real per-status totals. These used to be `orderData.length` for BOTH tabs,
  // so the inactive tab echoed the active tab's count — and even the active
  // one was a page size, not a total. One cheap `limit: 1` probe per status
  // gives the true `pagination.total`; re-probed when the filters change so
  // the badges agree with what a tab would actually show.
  const [counts, setCounts] = useState<Record<SlideType, number>>({
    Paid: 0,
    Delivered: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const filters = {
      search: debouncedSearch || undefined,
      year: selectedYear || undefined,
      month: selectedMonth
        ? String(months.indexOf(selectedMonth) + 1)
        : undefined,
      limit: 1,
    };
    (async () => {
      try {
        const [paid, delivered] = await Promise.all([
          adminTrackOrderService.getAgentTrackOrders({
            ...filters,
            status: "paid",
          }),
          adminTrackOrderService.getAgentTrackOrders({
            ...filters,
            status: "delivered",
          }),
        ]);
        if (cancelled) return;
        setCounts({
          Paid: paid.pagination?.total ?? 0,
          Delivered: delivered.pagination?.total ?? 0,
        });
      } catch {
        // non-fatal — the badges just stay at their last known value
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedYear, selectedMonth]);

  // Define tab configuration
  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "paid-tab",
        label: "Paid",
        displayLabel: "Paid",
        count: counts.Paid,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "delivered-tab",
        label: "Delivered",
        displayLabel: "Delivered",
        count: counts.Delivered,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
    ],
    [counts]
  );

  // Handle tab switching
  const handleSwitchTab = (tab: SlideType) => {
    setActiveTab(tab);
    setAllChecked(false); // Reset select all when switching tabs
  };

  // Handle checkbox change for individual items
  const handleCheckboxChange = (id: string) => {
    setOrderData(
      orderData.map((order) =>
        order.id === id ? { ...order, checked: !order.checked } : order
      )
    );
  };

  // Handle select all checkboxes for the active tab
  const handleSelectAll = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);
    setOrderData(
      orderData.map((order) => ({ ...order, checked: newAllChecked }))
    );
  };

  // Opening a row shows that order's buyer and seller together. Rows whose
  // parties never loaded stay inert rather than opening an empty dialog.
  const handleRowClick = (id: string) => {
    if (orderById.has(id)) setInfoOrderId(id);
  };

  // Update the indicator position and width when activeTab changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeTabIndex = tabs.findIndex((tab) => tab.label === activeTab);
      const activeContainer = tabRefs.current[activeTabIndex];
      const container = containerRef.current;

      if (activeContainer && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeContainer.getBoundingClientRect();
        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;
        setIndicatorStyle({ left, width });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  // Render the appropriate component based on activeTab.
  //
  // Only the FIRST load takes over the panel. The search input lives inside the
  // table component, so swapping in a skeleton on every debounced refetch would
  // unmount it and drop focus mid-keystroke. Subsequent loads keep the previous
  // rows on screen (react-query's keepPreviousData) while the next page arrives.
  const renderContent = () => {
    if (isLoading && orderData.length === 0) {
      return <TableSkeleton columns={6} rows={6} />;
    }
    const filterProps = {
      searchTerm,
      onSearchChange: setSearchTerm,
      selectedYear,
      onYearChange: setSelectedYear,
      selectedMonth,
      onMonthChange: setSelectedMonth,
    };
    const componentMap: Record<SlideType, React.ReactNode> = {
      Paid: (
        <PaidedTrack
          order={orderData}
          onRowClick={handleRowClick}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          {...filterProps}
        />
      ),
      Delivered: (
        <DeliveredTrack
          order={orderData}
          onRowClick={handleRowClick}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          {...filterProps}
        />
      ),
    };
    return componentMap[activeTab];
  };

  // Main component render
  return (
    <div className="w-[95%] mx-auto mb-5 rounded-[10px] bg-[#fefefe] shadow-md">
      {/* Page title */}
      <h1 className="mb-4 px-6 pt-6 text-base font-normal font-montserrat sm:text-lg">
        Manage Orders
      </h1>
      <div className="flex flex-col overflow-x-auto flex-nowrap">
        {/* Tab navigation */}
        <div
          className="relative mb-2 flex items-center gap-3 px-6 flex-nowrap"
          ref={containerRef}
          role="tablist"
          aria-label="Approval management tabs"
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
              {/* Tab button */}
              <button
                role="tab"
                id={tab.id}
                onClick={() => handleSwitchTab(tab.label)}
                className={`cursor-pointer px-2 text-sm font-normal font-montserrat sm:text-base ${
                  activeTab === tab.label ? tab.textColor : "text-[#2b2b2b]"
                } transition-colors duration-200`}
                aria-selected={activeTab === tab.label}
                aria-controls={`${tab.label.toLowerCase()}-panel`}
              >
                {tab.displayLabel} ({tab.count})
              </button>
            </div>
          ))}
          {/* Animated tab indicator */}
          <motion.div
            className={`absolute -bottom-2 h-[3.7px] rounded-t-[10px] ${
              tabs.find((tab) => tab.label === activeTab)?.colorClass ||
              "bg-green-600"
            }`}
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        {/* Divider line */}
        <div className="h-[1px] w-[100%] bg-gray-200" />
      </div>

      {/* Content area for the active tab */}
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

      {infoOrderId && (
        <TrackAgentInfoModal
          buyer={orderById.get(infoOrderId)?.buyerInfo}
          sellers={orderById.get(infoOrderId)?.sellerInfos ?? []}
          onClose={() => setInfoOrderId(null)}
        />
      )}
    </div>
  );
}
