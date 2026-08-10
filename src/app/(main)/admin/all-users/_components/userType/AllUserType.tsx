"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "@/icons/Icons";
import { CalenderIcon } from "@/icons/DashboardIcons";
import { User } from "@/utils/userTypes";
import AdminTable, {
  ColumnConfig,
} from "../../../_components/table/AdminTableList";
import { UserActionMenu } from "../UserActionMenu";
import Image from "next/image";
import Link from "next/link";
import {
  adminUserService,
  AdminProfession,
  AdminUser,
  AdminUserStatus,
} from "@/services/adminUserService";
import { toast } from "sonner";
import { TableSkeleton } from "../../../_components/TableSkeleton";
import {
  ConfirmActionModal,
  ConfirmActionTone,
} from "../../../_components/ConfirmActionModal";

// List of months in a Year
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

type statusTypes = "All" | "Active" | "Suspended" | "Removed";
const statusTypes: statusTypes[] = ["All", "Active", "Suspended", "Removed"];

const statusToApi = (s: statusTypes): AdminUserStatus | undefined => {
  switch (s) {
    case "Active":
      return "active";
    case "Suspended":
      return "suspended";
    case "Removed":
      return "removed";
    default:
      return undefined;
  }
};

const titleCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const professionArray = (u: AdminUser): string[] => {
  const raw = u.profession;
  if (Array.isArray(raw)) return raw.map((p) => String(p).toLowerCase());
  if (typeof raw === "string") return [raw.toLowerCase()];
  return [];
};

const mapToUiUser = (u: AdminUser, displayProfession?: string): User => {
  const id = (u._id as string) || "";
  const statusRaw = (u.status as string) || "active";
  const activeRole = (u.activeRole as string) || "";
  return {
    id,
    userID: id,
    image: (u.image as string) || (u.avatar as string) || "",
    fullname: (u.name as string) || "Unknown",
    email: (u.email as string) || "",
    location: (u.state as string) || (u.address as string) || "—",
    profession: titleCase(displayProfession || activeRole),
    mobile: (u.phone as string) || "",
    status: titleCase(statusRaw),
    date: u.createdAt
      ? new Date(u.createdAt as string).toLocaleDateString()
      : "",
    checked: false,
  };
};

// Deterministic background colour for an initials avatar, derived from the name.
const avatarColors = [
  "#538e53",
  "#D77F40",
  "#9747FF",
  "#2b7de9",
  "#D6B611",
  "#c0392b",
];
const initialsFor = (name: string) =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";
const colorFor = (name: string) => {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return avatarColors[sum % avatarColors.length];
};

const UserAvatar: React.FC<{ image?: string; name: string }> = ({
  image,
  name,
}) =>
  image ? (
    <Image
      src={image}
      alt={name}
      width={32}
      height={32}
      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[12px] sm:text-[13px] font-montserrat font-semibold"
      style={{ backgroundColor: colorFor(name) }}
    >
      {initialsFor(name)}
    </span>
  );

