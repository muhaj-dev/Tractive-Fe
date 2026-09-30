"use client";
import React, { useState } from "react";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { AddToStoreIcon, CalenderIcon } from "@/icons/DashboardIcons";
import { TableList } from "../../_components/table/TableList";
import { FarmerActionMenu } from "./FarmerActionMenu";
import { Farmer, FarmerFilters } from "@/services/FarmerService";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

const farmerColumns: ColumnConfig<Farmer>[] = [
  {
    header: "Name",
    key: "name",
    minWidth: "min-w-[150px]",
    render: (farmer) => (
      <div className="flex items-center gap-2">
        <UserAvatar
          src={farmer.image}
          name={farmer.name !== "-" ? farmer.name : undefined}
          className="w-[25px] h-[25px] sm:w-[35px] sm:h-[35px]"
          initialsSize={11}
        />
        <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-normal font-montserrat text-[#2b2b2b]">
          {farmer.name}
        </span>
      </div>
    ),
  },
  {
    header: "State",
    key: "state",
    minWidth: "min-w-[100px]",
  },
  {
    header: "Revenue",
    key: "revenue",
    minWidth: "min-w-[100px]",
  },
  {
    header: "Orders",
    key: "orders",
    minWidth: "min-w-[100px]",
  },
  {
    header: "Mobile",
    key: "mobile",
    minWidth: "min-w-[120px]",
  },
  {
    header: "Date",
    key: "date",
    minWidth: "min-w-[100px]",
  },
];

interface FarmerListProps {
  farmers: Farmer[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onView: (id: string) => void;
  filters: FarmerFilters;
  onSearchChange: (query: string) => void;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  onPageChange: (page: number) => void;
}

export const FarmerList: React.FC<FarmerListProps> = ({
  farmers,
  isLoading,
  onEdit,
  onAdd,
  onView,
  filters,
  onSearchChange,
  onYearChange,
  onMonthChange,
  pagination,
  onPageChange,
}) => {
  // UI State for dropdowns
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);

  // Generate years from 2019 to 2025 (matching other components)
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

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  // Convert generic month name to number string for API if needed,
  // but let's assume parent handles conversion or API accepts name if that was the intent.
  // The API likely wants number (1-12). Parent should pass consistent value.
  // But here we display "Month" or selected month name.
  // If filters.month is "1", we want to show "Jan".

  const getMonthName = (m?: string) => {
    if (!m) return "";
    const idx = parseInt(m) - 1;
    if (idx >= 0 && idx < 12) return months[idx];
    return m;
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = pagination.page;

  return (
    <>
      <div className="w-full bg-[#FAF7F7] mt-4 py-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
            {/* Search */}
            <div className="relative w-[100%] sm:w-[70%] flex-grow">
              <input
                type="text"
                placeholder="Search farmers..."
                value={filters.search || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                aria-label="Search farmers"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon
                  stroke="#808080"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
              </div>
            </div>

            {/* Year and Month filters */}
            <div className="flex items-center w-full sm:w-auto">
              <div className="relative flex-1">
                <button
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className="px-3 pl-8 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                >
                  {filters.year || "Year"}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isYearOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <CalenderIcon />
                  </div>
                </button>
                <AnimatePresence>
                  {isYearOpen && (
                    <motion.div
                      className="absolute z-[100] mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
                      variants={dropdownVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onYearChange("");
                          setIsYearOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                          !filters.year ? "bg-gray-200" : ""
                        }`}
                      >
                        All Years
                      </button>
                      {years.map((year) => (
                        <button
                          type="button"
                          key={year}
                          onClick={() => {
                            onYearChange(year.toString());
                            setIsYearOpen(false);
                          }}
                          className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                            filters.year === year.toString()
                              ? "bg-gray-200"
                              : ""
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative flex-1">
                <button
                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                  className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                >
                  {getMonthName(filters.month) || "Month"}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isMonthOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                </button>
                <AnimatePresence>
                  {isMonthOpen && (
                    <motion.div
                      className="absolute z-[100] mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
                      variants={dropdownVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onMonthChange("");
                          setIsMonthOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                          !filters.month ? "bg-gray-200" : ""
                        }`}
                      >
                        All Months
                      </button>
                      {months.map((month, index) => (
                        <button
                          type="button"
                          key={month}
                          onClick={() => {
                            // API expects integer month probably? Or just month number string.
                            // Assuming API wants 1-12
                            onMonthChange((index + 1).toString());
                            setIsMonthOpen(false);
                          }}
                          className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                            filters.month === (index + 1).toString()
                              ? "bg-gray-200"
                              : ""
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Onboard Button */}
          <div className="flex items-center gap-4 justify-end">
            <button
              onClick={onAdd}
              className="cursor-pointer flex items-center gap-[7px] px-4 sm:px-6 py-2 opacity-[0.92] bg-[#538e53] text-[#f9f9f9] text-[12px] sm:text-[13px] lg:text-[14px] font-normal rounded-[4px] transition-colors hover:bg-[#467a46] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Onboard farmer"
            >
              <AddToStoreIcon stroke="#fefefe" />
              Onboard
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="my-6">
        {farmers.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Image
              src="/images/noData.png"
              alt="No Data"
              width={106}
              height={60}
            />
            <p className="text-[13px] font-montserrat mb-2">No farmers found</p>
            <p className="text-[11px] font-montserrat">
              {filters.search || filters.year || filters.month
                ? "Try adjusting your filters"
                : "Start by onboarding your first farmer"}
            </p>
          </div>
        ) : (
          <TableList<Farmer>
            dataType="farmers"
            columns={farmerColumns}
            initialData={farmers}
            ActionMenuComponent={FarmerActionMenu}
            handleEdit={onEdit}
            handleView={onView}
          />
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-6 pb-6">
          <div className="text-sm text-gray-500 font-montserrat">
            Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
            {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) p = currentPage - 2 + i;
                  if (p > totalPages) p = i + (totalPages - 4);
                }
                if (p < 1) p = 1; // Safety check

                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      currentPage === p
                        ? "bg-[#538e53] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};
