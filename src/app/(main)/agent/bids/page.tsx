"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { TableList } from "../_components/table/TableList";
import { BidActionMenu } from "./_components/BidActionMenu";
import { BiddersModal } from "./_components/BiddersModal";
import { bidService, BidListing } from "@/services/bidService";
import { toast } from "sonner";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

const bidsColumns: ColumnConfig<BidListing>[] = [
  {
    header: "Item",
    key: "productName",
    minWidth: "min-w-[200px]",
    render: (bid) => (
      <div className="flex items-center gap-3">
        <Image
          src={bid?.productImage || "/images/placeholder.png"}
          alt={bid?.productName}
          width={60}
          height={40}
          className="object-cover rounded-[5px] w-[60px] h-[40px]"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium font-montserrat text-[#2b2b2b]">
            {bid?.productName}
          </span>
          <span className="text-[11px] font-normal font-montserrat text-[#808080]">
            {bid?.productDescription && bid?.productDescription.length > 20
              ? bid?.productDescription.substring(0, 20) + "..."
              : bid?.productDescription || "No desc"}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: "Price",
    key: "productPrice",
    minWidth: "min-w-[100px]",
    render: (bid) => (
      <span className="text-[14px] font-semibold font-montserrat text-[#2b2b2b]">
        ₦{bid?.productPrice?.toLocaleString() || "0"}
      </span>
    ),
  },
  {
    header: "Bidder",
    key: "buyer",
    minWidth: "min-w-[120px]",
    render: (bid) => (
      <div className="flex items-center gap-2">
        {/* <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden relative bg-gray-200">
          <Image
            src={bid?.buyer?.avatar || "/images/placeholder-avatar.png"}
            alt={bid?.buyer?.name}
            fill
            className="object-cover"
          />
        </div> */}
        <span className="text-[12px] font-normal font-montserrat text-[#2b2b2b]">
          {bid?.buyer?.name || "Unknown"}
        </span>
      </div>
    ),
  },
  {
    header: "Leading",
    key: "proposedPrice",
    minWidth: "min-w-[120px]",
    render: (bid) => (
      <div className="flex items-center gap-2">
        {/* <div className="w-8 h-8 rounded-full bg-gray-200 border border-white overflow-hidden relative">
          <Image
            src={bid?.buyer?.avatar || "/images/placeholder-avatar.png"}
            alt="Leading"
            fill
            className="object-cover"
          />
        </div> */}
        <span className="text-[14px] font-bold font-montserrat text-[#2b2b2b]">
          ₦{bid?.proposedPrice?.toLocaleString()}
        </span>
      </div>
    ),
  },
  {
    header: "Farmer",
    key: "farmerId",
    minWidth: "min-w-[150px]",
    render: (bid) => (
      <span className="text-[13px] font-normal font-montserrat text-[#2b2b2b]">
        {bid?.farmerName || (bid?.farmerId
          ? `Farmer ${bid?.farmerId?.substring(0, 6)}...`
          : "—")}
      </span>
    ),
  },
  {
    header: "Status",
    key: "status",
    minWidth: "min-w-[110px]",
    render: (bid) => {
      const status = bid?.status || "pending";
      const styles =
        status === "accepted"
          ? "bg-green-50 text-green-600 border-green-100"
          : status === "rejected"
          ? "bg-red-50 text-red-600 border-red-100"
          : status === "countered"
          ? "bg-blue-50 text-blue-600 border-blue-100"
          : "bg-yellow-50 text-yellow-600 border-yellow-100";
      return (
        <span
          className={`inline-block text-[11px] font-medium font-montserrat px-2 py-1 rounded-full border ${styles}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  },
  {
    header: "Date",
    key: "createdAt",
    minWidth: "min-w-[100px]",
    render: (bid) => (
      <span className="text-[13px] font-normal font-montserrat text-[#2b2b2b]">
        {new Date(bid?.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

const BidsListPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);

  const [isBiddersModalOpen, setIsBiddersModalOpen] = useState<boolean>(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [bids, setBids] = useState<BidListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const pageSizeOptions = [5, 10, 20, 50];
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

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

  const fetchBids = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthIndex = selectedMonth ? months.indexOf(selectedMonth) : -1;
      const { data, pagination } = await bidService.getBids(page, limit, {
        search: debouncedSearch || undefined,
        year: selectedYear ? parseInt(selectedYear, 10) : undefined,
        month: monthIndex >= 0 ? monthIndex + 1 : undefined,
      });
      setBids(data);
      setTotalItems(pagination?.total ?? data.length);
    } catch (error) {
      console.error("Failed to fetch bids", error);
      toast.error("Failed to fetch bids");
    } finally {
      setIsLoading(false);
    }
    // `months` has stable contents across renders; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // Debounce the search box and reset to page 1 when the query changes.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset to page 1 whenever a year/month filter changes.
  useEffect(() => {
    setPage(1);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

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

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  const handleViewBidders = (id: string) => {
    setSelectedListingId(id);
    setIsBiddersModalOpen(true);
  };

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px] shadow-md">
        <h2 className="text-[17px] font-montserrat text-[#2b2b2b] px-6 pt-6 mb-4">
          Bids Management
        </h2>

        <div className="w-full h-[1px] bg-[#e2e2e2]"></div>
        <div className="w-full bg-[#FAF7F7] mt-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
              <div className="relative w-[100%] sm:w-[70%] flex-grow">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080]"
                  aria-label="Search bids"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <SearchIcon
                    stroke="#808080"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                </div>
              </div>
              <div className="flex items-center w-full sm:w-auto">
                {/* Year Dropdown */}
                <div className="relative flex-1" ref={yearDropdownRef}>
                  <button
                    onClick={() => setIsYearOpen(!isYearOpen)}
                    className="px-3 pl-8 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] bg-white"
                  >
                    {selectedYear || "Year"}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">
                      {isYearOpen ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isYearOpen && (
                      <motion.div
                        className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                      >
                        {/* Options */}
                        {years.map((y) => (
                          <div
                            key={y}
                            onClick={() => {
                              setSelectedYear(String(y));
                              setIsYearOpen(false);
                            }}
                            className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                          >
                            {y}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Month Dropdown */}
                <div className="relative flex-1" ref={monthDropdownRef}>
                  <button
                    onClick={() => setIsMonthOpen(!isMonthOpen)}
                    className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] bg-white"
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
                        className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                      >
                        {months.map((m) => (
                          <div
                            key={m}
                            onClick={() => {
                              setSelectedMonth(m);
                              setIsMonthOpen(false);
                            }}
                            className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            {m}
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
        <div className="my-6">
          {isLoading ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#538e53] border-t-transparent rounded-full" />
            </div>
          ) : (
            <TableList<BidListing>
              dataType="bids"
              columns={bidsColumns}
              initialData={bids}
              ActionMenuComponent={BidActionMenu}
              handleViewBidders={handleViewBidders}
              handleView={handleViewBidders}
            />
          )}

          {!isLoading && bids.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              No active bids found.
            </div>
          )}

          {!isLoading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 mt-2">
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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {isBiddersModalOpen && selectedListingId && (
          <BiddersModal
            isOpen={isBiddersModalOpen}
            onClose={() => {
              setIsBiddersModalOpen(false);
              fetchBids();
            }}
            onBidUpdated={fetchBids}
            listingId={selectedListingId}
          />
        )}
      </div>
    </div>
  );
};

export default BidsListPage;
