"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import { TableList } from "../../../_components/table/TableList";
import { CustomerCareModal } from "../CustomerCareModal";
import { TransactionDetailsModal } from "../../../_components/TransactionDetailsModal";
import { TransactionActionMenu } from "../TransactionAction/TransactionActionMenu";
import {
  transactionService,
  FrontendTransaction,
} from "@/services/transactionService";
import {
  useAgentTransactions,
  useUpdateTransactionStatus,
} from "@/hooks/queries/useTransactionQueries";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

interface PendingTableListProps {
  onCountChange?: (count: number) => void;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const transactionColumns: ColumnConfig<FrontendTransaction>[] = [
  {
    header: "Item",
    key: "name",
    minWidth: "min-w-[200px]",
    render: (transaction) => (
      <div className="flex items-center gap-2">
        <Image
          src={transaction.image || "/images/placeholder.png"}
          alt={transaction.name || "Product"}
          width={40}
          height={40}
          className="object-cover w-[40px] h-[40px] rounded flex-shrink-0"
        />
        <div className="flex flex-col min-w-0 max-w-[160px]">
          <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#2b2b2b]">
            {transaction.name}
          </span>
          <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#808080]">
            {transaction.description || "Product description"}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: "Sold",
    key: "sold",
    minWidth: "min-w-[100px]",
    render: (transaction) => `₦${(transaction.sold ?? 0).toLocaleString()}`,
  },
  {
    header: "Commission",
    key: "commission",
    minWidth: "min-w-[100px]",
    render: (transaction) =>
      `₦${Math.round(transaction.commission ?? 0).toLocaleString()}`,
  },
  {
    header: "Buyer",
    key: "buyer",
    minWidth: "min-w-[100px]",
    render: (transaction) => transaction.buyer?.name || "Unknown Buyer",
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[100px]",
    render: (transaction) => formatDate(transaction.createdAt),
  },
];

export const PendingTableList = ({ onCountChange }: PendingTableListProps) => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [isCustomerCareModalOpen, setIsCustomerCareModalOpen] =
    useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

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

  // Read pending transactions via React Query (cached + auto-refetch on
  // invalidation after an approve mutation).
  const {
    data: transactions = [],
    isLoading: loading,
    isError,
    error: queryError,
  } = useAgentTransactions({
    status: "pending",
    search: searchQuery || undefined,
    year: selectedYear || undefined,
    month: selectedMonth || undefined,
  });

  const error = isError
    ? (queryError as Error)?.message || "Failed to load transactions"
    : "";

  const { mutate: approveTransaction, isPending: isApproving } =
    useUpdateTransactionStatus();

  const [selectedTransaction, setSelectedTransaction] =
    useState<FrontendTransaction | null>(null);

  const handleApprove = (transactionId: string) => {
    approveTransaction({ id: transactionId, status: "approved" });
  };

  const handleViewDetails = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (tx) setSelectedTransaction(tx);
  };

  // Keep the parent tab badge in sync with the fetched list
  useEffect(() => {
    onCountChange?.(transactions.length);
  }, [transactions.length, onCountChange]);

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
        setIsCustomerCareModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCustomerCare = (transactionId: string) => {
    console.log(transactionId);
    setIsCustomerCareModalOpen(true);
  };

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  const hasActiveFilters = searchQuery || selectedYear || selectedMonth;
  const showNoData = !loading && transactions.length === 0;

  if (loading) {
    return (
      <div className="relative bg-[#fefefe] flex flex-col items-center w-[95%] mx-auto mb-[2rem] px-6 py-6 gap-3 rounded-[7px]">
        <div className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[14px] font-montserrat text-[#808080]">
              Loading transactions...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px]">
        <div className="w-full bg-[#FAF7F7] mt-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
              <div className="relative w-[100%] sm:w-[70%] flex-grow">
                <input
                  type="text"
                  placeholder="Search by item, ID, or buyer"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#E0A63A] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                  aria-label="Search transactions"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <SearchIcon
                    stroke="#808080"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                </div>
              </div>
              <div className="flex items-center w-full sm:w-auto">
                <div className="relative flex-1" ref={yearDropdownRef}>
                  <button
                    onClick={() => setIsYearOpen(!isYearOpen)}
                    className="px-3 pl-8 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#E0A63A]"
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
                        className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-auto"
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
                    className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#E0A63A]"
                    role="combobox"
                    aria-expanded={isMonthOpen}
                    aria-controls="month-dropdown"
                    aria-label={
                      selectedMonth ? "Selected month" : "Select month"
                    }
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
                        className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-auto"
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

        <div className="my-6 overflow-x-auto">
          {showNoData ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Image
                src="/images/noData.png"
                alt="No Data"
                width={106}
                height={60}
              />
              <p className="text-[13px] font-montserrat mb-2">
                No pending transactions found
              </p>
              <p className="text-[11px] font-montserrat">
                {hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : transactionService.isAuthenticated()
                  ? "No pending transactions at the moment"
                  : "Please login to view transactions"}
              </p>
            </div>
          ) : (
            <TableList<FrontendTransaction>
              dataType="pending"
              columns={transactionColumns}
              initialData={transactions}
              ActionMenuComponent={TransactionActionMenu}
              handleView={handleViewDetails}
              handleCustomerCare={handleCustomerCare}
              handleApprove={handleApprove}
              isApproving={isApproving}
            />
          )}
        </div>

        <CustomerCareModal
          isOpen={isCustomerCareModalOpen}
          onClose={() => {
            setIsCustomerCareModalOpen(false);
          }}
        />

        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </div>
    </div>
  );
};
