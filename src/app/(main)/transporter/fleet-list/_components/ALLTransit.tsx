"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { AddToStoreIcon, CalenderIcon } from "@/icons/DashboardIcons";
import { FleetTable } from "./table/FleetTable";
import AddFleet from "../../_components/AddFleet";
import { ViewFleetModal } from "../../_components/ViewFleetModal";
import { DeleteConfirmationModal } from "@/app/(main)/agent/farmers/_components/DeleteConfirmationModal";
import { Fleet } from "@/utils/Fleet";
import { useGetFleets, useDeleteFleet, useUpdateFleetStatus } from "@/hooks/queries/useFleetQueries";
import { GetFleetsParams } from "@/services/fleetService";
import "../../Table.css";

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

export const AllTransit: React.FC = () => {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query params for the API
  const queryParams: GetFleetsParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(selectedStatus !== "All" && { status: selectedStatus.toLowerCase().replace(/ /g, "_") }),
    ...(selectedYear && { year: Number(selectedYear) }),
    ...(selectedMonth && { month: months.indexOf(selectedMonth) + 1 }),
  };

  const { data: fetchedFleets } = useGetFleets(queryParams);

  const fleets: Fleet[] = (fetchedFleets || []).map((fleet) => ({
    id: fleet._id,
    image: fleet.images?.[0] || "/images/truckcontainer.png",
    name: fleet.fleetName || "Unknown Fleet",
    IOT: fleet.iot || "N/A",
    route: `${fleet.route?.fromState || "Unknown"} - ${fleet.route?.toState || "Unknown"}`,
    status: fleet.status || fleet.fleetStates || "Available",
    price: fleet.price || 0,
    date: new Date(fleet.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: '2-digit', day: '2-digit' }),
    checked: false,
    fleetNumber: fleet.fleetNumber,
    model: fleet.model,
    size: fleet.capacity,
    priceNegotiation: fleet.priceNegotiation,
    fleetDescription: fleet.fleetDescription,
    images: fleet.images,
  }));
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
  
  // View Fleet Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);

  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Generate years from 2019 to 2025
  const years = Array.from({ length: 2025 - 2019 + 1 }, (_, i) => 2019 + i);
  const statuses = ["All", "Available", "Under Maintenance", "On Transit"];

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
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
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
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mutations
  const { mutate: deleteFleet, isPending: isDeleting } = useDeleteFleet();
  const { mutate: updateFleetStatus } = useUpdateFleetStatus();
  const [fleetToDelete, setFleetToDelete] = useState<string | null>(null);

  // Handle delete fleet — asks first in the app's own dialog, not window.confirm
  const handleDelete = (id: string) => {
    setFleetToDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (!fleetToDelete) return;
    deleteFleet(fleetToDelete, { onSuccess: () => setFleetToDelete(null) });
  };

  // Handle edit fleet
  const handleEdit = (id: string) => {
    const fleetToEdit = fleets.find(f => f.id === id);
    if (fleetToEdit) {
      setEditingFleet(fleetToEdit);
      setIsModalOpen(true);
    }
  };

  // Handle set available/maintenance logic replacement
  const handleToggleStatus = (id: string, newStatusStr: string) => {
    // Expects strict lowercase: 'available', 'under_maintenance', 'on_transit'
    updateFleetStatus({ id, status: newStatusStr });
  };

  // Route into the trip tracking view, pre-searched by this fleet's IOT (or
  // name) so the transporter immediately sees its trips. BookingTripsView seeds
  // its search from `?search=` and keeps it across the New/Picked/On transit/
  // Delivered tabs, so the fleet's trip surfaces whatever its current stage.
  const handleTracking = (id: string) => {
    const fleet = fleets.find((f) => f.id === id);
    const term =
      fleet?.IOT && fleet.IOT !== "N/A" ? fleet.IOT : fleet?.name ?? "";
    router.push(
      `/transporter/on-transit${
        term ? `?search=${encodeURIComponent(term)}` : ""
      }`,
    );
  };

  // Handle copy to clipboard
  const copyToClipboard = (IOT: string) => {
    navigator.clipboard.writeText(IOT);
    alert(`Copied IOT: ${IOT}`);
  };

  // Handle row click
  const handleRowClick = (fleet: Fleet) => {
    setSelectedFleet(fleet);
    setIsViewModalOpen(true);
  };

  // Dropdown animation variants
  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full mx-auto">
      <AddFleet 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingFleet(null);
        }} 
        editFleetData={editingFleet}
      />
      
      <ViewFleetModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        fleet={selectedFleet}
      />

      <DeleteConfirmationModal
        isOpen={!!fleetToDelete}
        onClose={() => !isDeleting && setFleetToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Fleet"
        message="Are you sure you want to delete this fleet? This action cannot be undone."
        isLoading={isDeleting}
      />

      <div className="w-full bg-[#FAF7F7] mt-4 py-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
          {/* Search and Dropdowns */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
            {/* Search Input */}
            <div className="relative w-full sm:w-[70%] grow">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 py-2 border border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                aria-label="Search all fleets"
                aria-describedby="search-description"
              />
              <span id="search-description" className="sr-only">
                Search for fleets by name or IOT
              </span>
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
                  className="px-3 pl-8 pr-1 py-2 border cursor-pointer border-[#808080] rounded-tl-[4px] rounded-bl-[4px] text-sm sm:text-base text-left w-full sm:w-[90px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
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

              {/* Month Dropdown */}
              <div className="relative flex-1" ref={monthDropdownRef}>
                <button
                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                  className="px-3 pr-1 py-2 border-y border-r cursor-pointer border-[#808080] text-sm sm:text-base text-left w-full sm:w-[90px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
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

              {/* Status Dropdown */}
              <div className="relative flex-1" ref={statusDropdownRef}>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="px-3 pr-1 py-2 border-y border-r cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
                  role="combobox"
                  aria-expanded={isStatusOpen}
                  aria-controls="status-dropdown"
                  aria-label={
                    selectedStatus
                      ? `Selected status: ${selectedStatus}`
                      : "Select status"
                  }
                >
                  <span className="truncate inline-block w-[75%]">{selectedStatus || "Status"}</span>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">
                    {isStatusOpen ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {isStatusOpen && (
                    <motion.div
                      id="status-dropdown"
                      className="absolute z-10 mt-1 w-[120px] sm:w-[150px] right-0 bg-white border border-gray-300 rounded-[4px] shadow-md max-h-40 overflow-y-auto"
                      role="listbox"
                      variants={dropdownVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {statuses.map((status) => (
                        <div
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            setIsStatusOpen(false);
                          }}
                          className={`px-3 py-1 text-sm sm:text-base cursor-pointer hover:bg-gray-100 ${
                            selectedStatus === status ? "bg-gray-200" : ""
                          }`}
                          role="option"
                          aria-selected={selectedStatus === status}
                        >
                          {status}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex items-center gap-4 justify-start md:justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer flex items-center gap-[7px] px-4 sm:px-6 py-2 opacity-[0.9] bg-[#538e53] text-[#f9f9f9] text-[12px] sm:text-[13px] lg:text-[14px] font-normal rounded-[4px] transition-colors hover:bg-[#467a46]"
              aria-label="Add fleet"
            >
              <AddToStoreIcon stroke="#fefefe" />
              Add Fleet
            </button>
          </div>
        </div>
      </div>
      {/* Fleet List */}
      <div className="mt-6 w-full">
        <FleetTable
          fleets={fleets}
          copyToClipboard={copyToClipboard}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleToggleStatus={handleToggleStatus}
          handleTracking={handleTracking}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

