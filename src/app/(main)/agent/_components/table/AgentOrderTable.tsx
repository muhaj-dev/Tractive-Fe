"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import "../../Table.css";
import { TableList } from "./TableList";
import { ActionMenuProps } from "../ActionMenuProps";
import { copyToClipboard } from "@/utils/Clipboard";
import { IdCopyIcon } from "../../produce-list/_components/table/ProductRow";
import { CustomerCareModal } from "../../pending/_components/CustomerCareModal";
import {
  Order,
  OrderRecord,
  OrdersApiService,
  mapOrderRecord,
  isOrderDelivered,
} from "@/services/OrderService";
import {
  useOrders,
  orderKeys,
} from "@/hooks/queries/useOrderQueries";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { OrderDetailsModal } from "../OrderDetailsModal";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

const productColumns: ColumnConfig<Order>[] = [
  {
    header: "Item",
    key: "name",
    minWidth: "min-w-[150px]",
    render: (product) => {
      const description = product.description ?? "";
      const descriptionWords = description.split(" ");
      return (
        <div className="flex items-center gap-2">
          <Image
            src={product.image || "/images/noData.png"}
            alt={product.name || "Product"}
            width={53}
            height={30}
            className="object-cover w-[55px] h-[31px] sm:w-[73px] sm:h-[40px]"
          />
          <div className="flex flex-col">
            <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#2b2b2b]">
              {product.name || "—"}
            </span>
            <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#2b2b2b]">
              <span className="inline sm:hidden">
                {descriptionWords.slice(0, 2).join(" ")}
                {descriptionWords.length > 2 ? "..." : ""}
              </span>
              <span className="hidden sm:inline">{description}</span>
            </span>
          </div>
        </div>
      );
    },
  },
  {
    header: "ID",
    key: "id",
    minWidth: "min-w-[100px]",
    render: (product) => (
      <div className="flex items-center gap-2">
        <span>{product.id}</span>
        <button
          onClick={() => copyToClipboard(product.id)}
          title="Copy Product ID"
          aria-label="Copy Product ID"
          className="cursor-pointer"
        >
          <IdCopyIcon />
        </button>
      </div>
    ),
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[100px]",
    render: (product) =>
      typeof product.amount === "number" ? `₦${product.amount.toFixed(2)}` : "—",
  },
  {
    header: "Buyer",
    key: "buyer",
    minWidth: "min-w-[100px]",
  },
  {
    header: "Location",
    key: "location",
    minWidth: "min-w-[100px]",
  },
  {
    header: "Date",
    key: "date",
    minWidth: "min-w-[100px]",
  },
];

const years = Array.from({ length: 2025 - 2019 + 1 }, (_, i) => 2019 + i);
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

export interface AgentOrderTableProps {
  /** API status filter for this tab's orders. */
  status: "pending" | "parked" | "delivered";
  /** TableList data-type key (drives checkbox column + action gating). */
  dataType: "new" | "parked" | "delivered";
  ActionMenuComponent: React.ComponentType<ActionMenuProps>;
  /** Status this tab's row "advances" to via its action menu (omit for a terminal tab). */
  nextStatus?: "parked" | "delivered";
  emptyTitle: string;
  emptyHint: string;
  searchAriaLabel: string;
}

/**
 * Shared agent order table used by the New / Packed / Delivered tabs.
 * Reads through the cached `useOrders` query (keyed by status + filters) and
 * keeps a local copy for checkbox selection. Replaces nine near-identical
 * per-folder table components.
 */
