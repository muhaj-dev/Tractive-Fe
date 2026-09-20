"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import { ATTrackSwitch } from "../../_components/ATTrackSwitch";
import { OrderData, orderDataProps } from "@/utils/TrackAgentData";
import AdminTable, {
  ColumnConfig,
} from "../../../_components/table/AdminTableList";
import Image from "next/image";

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

const columns: ColumnConfig<OrderData>[] = [
  {
    key: "title",
    header: "Produce",
    render: (item: OrderData) => (
      <div className="flex items-center gap-3">
        <Image
          src={item.image}
          alt={item.title}
          width={10}
          height={10}
          className="w-10 h-10 rounded-full shrink-0"
        />
        {/* `min-w-0` is what lets `truncate` bite inside a flex row, and the
            max width keeps a long description from stretching the Produce
            column across the table — it used to render in full on one line.
            The whole text stays available on hover. */}
        <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[260px] md:max-w-[340px]">
          <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b]">
            {item.title}
          </span>
          <span
            title={item.description}
            className="truncate text-[9px] sm:text-[10px] md:text-[11px] font-montserrat font-normal text-[#808080]"
          >
            {item.description}
          </span>
        </div>
      </div>
    ),
    minWidth: "min-w-[200px]",
  },
  { key: "buyerName", header: "Buyer", minWidth: "min-w-[100px]" },
  { key: "sellerName", header: "Seller", minWidth: "min-w-[100px]" },
  { key: "amount", header: "Amount", minWidth: "min-w-[100px]" },
  { key: "date", header: "Date", minWidth: "min-w-[100px]" },
];

export const PaidedTrack: React.FC<orderDataProps> = ({
  order,
  onRowClick,
  handleCheckboxChange,
  handleSelectAll,
  allChecked,
  searchTerm,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
}) => {
  // Only the open/closed state of the dropdowns is local now — the selected
  // values are owned by the page so they reach the API. `order` therefore
  // arrives already filtered server-side.
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Generate years from 2019 to 2025
  const years = Array.from({ length: 2025 - 2019 + 1 }, (_, i) => 2019 + i);

  // Close dropdowns when clicking outside
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

  // Handle keyboard navigation
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

  // Dropdown animation variants
  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full mx-auto">
      <div className="w-full bg-[#FAF7F7] mt-4 py-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
          {/* Search and Dropdowns */}
          <div className="flex flex-col sm:flex-row items-center gap-8 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[75%] 2xl:[60%]">
            {/* Search Input */}
            <div className="relative w-[100%] sm:w-[70%] flex-grow">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                aria-label="Search all transactions"
                aria-describedby="search-description"
              />
              <span id="search-description" className="sr-only">
                Search for transactions by name or email
              </span>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon
                  stroke="#808080"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
              </div>
            </div>
            {/* Agent and Transporter navigation */}
            <ATTrackSwitch />

            <div className="flex items-center w-full sm:w-auto">
              {/* Year Dropdown */}
              <div className="relative flex-1" ref={yearDropdownRef}>
                <button
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className="px-3 pl-8 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-[12px] font-montserrat text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                  role="combobox"
                  aria-expanded={isYearOpen}
                  aria-controls="year-dropdown"
                  aria-label={
                    selectedYear
                      ? `Selected year: ${selectedYear}`
                      : "Select year"
                  }
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
                          onYearChange("");
                          setIsYearOpen(false);
                        }}
                        className={`px-3 py-1 text-[12px] cursor-pointer font-montserrat hover:bg-gray-100 ${
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
                            onYearChange(year.toString());
                            setIsYearOpen(false);
                          }}
                          className={`px-3 py-1 text-[12px] cursor-pointer font-montserrat hover:bg-gray-100 ${
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

              {/* Month Dropdown */}
              <div className="relative flex-1" ref={monthDropdownRef}>
                <button
                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                  className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] text-[12px] font-montserrat text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                  role="combobox"
                  aria-expanded={isMonthOpen}
                  aria-controls="month-dropdown"
                  aria-label={
                    selectedMonth
                      ? `Selected month: ${selectedMonth}`
                      : "Select month"
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
                          onMonthChange("");
                          setIsMonthOpen(false);
                        }}
                        className={`px-3 py-1 text-[12px] cursor-pointer font-montserrat hover:bg-gray-100 ${
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
                            onMonthChange(month);
                            setIsMonthOpen(false);
                          }}
                          className={`px-3 py-1 text-[12px] cursor-pointer font-montserrat hover:bg-gray-100 ${
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
      <div className="mt-6 w-full">
        <AdminTable<OrderData>
          dataType="TrackAgentData"
          columns={columns}
          initialData={order}
          onRowClick={onRowClick}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
        />
        {order.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm font-montserrat">
            No paid orders found.
          </div>
        )}
      </div>
    </div>
  );
};
