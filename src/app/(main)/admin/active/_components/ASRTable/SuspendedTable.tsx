"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "../../../../../../icons/Icons";
import { CalenderIcon } from "../../../../../../icons/DashboardIcons";
import { AdminControl, AdminMethodProps } from "../../../../../../utils/AdminControl";
import AdminTable, {
  ColumnConfig,
} from "../../../_components/table/AdminTableList";
import { SuspendedActionMenu } from "../ASRActionMenu/SuspendedActionMenu";
import { BulkActionButtons } from "../../../_components/BulkActionButtons";
import { Avatar } from "@/components/ui/Avatar";

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

// List of Nigeria's 36 states plus FCT
const nigeriaStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const columns: ColumnConfig<AdminControl>[] = [
  {
    key: "fullname",
    header: "FullName",
    render: (item: AdminControl) => (
      <div className="flex items-center gap-3">
        {/* Falls back to the placeholder for a missing or broken URL. */}
        <Avatar
          src={item.image}
          alt={item.fullName}
          size={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b]">
            {item.fullName}
          </span>
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-montserrat font-normal text-[#808080]">
            {item.email}
          </span>
        </div>
      </div>
    ),
    minWidth: "min-w-[200px]",
  },
  { key: "location", header: "Location", minWidth: "min-w-[120px]" },
  { key: "mobile", header: "Mobile", minWidth: "min-w-[100px]" },
  {
    key: "status",
    header: "Status",
    minWidth: "min-w-[100px]",
    render: (item: AdminControl) => {
      const s = (item.status || "").toLowerCase();
      const styles =
        s === "active"
          ? "bg-green-50 text-green-600 border-green-100"
          : s === "suspended"
          ? "bg-yellow-50 text-yellow-700 border-yellow-100"
          : s === "removed"
          ? "bg-red-50 text-red-600 border-red-100"
          : "bg-gray-50 text-gray-600 border-gray-200";
      const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
      return (
        <span
          className={`inline-block text-[10px] font-medium font-montserrat px-2 py-0.5 rounded-full border ${styles}`}
        >
          {label}
        </span>
      );
    },
  },
  { key: "date", header: "Date", minWidth: "min-w-[100px]" },
];
// Filter values are owned by the page (server-side filtering); this table only
// renders the controls and reports changes upward.
interface SuspendedTableProps extends AdminMethodProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  selectedState: string;
  onStateChange: (value: string) => void;
}

export const SuspendedTable: React.FC<SuspendedTableProps> = ({
  data,
  handleReactivate,
  handleAdminRemoved,
  handleCheckboxChange,
  handleSelectAll,
  allChecked,
  bulkActions = [],
  bulkDisabled,
  searchTerm,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  selectedState,
  onStateChange,
}) => {
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [isStateOpen, setIsStateOpen] = useState<boolean>(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);

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
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStateOpen(false);
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
        setIsStateOpen(false);
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
          <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
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
            <div className="flex items-center gap-8 w-full sm:w-auto">
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

              {/* State Dropdown */}
              <div className="relative flex-1" ref={stateDropdownRef}>
                <button
                  onClick={() => setIsStateOpen(!isStateOpen)}
                  className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-[4px]  text-[12px] font-montserrat text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                  role="combobox"
                  aria-expanded={isStateOpen}
                  aria-controls="state-dropdown"
                  aria-label={
                    selectedState
                      ? `Selected state: ${selectedState}`
                      : "Select state"
                  }
                >
                  {selectedState || "State"}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">
                    {isStateOpen ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {isStateOpen && (
                    <motion.div
                      id="state-dropdown"
                      className="absolute z-10 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-60 overflow-y-auto"
                      role="listbox"
                      variants={dropdownVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div
                        onClick={() => {
                          onStateChange("");
                          setIsStateOpen(false);
                        }}
                        className={`px-3 py-1 text-[12px] cursor-pointer font-montserrat hover:bg-gray-100 ${
                          selectedState === "" ? "bg-gray-200" : ""
                        }`}
                        role="option"
                        aria-selected={selectedState === ""}
                      >
                        State
                      </div>
                      {nigeriaStates.map((state) => (
                        <div
                          key={state}
                          onClick={() => {
                            onStateChange(state);
                            setIsStateOpen(false);
                          }}
                          className={`px-3 py-1 text-[12px] cursor-pointer font-montserrat hover:bg-gray-100 ${
                            selectedState === state ? "bg-gray-200" : ""
                          }`}
                          role="option"
                          aria-selected={selectedState === state}
                        >
                          {state}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
              <BulkActionButtons actions={bulkActions} disabled={bulkDisabled} />
        </div>
      </div>
      <div className="mt-6 w-full">
        <AdminTable<AdminControl>
          dataType="ASRDataControl"
          columns={columns}
          initialData={data}
          ActionMenuComponent={SuspendedActionMenu}
          handleReactivate={handleReactivate}
          handleAdminRemoved={handleAdminRemoved}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
        />
        {data.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm font-montserrat">
            No users match the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
