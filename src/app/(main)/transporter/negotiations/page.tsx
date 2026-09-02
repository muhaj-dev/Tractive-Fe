"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import { NegotiationProps } from "@/utils/Negotiation";
import { TableList } from "../_components/table/TableList";
import { NegotiationActionMenu } from "./_components/NegotiationActionMenu";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { NegotiationService } from "@/services/negotiationService";
import Image from "next/image";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

const negotiationColumns: ColumnConfig<NegotiationProps>[] = [
  {
    header: "Fleet",
    key: "name",
    minWidth: "min-w-[150px]",
    render: (negotiation) => (
      <div className="flex items-center gap-2">
        <div className="bg-[#f1f1f1] flex items-center justify-center w-[63px] h-[37px] rounded-[4px]">
          <Image
            src={negotiation.image}
            alt={negotiation.name}
            width={40}
            height={24}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#2b2b2b]">
            {negotiation.name}
          </span>
          <span className="text-[10px] sm:text-[11px] md:text-[12px] font-normal font-montserrat text-[#2b2b2b]">
            {negotiation.description}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: "Amount",
    key: "amount",
    minWidth: "min-w-[100px]",
    render: (negotiation) => `₦${(negotiation.amount ?? 0).toLocaleString()}`,
  },
  {
    header: "Negotiator",
    key: "negotiator",
    minWidth: "min-w-[120px]",
  },
  {
    header: "Weight (KG)",
    key: "KG",
    minWidth: "min-w-[100px]",
  },
  {
    header: "Location",
    key: "location",
    minWidth: "min-w-[120px]",
  },
  {
    header: "Date",
    key: "date",
    minWidth: "min-w-[100px]",
  },
];

const NegotiationListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [negotiated, setNegotiated] = useState<NegotiationProps[]>([]);
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

  // Debounce search input (400ms) to avoid firing an API call on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedMonth, selectedYear]);

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

  const monthNumber = selectedMonth ? months.indexOf(selectedMonth) + 1 : undefined;

  const { data: fetchNegotiations, isLoading } = useQuery({
    queryKey: ["negotiations"],
    // Search/month/year are applied below rather than server-side: the
    // aggregated fallback has no query parameters to pass them to.
    queryFn: () => NegotiationService.getNegotiationsToAnswer(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!fetchNegotiations) return;

    const matchesFilters = (item: (typeof fetchNegotiations)[number]) => {
      const fleet = typeof item.fleet === "object" ? item.fleet : null;
      if (debouncedSearch) {
        const haystack = [
          fleet?.fleetName,
          item.buyer?.name,
          item.message,
          String(item.amount ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(debouncedSearch.toLowerCase())) return false;
      }
      if (!item.createdAt) return true;
      const created = new Date(item.createdAt);
      if (selectedYear && String(created.getFullYear()) !== selectedYear) return false;
      if (monthNumber && created.getMonth() + 1 !== monthNumber) return false;
      return true;
    };

    setNegotiated(
      fetchNegotiations.filter(matchesFilters).map((item) => {
        const fleet = typeof item.fleet === "object" ? item.fleet : null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = item as any;
        return {
          id: item._id,
          // Responding needs the fleet id as well as the bid id — the endpoint
          // is /fleet/{fleetId}/bids/{bidId}/respond.
          fleetId: fleet?._id || raw.fleet || "",
          image: fleet?.images?.[0] || "/images/truckcontainer.png",
          name: fleet?.fleetName || raw.fleet?.fleetNumber || "Fleet",
          description: item.status || "Pending",
          negotiator: item.buyer?.name || "Negotiator",
          amount: item.amount || 0,
          KG: raw.loadWeightKg ?? 0,
          location: fleet?.route
            ? `${fleet.route.fromState} - ${fleet.route.toState}`
            : "Unknown location",
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "",
          checked: false,
          originalPayloadAmount: item.amount || 0,
        };
      }),
    );
  }, [fetchNegotiations, debouncedSearch, selectedYear, monthNumber]);

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      fleetId,
      action,
      amount,
    }: {
      id: string;
      fleetId?: string;
      action: "accept" | "reject";
      amount?: number;
    }) =>
      // Prefer the fleet-scoped route, which is the one that actually resolves
      // these bids. The bare /negotiations/{id}/respond route is kept as a
      // fallback for rows that arrive without a fleet id.
      fleetId
        ? NegotiationService.respondToFleetBidAsTransporter(fleetId, id, {
            action,
            amount,
          })
        : NegotiationService.respondToNegotiation(id, { action, amount }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      toast.success(`Negotiation ${variables.action}ed successfully`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.message || "Failed to respond to negotiation");
    },
  });

  const respond = async (action: "accept" | "reject", id?: string) => {
    if (id) {
      const neg = negotiated.find((n) => n.id === id);
      respondMutation.mutate({
        id,
        fleetId: neg?.fleetId,
        action,
        amount: neg?.originalPayloadAmount,
      });
      return;
    }
    const selectedItems = negotiated.filter((p) => p.checked);
    if (selectedItems.length === 0) return;
    await Promise.all(
      selectedItems.map((item) =>
        respondMutation.mutateAsync({
          id: item.id,
          fleetId: item.fleetId,
          action,
          amount: item.originalPayloadAmount,
        }),
      ),
    );
    setNegotiated(negotiated.map((p) => (p.checked ? { ...p, checked: false } : p)));
  };

  const handleReject = (id?: string) => respond("reject", id);
  const handleAccept = (id?: string) => respond("accept", id);

  const handleCheckboxChange = (id: string) => {
    console.log(`Checkbox toggled for ID: ${id}`);
    setNegotiated(
      negotiated.map((p: NegotiationProps) =>
        p.id === id ? { ...p, checked: !p.checked } : p
      )
    );
  };

  const handleSelectAll = () => {
    const allChecked = negotiated.every((p) => p.checked === true);
    setNegotiated(
      negotiated.map((p: NegotiationProps) => ({
        ...p,
        checked: !allChecked,
      }))
    );
  };

  const hasSelectedItems = negotiated.some((p) => p.checked);
  const hasActiveFilters = Boolean(
    debouncedSearch || selectedYear || selectedMonth
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedYear("");
    setSelectedMonth("");
  };

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px] shadow-md">
        <h2 className="text-[17px] font-montserrat text-[#2b2b2b] px-6 pt-6 mb-4">
          Negotiations
        </h2>

        <div className="w-full h-px bg-[#e2e2e2]"></div>
        <div className="w-full bg-[#FAF7F7] mt-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
              <div className="relative w-full sm:w-[70%] grow">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 py-2 border border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                  aria-label="Search negotiations"
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
                    className="px-3 pl-8 pr-10 py-2 border cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
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
                        variants={{
                          open: { opacity: 1, y: 0 },
                          closed: { opacity: 0, y: -10 },
                        }}
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
                    className="px-3 pr-10 py-2 border cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
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
                        variants={{
                          open: { opacity: 1, y: 0 },
                          closed: { opacity: 0, y: -10 },
                        }}
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

            {/* Buttons */}
            {hasSelectedItems && (
              <div className="flex items-center gap-4 justify-start md:justify-end">
                <button
                  onClick={() => handleReject()}
                  className="cursor-pointer px-4 sm:px-6 py-2 opacity-[0.9] border border-[#8B4513] text-[#B28362] text-[12px] sm:text-[13px] lg:text-[14px] font-normal rounded-[4px] transition-colors hover:bg-[#9f6f50] hover:text-[#fefefe]"
                  aria-label="Reject selected negotiations"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAccept()}
                  className="cursor-pointer px-4 sm:px-6 py-2 opacity-[0.9] bg-[#538e53] text-[#f9f9f9] text-[12px] sm:text-[13px] lg:text-[14px] font-normal rounded-[4px] transition-colors hover:bg-[#467a46]"
                  aria-label="Accept selected negotiations"
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="my-6">
          {isLoading ? (
            <div className="flex justify-center p-8 text-[#808080] font-montserrat">Loading negotiations...</div>
          ) : (
            <TableList<NegotiationProps>
              dataType="negotiations"
              columns={negotiationColumns}
              initialData={negotiated} // Passing down local state which tracks checkbox checking
              ActionMenuComponent={NegotiationActionMenu}
              handleReject={(id) => handleReject(id)}
              handleAccept={(id) => handleAccept(id)}
              handleCheckboxChange={handleCheckboxChange}
              handleSelectAll={handleSelectAll}
              allChecked={negotiated.length > 0 && negotiated.every((p) => p.checked === true)}
              emptyState={
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Image
                        src="/images/truckcontainer.png"
                        alt="Empty Negotiation"
                        width={80}
                        height={80}
                        className="opacity-70 object-contain rounded-full bg-[#f1f1f1] w-20 h-20"
                      />
                      <h3 className="text-[16px] font-medium font-montserrat text-[#2b2b2b]">
                        {hasActiveFilters
                          ? "No Matching Negotiations"
                          : "No Negotiations Available"}
                      </h3>
                      <p className="text-[13px] font-montserrat text-[#808080]">
                        {hasActiveFilters
                          ? "No negotiations match your search or filters"
                          : "You currently have no pending negotiations"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="cursor-pointer mt-1 px-4 py-2 border border-[#538e53] text-[#538e53] text-[12px] sm:text-[13px] font-normal rounded-[4px] transition-colors hover:bg-[#538e53] hover:text-[#fefefe]"
                          aria-label="Clear all filters"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NegotiationListPage;