// Define table columns with improved responsive min-widths
const columns: ColumnConfig<User>[] = [
  {
    key: "fullname",
    header: "Full Name",
    // A real anchor, not just the row's onClick: it is keyboard reachable, it
    // has an accessible name, and -- the reason it matters here -- it
    // navigates natively even before React has hydrated, which the row
    // handler cannot do.
    render: (item: User) => (
      <Link
        href={`/admin/all-users/${item.id}`}
        className="flex items-center gap-2 sm:gap-3 cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#538e53]"
        aria-label={`Open ${item.fullname}'s profile`}
      >
        <UserAvatar image={item.image} name={item.fullname} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b] truncate">
            {item.fullname}
          </span>
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-montserrat font-normal text-[#808080] truncate">
            {item.email}
          </span>
        </div>
      </Link>
    ),
    minWidth: "min-w-[160px] sm:min-w-[180px] md:min-w-[200px]",
  },
  {
    key: "profession",
    header: "Profession",
    minWidth: "min-w-[85px] sm:min-w-[95px] md:min-w-[100px]",
  },
  {
    key: "mobile",
    header: "Mobile",
    minWidth: "min-w-[85px] sm:min-w-[95px] md:min-w-[100px]",
  },
  {
    key: "status",
    header: "Status",
    minWidth: "min-w-[90px] sm:min-w-[100px] md:min-w-[110px]",
    render: (item: User) => {
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
  {
    key: "date",
    header: "Date",
    minWidth: "min-w-[80px] sm:min-w-[90px] md:min-w-[100px]",
  },
];

interface AllUserTypeProps {
  lockedProfession?: AdminProfession;
}

type PendingActionKind = "remove" | "suspend" | "activate" | "reactivate";

interface PendingAction {
  id: string;
  name: string;
  kind: PendingActionKind;
}

// Copy + tone for the confirmation modal, per action. `{name}` is substituted
// with the user's name so the admin can see exactly who they're about to hit.
const ACTION_COPY: Record<
  PendingActionKind,
  {
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    tone: ConfirmActionTone;
  }
> = {
  remove: {
    title: "Remove this user?",
    description: (name) =>
      `${name} will be removed and will lose access to the platform. You can reactivate them later from the Removed tab.`,
    confirmLabel: "Yes, remove",
    tone: "danger",
  },
  suspend: {
    title: "Suspend this user?",
    description: (name) =>
      `${name} will be suspended and will not be able to sign in until you reactivate them.`,
    confirmLabel: "Yes, suspend",
    tone: "danger",
  },
  activate: {
    title: "Activate this user?",
    description: (name) => `${name} will regain full access to the platform.`,
    confirmLabel: "Yes, activate",
    tone: "success",
  },
  reactivate: {
    title: "Reactivate this user?",
    description: (name) =>
      `${name} will be restored and will regain full access to the platform.`,
    confirmLabel: "Yes, reactivate",
    tone: "success",
  },
};

export const AllUserType: React.FC<AllUserTypeProps> = ({
  lockedProfession,
}) => {
  const router = useRouter();
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<statusTypes>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [isStateOpen, setIsStateOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [allChecked, setAllChecked] = useState<boolean>(false);

  // The action staged by the ⋮ menu, awaiting confirmation in the modal.
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const pageSizeOptions = [5, 10, 20, 50];
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // Generate years from 2019 to 2025
  const years = Array.from({ length: 2025 - 2019 + 1 }, (_, i) => 2019 + i);

  // Debounce search input (400ms) to avoid firing an API call on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [
    selectedStatus,
    debouncedSearch,
    selectedState,
    selectedMonth,
    selectedYear,
  ]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthNumber = selectedMonth
        ? months.indexOf(selectedMonth) + 1
        : undefined;
      const { data, pagination } = await adminUserService.getUsers({
        profession: lockedProfession,
        status: statusToApi(selectedStatus),
        search: debouncedSearch || undefined,
        state: selectedState || undefined,
        month: monthNumber,
        year: selectedYear || undefined,
        page,
        limit,
      });
      const scoped = lockedProfession
        ? data.filter((u) => professionArray(u).includes(lockedProfession))
        : data;
      setAdmins(scoped.map((u) => mapToUiUser(u, lockedProfession)));
      setTotalItems(pagination?.total ?? scoped.length);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch users",
      );
      setAdmins([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    lockedProfession,
    selectedStatus,
    debouncedSearch,
    selectedState,
    selectedMonth,
    selectedYear,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

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
        setIsStateOpen(false);
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openDetail = useCallback(
    (id: string) => {
      router.push(`/admin/all-users/${id}`);
    },
    [router],
  );

  const handleViewProfile = (id: string) => {
    openDetail(id);
  };

  // Remove and Suspend are destructive, so neither fires straight from the menu.
  // Both handlers only stage a pending action; the mutation runs in
  // `runPendingAction` once the admin confirms in the modal.
  const handleSuspended = (id: string) => {
    const user = admins.find((a) => a.userID === id);
    if (!user) return;
    setPendingAction({ id, name: user.fullname, kind: "remove" });
  };

  const handleToggleStatus = (id: string) => {
    const user = admins.find((a) => a.userID === id);
    if (!user) return;
    const current = user.status.toLowerCase();
    const kind: PendingActionKind =
      current === "removed"
        ? "reactivate"
        : current === "active"
          ? "suspend"
          : "activate";
    setPendingAction({ id, name: user.fullname, kind });
  };

  // Runs the real mutation for whichever action the admin confirmed.
  const runPendingAction = async () => {
    if (!pendingAction) return;
    const { id, kind } = pendingAction;

    // Reactivate has its own endpoint and needs no profession.
    if (kind === "reactivate") {
      setIsActionSubmitting(true);
      try {
        await adminUserService.reactivateUser(id);
        toast.success("User reactivated");
        setPendingAction(null);
        fetchUsers();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to reactivate user",
        );
      } finally {
        setIsActionSubmitting(false);
      }
      return;
    }

    const nextStatus: AdminUserStatus =
      kind === "remove"
        ? "removed"
        : kind === "suspend"
          ? "suspended"
          : "active";

    setIsActionSubmitting(true);
    try {
      // `profession` is not required by the backend — sending `{ status }`
      // alone returns 200. Deriving it used to abort the action outright.
      await adminUserService.updateUserStatus(id, nextStatus);
      toast.success(`User ${nextStatus}`);
      setPendingAction(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (id: string) => {
    setAdmins(
      admins.map((admin) =>
        admin.userID === id ? { ...admin, checked: !admin.checked } : admin
      )
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);
    setAdmins(admins.map((admin) => ({ ...admin, checked: newAllChecked })));
  };

  // Dropdown animation variants
  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full mx-auto">
      <div className="w-full bg-[#FAF7F7] mt-4 py-4 px-3 sm:px-4 md:px-6">
        {/* Improved Responsive Layout */}
        <div className="ccecc-flex-style gap-4 w-full max-w-full">
          {/* Search Input - Always full width on mobile, constrained on larger screens */}
          <div className="w-full max-w-full sm:max-w-[280px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#538e53] focus:border-transparent placeholder:text-[#808080] placeholder:text-xs sm:placeholder:text-sm placeholder:font-montserrat placeholder:font-medium"
                aria-label="Search all users"
                aria-describedby="search-description"
              />
              <span id="search-description" className="sr-only">
                Search for users by name, userID, or email
              </span>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon stroke="#808080" className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter Controls - Responsive Grid Layout */}
          <div className="w-full grid grid-cols-style sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {/* Year and Month Combined Container - Takes 2 columns on larger screens */}
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <div className="flex gap-0 w-full">
                {/* Year Dropdown */}
                <div className="relative flex-1" ref={yearDropdownRef}>
                  <button
                    onClick={() => setIsYearOpen(!isYearOpen)}
                    className="w-full px-2 pl-7 pr-7 py-2.5 border-[1px] border-[#808080] rounded-l-md border-r-0 text-xs sm:text-sm text-left focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:z-10 relative hover:bg-gray-50 transition-colors"
                    role="combobox"
                    aria-expanded={isYearOpen}
                    aria-controls="year-dropdown"
                    aria-label={
                      selectedYear
                        ? `Selected year: ${selectedYear}`
                        : "Select year"
                    }
                  >
                    <span className="truncate">{selectedYear || "Year"}</span>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      {isYearOpen ? (
                        <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                      <CalenderIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isYearOpen && (
                      <motion.div
                        id="year-dropdown"
                        className="absolute z-20 mt-1 w-full border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                        role="listbox"
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div
                          onClick={() => {
                            setSelectedYear("");
                            setIsYearOpen(false);
                          }}
                          className={`px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 ${
                            selectedYear === "" ? "bg-gray-100 font-medium" : ""
                          }`}
                          role="option"
                          aria-selected={selectedYear === ""}
                        >
                          Years
                        </div>
                        {years.map((year) => (
                          <div
                            key={year}
                            onClick={() => {
                              setSelectedYear(year.toString());
                              setIsYearOpen(false);
                            }}
                            className={`px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 ${
                              selectedYear === year.toString()
                                ? "bg-gray-100 font-medium"
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
                    className="w-full px-2 pr-7 py-2.5 border-[1px] border-[#808080] rounded-r-md text-xs sm:text-sm text-left focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:z-10 relative hover:bg-gray-50 transition-colors"
                    role="combobox"
                    aria-expanded={isMonthOpen}
                    aria-controls="month-dropdown"
                    aria-label={
                      selectedMonth
                        ? `Selected month: ${selectedMonth}`
                        : "Select month"
                    }
                  >
                    <span className="truncate">{selectedMonth || "Month"}</span>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      {isMonthOpen ? (
                        <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isMonthOpen && (
                      <motion.div
                        id="month-dropdown"
                        className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                        role="listbox"
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div
                          onClick={() => {
                            setSelectedMonth("");
                            setIsMonthOpen(false);
                          }}
                          className={`px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 ${
                            selectedMonth === ""
                              ? "bg-gray-100 font-medium"
                              : ""
                          }`}
                          role="option"
                          aria-selected={selectedMonth === ""}
                        >
                          Months
                        </div>
                        {months.map((month) => (
                          <div
                            key={month}
                            onClick={() => {
                              setSelectedMonth(month);
                              setIsMonthOpen(false);
                            }}
                            className={`px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 ${
                              selectedMonth === month
                                ? "bg-gray-100 font-medium"
                                : ""
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

            {/* State Dropdown */}
            <div
              className="relative flex-shrink-0 md:min-w-[100px]"
              ref={stateDropdownRef}
            >
              <button
                onClick={() => setIsStateOpen(!isStateOpen)}
                className="w-full px-2 pr-7 py-2.5 border-[1px] border-[#808080] rounded-md text-xs sm:text-sm font-montserrat text-left focus:outline-none focus:ring-[1px] focus:ring-[#538e53] hover:bg-gray-50 transition-colors"
                role="combobox"
                aria-expanded={isStateOpen}
                aria-controls="state-dropdown"
                aria-label={
                  selectedState
                    ? `Selected state: ${selectedState}`
                    : "Select state"
                }
              >
                <span className="truncate">
                  {selectedState || "All States"}
                </span>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {isStateOpen ? (
                    <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {isStateOpen && (
                  <motion.div
                    id="state-dropdown"
                    className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                    role="listbox"
                    variants={dropdownVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div
                      onClick={() => {
                        setSelectedState("");
                        setIsStateOpen(false);
                      }}
                      className={`px-3 py-2 text-xs sm:text-sm cursor-pointer font-montserrat hover:bg-gray-100 ${
                        selectedState === "" ? "bg-gray-100 font-medium" : ""
                      }`}
                      role="option"
                      aria-selected={selectedState === ""}
                    >
                      All States
                    </div>
                    {nigeriaStates.map((state) => (
                      <div
                        key={state}
                        onClick={() => {
                          setSelectedState(state);
                          setIsStateOpen(false);
                        }}
                        className={`px-3 py-2 text-xs sm:text-sm cursor-pointer font-montserrat hover:bg-gray-100 ${
                          selectedState === state
                            ? "bg-gray-100 font-medium"
                            : ""
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

            {/* Status Dropdown */}
            <div
              className="relative flex-shrink-0 md:min-w-[100px]"
              ref={statusDropdownRef}
            >
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full px-2 pr-7 py-2.5 border-[1px] border-[#808080] rounded-md text-xs sm:text-sm font-montserrat text-left focus:outline-none focus:ring-[1px] focus:ring-[#538e53] hover:bg-gray-50 transition-colors"
                role="combobox"
                aria-expanded={isStatusOpen}
                aria-controls="status-dropdown"
                aria-label={
                  selectedStatus
                    ? `Selected status: ${selectedStatus}`
                    : "Select status"
                }
              >
                <span className="truncate">{selectedStatus}</span>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {isStatusOpen ? (
                    <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    id="status-dropdown"
                    className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                    role="listbox"
                    variants={dropdownVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {statusTypes.map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status as statusTypes);
                          setIsStatusOpen(false);
                        }}
                        className={`px-3 py-2 text-xs sm:text-sm cursor-pointer font-montserrat hover:bg-gray-100 ${
                          selectedStatus === status
                            ? "bg-gray-100 font-medium"
                            : ""
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
      </div>

      {/* Table Container with improved responsive handling */}
      <div className="mt-6 w-full">
        {isLoading ? (
          <TableSkeleton columns={5} rows={limit > 6 ? 6 : limit} />
        ) : (
          <AdminTable<User>
            dataType="initialUsers"
            columns={columns}
            initialData={admins}
            ActionMenuComponent={UserActionMenu}
            handleViewProfile={handleViewProfile}
            handleSuspended={handleSuspended}
            handleToggleStatus={handleToggleStatus}
            handleCheckboxChange={handleCheckboxChange}
            handleSelectAll={handleSelectAll}
            allChecked={allChecked}
            onRowClick={openDetail}
          />
        )}

        {!isLoading && admins.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm font-montserrat">
            No users found.
          </div>
        )}

        {!isLoading && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 mt-2">
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmActionModal
        isOpen={pendingAction !== null}
        title={pendingAction ? ACTION_COPY[pendingAction.kind].title : ""}
        description={
          pendingAction
            ? ACTION_COPY[pendingAction.kind].description(pendingAction.name)
            : undefined
        }
        confirmLabel={
          pendingAction ? ACTION_COPY[pendingAction.kind].confirmLabel : ""
        }
        tone={pendingAction ? ACTION_COPY[pendingAction.kind].tone : "danger"}
        isSubmitting={isActionSubmitting}
        onCancel={() => {
          if (!isActionSubmitting) setPendingAction(null);
        }}
        onConfirm={runPendingAction}
      />
    </div>
  );
};
