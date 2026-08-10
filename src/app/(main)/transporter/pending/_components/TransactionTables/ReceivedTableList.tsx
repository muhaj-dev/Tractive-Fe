"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import { TableList } from "../../../_components/table/TableList";
import { copyToClipboard } from "@/utils/Clipboard";
import { CustomerCareModal } from "../CustomerCareModal";
import { TransactionActionMenu } from "../TransactionAction/TransactionActionMenu";
import { IdCopyIcon } from "../../../_components/Icons/TransporterIcons";
import { TransporterTransaction } from "@/utils/TransporterTransactionData";
import { useTransporterTransactions } from "@/hooks/queries/useFleetQueries";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

const transactionColumns: ColumnConfig<TransporterTransaction>[] = [
 {
     header: "Fleet",
     key: "name",
     minWidth: "min-w-[150px]",
     render: (transaction) => (
       <div className="flex items-center gap-2">
         <div className="bg-[#f1f1f1] flex items-center justify-center w-[63px] h-[37px] rounded-[4px]">
           <Image
             src={transaction.image}
             alt={transaction.name}
             width={40}
             height={24}
             className="object-cover"
           />
         </div>
         <div className="flex flex-col">
           <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#2b2b2b]">
             {transaction.name}
           </span>
           <span className="truncate text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#666666]">
             {transaction.description}
           </span>
         </div>
       </div>
     ),
   },
   {
     header: "IOT",
     key: "IOT",
     minWidth: "min-w-[100px]",
     render: (transaction) => (
       <div className="flex items-center gap-2">
         <span>{transaction.IOT || "--"}</span>
         {transaction.IOT && (
           <button
             onClick={() => copyToClipboard(transaction.IOT)}
             title="Copy IOT"
             aria-label="Copy IOT"
             className="cursor-pointer"
           >
             <IdCopyIcon />
           </button>
         )}
       </div>
     ),
   },
   {
     header: "Kg",
     key: "KG",
     minWidth: "min-w-[100px]",
     render: (transaction) =>
       transaction.KG ? `${transaction.KG.toLocaleString()} KG` : "--",
   },
   {
     header: "Payment",
     key: "Payment",
     minWidth: "min-w-[100px]",
     render: (transaction) =>
       typeof transaction.Payment === "number"
         ? `₦${transaction.Payment.toLocaleString()}`
         : "--",
   },
   {
     header: "Payer",
     key: "Seller",
     minWidth: "min-w-[100px]",
   },
   {
     header: "Date",
     key: "date",
     minWidth: "min-w-[100px]",
   },
];

export const ApprovedTableList = () => {
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

  const { data: transactions = [], isLoading, isError } =
    useTransporterTransactions();

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (transaction.status !== "approved") return false;
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          !search ||
          transaction.name.toLowerCase().includes(search) ||
          transaction.Seller.toLowerCase().includes(search) ||
          transaction.id.toLowerCase().includes(search);
        const matchesYear =
          !selectedYear || transaction.date.includes(selectedYear.toString());
        const matchesMonth =
          !selectedMonth ||
          transaction.date.includes(
            (months.indexOf(selectedMonth) + 1).toString().padStart(2, "0"),
          );
        return matchesSearch && matchesYear && matchesMonth;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, searchQuery, selectedYear, selectedMonth],
  );

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full">
      <div className="mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px]">
        <div className="w-full bg-[#FAF7F7] mt-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
              <div className="relative w-[100%] sm:w-[70%] flex-grow">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
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
                    className="px-3 pr-10 py-2 border-[1px] cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
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
        <div className="my-6">
          {isLoading ? (
            <div className="py-10 text-center font-montserrat text-sm text-[#808080]">
              Loading transactions...
            </div>
          ) : isError ? (
            <div className="py-10 text-center font-montserrat text-sm text-[#c0392b]">
              Failed to load transactions.
            </div>
          ) : (
            <TableList<TransporterTransaction>
              dataType="received"
              columns={transactionColumns}
              initialData={filteredTransactions}
              ActionMenuComponent={TransactionActionMenu}
              handleCustomerCare={() => setIsCustomerCareModalOpen(true)}
            />
          )}
        </div>
        <CustomerCareModal
          isOpen={isCustomerCareModalOpen}
          onClose={() => setIsCustomerCareModalOpen(false)}
        />
      </div>
    </div>
  );
};
