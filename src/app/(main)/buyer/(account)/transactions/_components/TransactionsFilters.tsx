"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedYear: string;
  onYearChange: (v: string) => void;
  selectedMonth: string;
  onMonthChange: (v: string) => void;
}

const YEARS = Array.from({ length: 2025 - 2019 + 1 }, (_, i) => 2019 + i);
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const dropdownVariants = {
  open: { opacity: 1, y: 0 },
  closed: { opacity: 0, y: -10 },
};

export const TransactionsFilters: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
}) => {
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setIsYearOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setIsMonthOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-[#FAF7F7]">
      <div className="relative w-full sm:max-w-[320px] flex-grow">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-[#e2e2e2] rounded-[6px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-[12px] font-montserrat"
          aria-label="Search transactions"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon stroke="#808080" className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={yearRef}>
          <button
            type="button"
            onClick={() => setIsYearOpen(!isYearOpen)}
            className="px-3 pl-8 pr-9 py-2 border border-[#808080] rounded-[6px] text-sm w-[110px] text-left font-montserrat text-[#2b2b2b] cursor-pointer focus:outline-none"
            aria-expanded={isYearOpen}
            aria-label={selectedYear ? "Selected year" : "Select year"}
          >
            {selectedYear || "Year"}
            <span className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]">
              <CalenderIcon />
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]">
              {isYearOpen ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
            </span>
          </button>
          <AnimatePresence>
            {isYearOpen && (
              <motion.div
                className="absolute z-10 mt-1 w-[110px] bg-white border border-gray-300 rounded-[6px] shadow-md max-h-32 overflow-auto"
                role="listbox"
                variants={dropdownVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedYear === ""}
                  onClick={() => {
                    onYearChange("");
                    setIsYearOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                    selectedYear === "" ? "bg-gray-200" : ""
                  }`}
                >
                  Year
                </button>
                {YEARS.map((y) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedYear === String(y)}
                    key={y}
                    onClick={() => {
                      onYearChange(String(y));
                      setIsYearOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                      selectedYear === String(y) ? "bg-gray-200" : ""
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={monthRef}>
          <button
            type="button"
            onClick={() => setIsMonthOpen(!isMonthOpen)}
            className="px-3 pr-9 py-2 border border-[#808080] rounded-[6px] text-sm w-[110px] text-left font-montserrat text-[#2b2b2b] cursor-pointer focus:outline-none"
            aria-expanded={isMonthOpen}
            aria-label={selectedMonth ? "Selected month" : "Select month"}
          >
            {selectedMonth || "Month"}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]">
              {isMonthOpen ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
            </span>
          </button>
          <AnimatePresence>
            {isMonthOpen && (
              <motion.div
                className="absolute z-10 mt-1 w-[110px] bg-white border border-gray-300 rounded-[6px] shadow-md max-h-32 overflow-auto"
                role="listbox"
                variants={dropdownVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedMonth === ""}
                  onClick={() => {
                    onMonthChange("");
                    setIsMonthOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                    selectedMonth === "" ? "bg-gray-200" : ""
                  }`}
                >
                  Month
                </button>
                {MONTHS.map((m) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedMonth === m}
                    key={m}
                    onClick={() => {
                      onMonthChange(m);
                      setIsMonthOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#538e53] ${
                      selectedMonth === m ? "bg-gray-200" : ""
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
