"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { AddToStoreIcon, CalenderIcon } from "@/icons/DashboardIcons";
import { TableList } from "../_components/table/TableList";
import { OnboardingDriver } from "./_components/OnboardingDriver";
import { Driver } from "@/utils/DriverData";
import { DriverActionMenu } from "./_components/DriverActionMenu";
import { AssignFleetModal } from "./_components/AssignFleet";
import { DeleteDriverModal } from "./_components/DeleteDriverModal";
import { DriverTableSkeleton } from "./_components/DriverTableSkeleton";
import {
  DriverService,
  CreateDriverPayload,
  UpdateDriverPayload,
  GetDriversParams,
} from "@/services/driverService";
import { DriverDetailsModal } from "./_components/DriverDetailsModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // Using sonner as seen in package.json, assuming it's configured in layout

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T, handlers?: Record<string, unknown>) => React.ReactNode;
  minWidth?: string;
}

const driverColumns: ColumnConfig<Driver>[] = [
  {
    header: "Name",
    key: "name",
    minWidth: "min-w-[150px]",
    render: (driver) => (
      <div className="flex items-center gap-2">
        <UserAvatar src={driver.image} name={driver.name} size={32} />
        <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-normal font-montserrat text-[#2b2b2b]">
          {driver.name || "--"}
        </span>
      </div>
    ),
  },
  {
    header: "Route",
    key: "route",
    minWidth: "min-w-[100px]",
    render: (driver) => (
      <span className="text-sm font-montserrat text-[#2b2b2b]">
        {driver.route || "--"}
      </span>
    ),
  },
  {
    header: "Fleet",
    key: "fleet",
    minWidth: "min-w-[100px]",
    render: (driver) => (
      <span className="text-sm font-montserrat text-[#2b2b2b]">
        {driver.fleet || "--"}
      </span>
    ),
  },
  {
    header: "IoT",
    key: "iot",
    minWidth: "min-w-[120px]",
    render: (driver) => (
      <span className="text-sm font-montserrat text-[#2b2b2b]">
        {driver.iot || "--"}
      </span>
    ),
  },
  {
    header: "License Number",
    key: "licenseNumber",
    minWidth: "min-w-[120px]",
    render: (driver) => (
      <span className="text-sm font-montserrat text-[#2b2b2b]">
        {driver.licenseNumber || "--"}
      </span>
    ),
  },
  {
    header: "Date",
    key: "date",
    minWidth: "min-w-[100px]",
    render: (driver) => (
      <span className="text-sm font-montserrat text-[#2b2b2b]">
        {driver.date || "--"}
      </span>
    ),
  },
];

const DriversListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignFleetModalOpen, setIsAssignFleetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [assignDriver, setAssignDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params
  const queryParams: GetDriversParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(selectedYear && { year: Number(selectedYear) }),
    ...(selectedMonth && { month: months.indexOf(selectedMonth) + 1 }),
  };

  // Fetch Drivers
  const { data: driversData = [], isLoading } = useQuery({
    queryKey: ["drivers", queryParams],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: () => DriverService.getDrivers<any[]>(queryParams),
    select: (data) =>
      data.map((item) => {
        const truck = item.assignedTruck;
        return {
          id: item._id,
          name: item.name,
          route: truck ? `${truck.route.fromState} - ${truck.route.toState}` : "",
          fleet: truck?.fleetName || "",
          iot: truck?.iot || "",
          phone: item.phone || "",
          licenseNumber: item.licenseNumber,
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
          image: item.image || "",
          assignedTruck: truck,
        };
      }) as Driver[],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateDriverPayload) => DriverService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver created successfully");
      setIsOnboardModalOpen(false);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.log(error); // Keep or remove console log if desired
      const errorMessage = error.response?.data?.message || error.message || "Failed to create driver";
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDriverPayload }) =>
      DriverService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver updated successfully");
      setIsEditModalOpen(false);
      setEditDriver(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update driver";
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DriverService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver deleted successfully");
      setIsDeleteModalOpen(false);
      setDeleteDriver(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete driver";
      toast.error(errorMessage);
    },
  });

  const assignFleetMutation = useMutation({
    mutationFn: ({ id, truckId }: { id: string; truckId: string }) =>
      DriverService.assignFleet(id, { truckId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Fleet assigned successfully");
      setIsAssignFleetModalOpen(false);
      setAssignDriver(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to assign fleet";
      toast.error(errorMessage);
    },
  });

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
        setIsOnboardModalOpen(false);
        setIsEditModalOpen(false);
        setIsAssignFleetModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEdit = (id: string) => {
    const driver = driversData.find((d) => d.id === id);
    if (driver) {
      setEditDriver(driver);
      setIsEditModalOpen(true);
    }
  };

  const handleAssignFleet = (id: string) => {
    const driver = driversData.find((d) => d.id === id);
    if (driver) {
      setAssignDriver(driver);
      setIsAssignFleetModalOpen(true);
    }
  };

  const handleRemove = (id: string) => {
    const driver = driversData.find((d) => d.id === id);
    if (driver) {
        setDeleteDriver(driver);
        setIsDeleteModalOpen(true);
    }
  };

  const handleViewDetails = (id: string) => {
    const driver = driversData.find((d) => d.id === id);
    if (driver) {
      setViewDriver(driver);
      setIsViewDetailsModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (deleteDriver) {
        deleteMutation.mutate(deleteDriver.id);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOnboardSubmit = (data: any) => {
    // data contains name and licenseNumber
    createMutation.mutate(data);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSubmit = (data: any) => {
    // data contains phone
    if (editDriver) {
      updateMutation.mutate({ id: editDriver.id, data });
    }
  };

  const handleAssignFleetSubmit = (truckId: string) => {
    if (assignDriver) {
      assignFleetMutation.mutate({ id: assignDriver.id, truckId });
    }
  };

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px] shadow-md">
        <h2 className="text-[17px] font-montserrat text-[#2b2b2b] px-6 pt-6 mb-4">
          Drivers
        </h2>
        <OnboardingDriver
          isOpen={isOnboardModalOpen}
          onClose={() => setIsOnboardModalOpen(false)}
          onSubmit={handleOnboardSubmit}
        />
        <OnboardingDriver
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
          editDriver={editDriver}
        />
        <AssignFleetModal
          isOpen={isAssignFleetModalOpen}
          onClose={() => setIsAssignFleetModalOpen(false)}
          onSubmit={handleAssignFleetSubmit}
          editDriver={assignDriver}
        />
        <DeleteDriverModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            driverName={deleteDriver?.name}
        />
        <DriverDetailsModal
          isOpen={isViewDetailsModalOpen}
          onClose={() => setIsViewDetailsModalOpen(false)}
          driver={viewDriver}
        />
        
        <div className="w-full h-px bg-[#e2e2e2]"></div>
        <div className="w-full bg-[#FAF7F7] mt-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-[70%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
              <div className="relative w-full sm:w-[70%] grow">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 py-2 border border-gray-300 rounded-[4px] text-sm sm:text-base focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-sm sm:placeholder:text-base placeholder:font-montserrat placeholder:font-medium"
                  aria-label="Search drivers"
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
                        className="absolute z-100 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
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
                    className="px-3 pr-10 py-2 border cursor-pointer border-[#808080] rounded-tr-[4px] rounded-br-[4px] text-sm sm:text-base text-left w-full sm:w-[100px] focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
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
                        className="absolute z-100 mt-1 w-full sm:w-[100px] bg-white border border-gray-300 rounded-[4px] shadow-md max-h-30 overflow-y-auto"
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
            <div className="flex items-center gap-4 justify-end">
              <button
                onClick={() => setIsOnboardModalOpen(true)}
                className="cursor-pointer flex items-center gap-[7px] px-4 sm:px-6 py-2 opacity-[0.92] bg-[#538e53] text-[#f9f9f9] text-[12px] sm:text-[13px] lg:text-[14px] font-normal rounded-[4px] transition-colors hover:bg-[#467a46]"
                aria-label="Onboard driver"
              >
                <AddToStoreIcon stroke="#fefefe" />
                Onboard
              </button>
            </div>
          </div>
        </div>
        <div className="my-6 overflow-x-auto">
          {isLoading ? (
             <DriverTableSkeleton />
          ) : (
            <TableList<Driver>
                dataType="drivers"
                columns={driverColumns}
                initialData={driversData}
                ActionMenuComponent={DriverActionMenu}
                handleEdit={handleEdit}
                handleRemove={handleRemove}
                handleAssignFleet={handleAssignFleet}
                handleViewDetails={handleViewDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DriversListPage;