export const AgentOrderTable: React.FC<AgentOrderTableProps> = ({
  status,
  dataType,
  ActionMenuComponent,
  nextStatus,
  emptyTitle,
  emptyHint,
  searchAriaLabel,
}) => {
  // Surface offline/online transitions like the original tables did.
  useNetworkStatus();
  const queryClient = useQueryClient();

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [products, setProducts] = useState<Order[]>([]);
  const [isCustomerCareOpen, setIsCustomerCareOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  // Full order-details modal — opened from the row action menu. Reuses the raw
  // record already cached by the list query (no extra fetch).
  const [detailsOrder, setDetailsOrder] = useState<OrderRecord | null>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: queryData,
    isLoading,
    isError,
  } = useOrders({
    // Delivered orders keep the backend status `paid` ("parked" in UI terms) —
    // delivery is recorded on `transportStatus`. Asking the API for
    // `status=delivered` therefore returns nothing, so the Delivered tab reads
    // the same list as Packed and the two are split client-side below.
    status: dataType === "delivered" ? "parked" : status,
    search: debouncedSearch || undefined,
    year: selectedYear || undefined,
    month: selectedMonth
      ? String(months.indexOf(selectedMonth) + 1).padStart(2, "0")
      : undefined,
  });

  const mappedData = useMemo(() => {
    if (!Array.isArray(queryData)) return [];
    const rows =
      dataType === "delivered"
        ? queryData.filter(isOrderDelivered)
        : dataType === "parked"
          ? queryData.filter((o) => !isOrderDelivered(o))
          : queryData;
    return rows.map(mapOrderRecord);
  }, [queryData, dataType]);

  // Sync query data into local state so checkbox toggles stay client-side.
  useEffect(() => {
    setProducts(mappedData);
  }, [mappedData]);

  const error = isError ? "Failed to load orders. Please try again." : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setIsYearOpen(false);
      }
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMonthOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsYearOpen(false);
        setIsMonthOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Open the full order-details modal for the clicked row, sourcing the raw
  // record from the cached list so every backend field is available.
  const handleBuyerInfo = (id: string) => {
    const record = Array.isArray(queryData)
      ? queryData.find((o) => (o._id ?? o.id) === id)
      : undefined;
    if (record) setDetailsOrder(record);
  };

  // Advance the order to its next status, then refresh every order list
  // (table rows + page tab counts) from the cache.
  const handleAdvance = async (id: string) => {
    if (!nextStatus) return;
    try {
      await OrdersApiService.updateOrderStatus(id, nextStatus);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  // Opens the themed Customer Care modal (was a native alert()).
  // The numbers inside it are still hardcoded — see BACKEND_API_REQUIREMENTS.md §4.1.
  const handleCustomerCare = () => {
    setIsCustomerCareOpen(true);
  };

  const handleCheckboxChange = (id: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)),
    );
  };

  const handleSelectAll = () => {
    const allChecked = products.length > 0 && products.every((p) => p.checked);
    setProducts(products.map((p) => ({ ...p, checked: !allChecked })));
  };

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full mx-auto">
      <div className="w-full bg-[#FAF7F7] mt-4 py-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
            <div className="relative w-[100%] sm:w-[70%] flex-grow">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 py-2 border-[1px] rounded-[4px] text-sm sm:text-base focus:outline-none sm:h-[45px] focus:ring-[#2B9B1E] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                aria-label={searchAriaLabel}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon stroke="#808080" className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <div className="relative flex-1" ref={yearDropdownRef}>
                <button
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className="px-3 pl-8 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                  role="combobox"
                  aria-expanded={isYearOpen}
                  aria-controls="year-dropdown"
                  aria-label={selectedYear ? "Selected year" : "Select year"}
                >
                  {selectedYear || "Year"}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">
                    {isYearOpen ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">
                    <CalenderIcon />
                  </div>
                </button>
                <AnimatePresence>
                  {isYearOpen && (
                    <motion.div
                      id="year-dropdown"
                      className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
                      role="listbox"
                      variants={dropdownVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div
                        onClick={() => {
                          setSelectedYear("");
                          setIsYearOpen(false);
                        }}
                        className={`px-3 py-1 text-sm sm:text-base cursor-pointer hover:bg-gray-100 ${
                          selectedYear === "" ? "bg-gray-200" : ""
                        }`}
                        role="option"
                        aria-selected={selectedYear === ""}
                      >
                        Year
                      </div>
                      {years.map((year) => (
                        <div
                          key={year}
                          onClick={() => {
                            setSelectedYear(year.toString());
                            setIsYearOpen(false);
                          }}
                          className={`px-3 py-1 text-sm sm:text-base cursor-pointer hover:bg-gray-100 ${
                            selectedYear === year.toString()
                              ? "bg-gray-200"
                              : ""
                          }`}
                          role="option"
                          aria-selected={selectedYear === year.toString()}
                        >
                          {year}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative flex-1" ref={monthDropdownRef}>
                <button
                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                  className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                  role="combobox"
                  aria-expanded={isMonthOpen}
                  aria-controls="month-dropdown"
                  aria-label={selectedMonth ? "Selected month" : "Select month"}
                >
                  {selectedMonth || "Month"}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">
                    {isMonthOpen ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {isMonthOpen && (
                    <motion.div
                      id="month-dropdown"
                      className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
                      role="listbox"
                      variants={dropdownVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div
                        onClick={() => {
                          setSelectedMonth("");
                          setIsMonthOpen(false);
                        }}
                        className={`px-3 py-1 text-sm sm:text-base cursor-pointer hover:bg-gray-100 ${
                          selectedMonth === "" ? "bg-gray-200" : ""
                        }`}
                        role="option"
                        aria-selected={selectedMonth === ""}
                      >
                        Month
                      </div>
                      {months.map((month) => (
                        <div
                          key={month}
                          onClick={() => {
                            setSelectedMonth(month);
                            setIsMonthOpen(false);
                          }}
                          className={`px-3 py-1 text-sm sm:text-base cursor-pointer hover:bg-gray-100 ${
                            selectedMonth === month ? "bg-gray-200" : ""
                          }`}
                          role="option"
                          aria-selected={selectedMonth === month}
                        >
                          {month}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 px-6 py-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#538e53]"></div>
          <span className="ml-3 text-[#538e53]">Loading orders...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Image
            src="/images/noData.png"
            alt="No Data"
            width={106}
            height={60}
            priority
          />
          <p className="text-[13px] font-montserrat mb-2 mt-4">{emptyTitle}</p>
          <p className="text-[11px] font-montserrat text-center px-4">
            {searchQuery || selectedYear || selectedMonth
              ? "Try adjusting your filters or search query"
              : emptyHint}
          </p>
        </div>
      ) : (
        <div className="mt-6 w-full">
          <TableList<Order>
            dataType={dataType}
            columns={productColumns}
            initialData={products}
            ActionMenuComponent={ActionMenuComponent}
            handleBuyerInfo={handleBuyerInfo}
            handleParked={handleAdvance}
            handleDelivered={handleAdvance}
            handleCustomerCare={handleCustomerCare}
            handleCheckboxChange={handleCheckboxChange}
            handleSelectAll={handleSelectAll}
            allChecked={products.length > 0 && products.every((p) => p.checked)}
          />
        </div>
      )}

      <OrderDetailsModal
        order={detailsOrder}
        isOpen={detailsOrder !== null}
        onClose={() => setDetailsOrder(null)}
      />

      <CustomerCareModal
        isOpen={isCustomerCareOpen}
        onClose={() => setIsCustomerCareOpen(false)}
      />
    </div>
  );
};
