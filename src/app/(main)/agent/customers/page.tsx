"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import { TableList } from "../_components/table/TableList";
import { CustomerActionMenu } from "./_components/CustomerActionMenu";
import { CustomerInfoModal } from "./_components/CustomerInfoModal";
import { SupportModal } from "./_components/SupportModal";
import { CustomerService, Customer } from "@/services/customerService";
import { toast } from "sonner";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

const customerColumns: ColumnConfig<Customer>[] = [
  {
    header: "Name",
    key: "name",
    minWidth: "min-w-[150px]",
    render: (customer) => (
      <div className="flex items-center gap-2">
        <Avatar
          src={customer.image}
          alt={customer.name}
          size={35}
          className="rounded-full w-[25px] h-[25px] sm:w-[35px] sm:h-[35px] object-cover"
        />
        <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-normal font-montserrat text-[#2b2b2b]">
          {customer.name}
        </span>
      </div>
    ),
  },
  {
    header: "State",
    key: "state",
    minWidth: "min-w-[100px]",
    render: (customer) => customer.state || "—",
  },
  {
    header: "Revenue",
    key: "revenue",
    minWidth: "min-w-[100px]",
    render: (customer) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(customer.revenue),
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
    render: (customer) =>
      customer.date
        ? new Date(customer.date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
  },
];

export default function CustomersListPage() {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);

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

  // Fetch customers from API - wrapped in useCallback
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const monthIndex = selectedMonth ? months.indexOf(selectedMonth) : -1;
      const params = {
        search: searchQuery || undefined,
        year: selectedYear ? parseInt(selectedYear, 10) : undefined,
        month: monthIndex >= 0 ? monthIndex + 1 : undefined,
        page: currentPage,
        limit: 20,
      };

      const response = await CustomerService.getCustomers(params);

      setCustomersData(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCustomers(response.pagination.total);
    } catch (err) {
      console.error("❌ Error in fetchCustomers:", err);

      let errorMessage = "Failed to fetch customers";

      const apiMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      if (err?.response?.status === 404) {
        errorMessage = `API endpoint not found. Please check if the backend server is running.`;
      } else if (apiMessage) {
        errorMessage = apiMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Set empty data on error
      setCustomersData([]);
      setTotalPages(1);
      setTotalCustomers(0);
    } finally {
      setIsLoading(false);
    }
    // `months` has stable contents across renders; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedYear, selectedMonth, currentPage]);

  // Debounced refetch on search/year/month change (all now sent to the API).
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchCustomers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedYear, selectedMonth, fetchCustomers]);

  // Fetch on page change
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, fetchCustomers]);

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
        setIsCustomerInfoOpen(false);
        setIsSupportOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Open the details modal straight from the row the user clicked. The list
  // response already carries every customer field, so there's no need to hit
  // `/api/customers/{id}` (which currently errors) just to re-fetch the same data.
  const handleCustomerInfo = (id: string) => {
    const customer = customersData.find((c) => c.id === id);
    if (customer) {
      setSelectedCustomer(customer);
      setIsCustomerInfoOpen(true);
    } else {
      toast.error("Customer details are not available");
    }
  };

  const handleSupport = (id: string) => {
    const customer = customersData.find((c) => c.id === id);
    if (customer) {
      setSelectedCustomer(customer);
    }
    setIsSupportOpen(true);
  };

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px] shadow-md">
        <h2 className="text-[17px] font-montserrat text-[#2b2b2b] px-6 pt-6 mb-4">
          Customers
          {totalCustomers > 0 && (
            <span className="ml-2 text-[14px] text-[#808080]">
              ({totalCustomers} total)
            </span>
          )}
        </h2>
        <div className="w-full h-[1px] bg-[#e2e2e2]"></div>

        <div className="w-full bg-[#FAF7F7] mt-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-[100%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
              <div className="relative w-[100%] sm:w-[70%] flex-grow">
                <input
                  type="text"
                  placeholder="Search by name or state"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[1px] focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                  aria-label="Search customers"
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
                        className="absolute z-[100] mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
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
                        className="absolute z-[100] mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
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
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[14px] font-montserrat text-[#808080]">
                  Loading customers...
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="text-[14px] font-montserrat text-red-500">
                  {error}
                </div>
                <button
                  onClick={fetchCustomers}
                  className="px-4 py-2 bg-[#538e53] text-white text-[12px] font-montserrat rounded-[4px] hover:bg-[#467746] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : customersData.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <div className="text-[14px] font-montserrat text-[#808080]">
                No customers found
              </div>
            </div>
          ) : (
            <>
              <TableList<Customer>
                dataType="customers"
                columns={customerColumns}
                initialData={customersData}
                ActionMenuComponent={CustomerActionMenu}
                handleView={handleCustomerInfo}
                handleCustomerInfo={handleCustomerInfo}
                handleSupport={handleSupport}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 mb-2 px-4">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-[12px] sm:text-[13px] font-montserrat bg-[#538e53] text-white rounded-[4px] hover:bg-[#467746] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[12px] sm:text-[13px] font-montserrat text-[#2b2b2b]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-[12px] sm:text-[13px] font-montserrat bg-[#538e53] text-white rounded-[4px] hover:bg-[#467746] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <CustomerInfoModal
          customer={selectedCustomer}
          isOpen={isCustomerInfoOpen}
          onClose={() => {
            setIsCustomerInfoOpen(false);
            setSelectedCustomer(null);
          }}
        />
        <SupportModal
          customer={selectedCustomer}
          isOpen={isSupportOpen}
          onClose={() => {
            setIsSupportOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </div>
    </div>
  );
}
