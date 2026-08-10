"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SuspendedTable } from "./_components/ASRTable/SuspendedTable";
import { RemovedTable } from "./_components/ASRTable/RemovedTable";
import { ActiveTable } from "./_components/ASRTable/ActiveTable";
import { AdminControl } from "@/utils/AdminControl";
import {
  adminUserService,
  AdminUser,
} from "@/services/adminUserService";
import { TableSkeleton } from "../_components/TableSkeleton";
import { ConfirmActionModal } from "../_components/ConfirmActionModal";
import { BulkAction } from "../_components/BulkActionBar";

type BulkUserAction = "suspend" | "remove" | "reactivate";

interface PendingBulk {
  action: BulkUserAction;
  ids: string[];
  /** "row" came from a single row's action menu and must use the single-user
   * endpoints; "bulk" came from the selection bar. Both confirm first --
   * suspending or removing somebody is not an undoable click. */
  scope: "row" | "bulk";
}

type SlideType = "Active" | "Suspended" | "Removed";

interface IndicatorStyle {
  left: number;
  width: number;
}

interface TabConfig {
  id: string;
  label: SlideType;
  displayLabel: string;
  count: number;
  textColor: string;
  colorClass: string;
  colorClassFaded: string;
}

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

// The stats endpoint may expose counts under `byStatus` or at the top level.
const readStatusCount = (
  stats: Record<string, unknown> | null,
  keys: string[],
): number => {
  if (!stats) return 0;
  const byStatus = (stats.byStatus as Record<string, unknown>) || {};
  for (const key of keys) {
    const value = stats[key] ?? byStatus[key];
    if (typeof value === "number") return value;
  }
  return 0;
};

const titleCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const mapToAdminControl = (u: AdminUser): AdminControl => {
  const id = (u._id as string) || "";
  const status = titleCase((u.status as string) || "") as
    | "Active"
    | "Suspended"
    | "Removed";
  return {
    id,
    fullName: (u.name as string) || "Unknown",
    email: (u.email as string) || "",
    image: (u.avatar as string) || "/images/placeholder-avatar.png",
    location: (u.state as string) || (u.address as string) || "—",
    mobile: (u.phone as string) || "",
    status,
    date: u.createdAt
      ? new Date(u.createdAt as string).toLocaleDateString()
      : "",
    checked: false,
  };
};

export default function SuspendedPage() {
  const [activeTab, setActiveTab] = useState<SlideType>("Suspended");
  const [data, setData] = useState<AdminControl[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allChecked, setAllChecked] = useState<boolean>(false);
  const [counts, setCounts] = useState<Record<SlideType, number>>({
    Active: 0,
    Suspended: 0,
    Removed: 0,
  });

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  const pageSizeOptions = [5, 10, 20, 50];
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const [pendingBulk, setPendingBulk] = useState<PendingBulk | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
  });

  // Debounce search input (400ms) to avoid firing an API call on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedState, selectedMonth, selectedYear]);

  const fetchForTab = useCallback(
    async (tab: SlideType) => {
      setIsLoading(true);
      try {
        const monthNumber = selectedMonth
          ? months.indexOf(selectedMonth) + 1
          : undefined;
        const filters = {
          search: debouncedSearch || undefined,
          state: selectedState || undefined,
          month: monthNumber,
          year: selectedYear || undefined,
          page,
          limit,
        };
        const res =
          tab === "Removed"
            ? await adminUserService.getRemovedUsers(filters)
            : await adminUserService.getUsers({
                status: tab === "Active" ? "active" : "suspended",
                ...filters,
              });
        setData(res.data.map(mapToAdminControl));
        setTotalItems(res.pagination?.total ?? res.data.length);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load users");
        setData([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, selectedState, selectedMonth, selectedYear, page, limit],
  );

  useEffect(() => {
    fetchForTab(activeTab);
  }, [activeTab, fetchForTab]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Tab counts come from a single stats call so they stay accurate regardless
  // of the filters applied to the visible tab.
  const fetchCounts = useCallback(async () => {
    try {
      const stats = await adminUserService.getUserStats();
      const source = stats as Record<string, unknown>;
      setCounts({
        Active: readStatusCount(source, ["active", "activeUsers"]),
        Suspended: readStatusCount(source, [
          "suspended",
          "inactive",
          "suspendedUsers",
        ]),
        Removed: readStatusCount(source, ["removed", "removedUsers"]),
      });
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "active-tab",
        label: "Active",
        displayLabel: "Active",
        count: counts.Active,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "suspended-tab",
        label: "Suspended",
        displayLabel: "Suspended",
        count: counts.Suspended,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "removed-tab",
        label: "Removed",
        displayLabel: "Removed",
        count: counts.Removed,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
    ],
    [counts],
  );

  const handleSwitchTab = (tab: SlideType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setAllChecked(false);
    setPage(1);
  };

  const handleCheckboxChange = (id: string) => {
    setData((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    );
  };

  const handleSelectAll = () => {
    const next = !allChecked;
    setAllChecked(next);
    setData((prev) => prev.map((c) => ({ ...c, checked: next })));
  };

  const patchStatus = async (
    id: string,
    status: "suspended" | "removed" | "active",
  ) => {
    try {
      await adminUserService.updateUserStatus(id, status);
      toast.success(`User ${status}`);
      fetchForTab(activeTab);
      fetchCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  // Row actions ask first, exactly as the bulk bar does. Previously these
  // fired the write on a single click with no dialog and no undo, while
  // selecting the same user via its checkbox did confirm.
  const handleAdminSuspended = (id: string) =>
    setPendingBulk({ action: "suspend", ids: [id], scope: "row" });
  const handleAdminRemoved = (id: string) =>
    setPendingBulk({ action: "remove", ids: [id], scope: "row" });
  const handleReactivate = (id: string) =>
    setPendingBulk({ action: "reactivate", ids: [id], scope: "row" });

  const reactivate = async (id: string) => {
    try {
      await adminUserService.reactivateUser(id);
      toast.success("User reactivated");
      fetchForTab(activeTab);
      fetchCounts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reactivate user",
      );
    }
  };

  const handleAdminOnboarding = (id: string) => handleReactivate(id);

  const selectedIds = useMemo(
    () => data.filter((u) => u.checked).map((u) => u.id),
    [data],
  );

  const clearSelection = () => {
    setAllChecked(false);
    setData((prev) => prev.map((u) => ({ ...u, checked: false })));
  };

  const requestBulk = (action: BulkUserAction) => {
    if (selectedIds.length === 0) return;
    setPendingBulk({ action, ids: selectedIds, scope: "bulk" });
  };

  const cancelPendingBulk = () => {
    if (isSubmitting) return;
    setPendingBulk(null);
  };

  const confirmPendingBulk = async () => {
    if (!pendingBulk) return;
    const { action, ids, scope } = pendingBulk;

    // A row action is still a single-user action -- keep it on the
    // single-user endpoints rather than sending a one-element bulk payload.
    if (scope === "row") {
      setIsSubmitting(true);
      try {
        if (action === "suspend") await patchStatus(ids[0], "suspended");
        else if (action === "remove") await patchStatus(ids[0], "removed");
        else await reactivate(ids[0]);
        setPendingBulk(null);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "suspend") {
        await adminUserService.bulkUpdateUserStatus({
          userIds: ids,
          status: "suspended",
        });
        toast.success(`${ids.length} user${ids.length > 1 ? "s" : ""} suspended`);
      } else if (action === "remove") {
        await adminUserService.bulkRemoveUsers({ userIds: ids });
        toast.success(`${ids.length} user${ids.length > 1 ? "s" : ""} removed`);
      } else {
        await adminUserService.bulkReactivateUsers({ userIds: ids });
        toast.success(
          `${ids.length} user${ids.length > 1 ? "s" : ""} reactivated`,
        );
      }
      clearSelection();
      await fetchForTab(activeTab);
      fetchCounts();
      setPendingBulk(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bulk action failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const bulkActions = useMemo<BulkAction[]>(() => {
    if (selectedIds.length === 0) return [];
    if (activeTab === "Active") {
      return [
        {
          id: "suspend",
          label: "Suspend",
          tone: "success",
          onClick: () => requestBulk("suspend"),
        },
        {
          id: "remove",
          label: "Remove",
          tone: "danger",
          onClick: () => requestBulk("remove"),
        },
      ];
    }
    if (activeTab === "Suspended") {
      return [
        {
          id: "reactivate",
          label: "Reactivate",
          tone: "success",
          onClick: () => requestBulk("reactivate"),
        },
        {
          id: "remove",
          label: "Remove",
          tone: "danger",
          onClick: () => requestBulk("remove"),
        },
      ];
    }
    return [
      {
        id: "onboard",
        label: "Onboard",
        tone: "success",
        onClick: () => requestBulk("reactivate"),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedIds]);

  const bulkDisabled = isSubmitting;

  const bulkConfirm = (() => {
    if (!pendingBulk)
      return { title: "", description: "", confirmLabel: "", tone: "info" as const };
    const count = pendingBulk.ids.length;
    const plural = count > 1 ? "s" : "";
    const isRow = pendingBulk.scope === "row";
    // A row action names one person, so "1 selected user" would read oddly.
    const who = isRow
      ? data.find((u) => u.id === pendingBulk.ids[0])?.fullName || "this user"
      : `${count} selected user${plural}`;
    const subject = isRow ? who : `${count} user${plural}`;

    if (pendingBulk.action === "suspend") {
      return {
        title: isRow ? `Suspend ${who}?` : `Suspend ${count} user${plural}?`,
        description: `This will suspend ${subject}. They will lose access until reactivated.`,
        confirmLabel: isRow ? "Suspend" : "Suspend all",
        tone: "danger" as const,
      };
    }
    if (pendingBulk.action === "remove") {
      return {
        title: isRow ? `Remove ${who}?` : `Remove ${count} user${plural}?`,
        description: `This will remove ${subject} from the platform.`,
        confirmLabel: isRow ? "Remove" : "Remove all",
        tone: "danger" as const,
      };
    }
    return {
      title: isRow ? `Reactivate ${who}?` : `Reactivate ${count} user${plural}?`,
      description: `This will reactivate ${subject} and restore platform access.`,
      confirmLabel: isRow ? "Reactivate" : "Reactivate all",
      tone: "success" as const,
    };
  })();

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabIndex = tabs.findIndex((tab) => tab.label === activeTab);
      const activeContainer = tabRefs.current[activeTabIndex];
      const container = containerRef.current;
      if (activeContainer && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeContainer.getBoundingClientRect();
        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    };
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  const renderContent = () => {
    // Only take over the whole panel on the initial load — once rows exist the
    // filter bar must stay mounted so the search input keeps focus while
    // refetching.
    if (isLoading && data.length === 0) {
      return <TableSkeleton columns={5} rows={limit > 6 ? 6 : limit} />;
    }
    const filterProps = {
      searchTerm,
      onSearchChange: setSearchTerm,
      selectedYear,
      onYearChange: setSelectedYear,
      selectedMonth,
      onMonthChange: setSelectedMonth,
      selectedState,
      onStateChange: setSelectedState,
    };
    const componentMap: Record<SlideType, React.ReactNode> = {
      Active: (
        <ActiveTable
          {...filterProps}
          data={data}
          handleAdminSuspended={handleAdminSuspended}
          handleAdminRemoved={handleAdminRemoved}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          bulkActions={bulkActions}
          bulkDisabled={bulkDisabled}
        />
      ),
      Suspended: (
        <SuspendedTable
          {...filterProps}
          data={data}
          handleReactivate={handleReactivate}
          handleAdminRemoved={handleAdminRemoved}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          bulkActions={bulkActions}
          bulkDisabled={bulkDisabled}
        />
      ),
      Removed: (
        <RemovedTable
          {...filterProps}
          data={data}
          handleAdminOnboarding={handleAdminOnboarding}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          bulkActions={bulkActions}
          bulkDisabled={bulkDisabled}
        />
      ),
    };
    return (
      <>
        {componentMap[activeTab]}
        {!isLoading && data.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm font-montserrat">
            No {activeTab.toLowerCase()} users found.
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-[95%] mx-auto mb-5 rounded-[10px] bg-[#fefefe] shadow-md">
      <h1 className="mb-4 px-6 pt-6 text-base font-normal font-montserrat sm:text-lg">
        Approvals
      </h1>
      <div className="flex flex-col overflow-x-auto flex-nowrap">
        <div
          className="relative mb-2 flex items-center gap-3 px-6 flex-nowrap"
          ref={containerRef}
          role="tablist"
          aria-label="Approval management tabs"
        >
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className="cursor-pointer relative flex items-center gap-1 shrink-0"
              role="tab"
              id={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
            >
              <button
                role="tab"
                id={tab.id}
                onClick={() => handleSwitchTab(tab.label)}
                className={`cursor-pointer px-2 text-sm font-medium sm:text-base ${
                  activeTab === tab.label ? tab.textColor : "text-[#2b2b2b]"
                } transition-colors duration-200`}
                aria-selected={activeTab === tab.label}
                aria-controls={`${tab.label.toLowerCase()}-panel`}
              >
                {tab.displayLabel} ({tab.count})
              </button>
            </div>
          ))}
          <motion.div
            className={`absolute -bottom-2 h-[3.7px] rounded-t-[10px] ${
              tabs.find((tab) => tab.label === activeTab)?.colorClass ||
              "bg-green-600"
            }`}
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        <div className="h-px w-full bg-gray-200" />
      </div>

      <div
        className="mb-4"
        role="tabpanel"
        id={`${activeTab.toLowerCase()}-panel`}
        aria-labelledby={tabs.find((tab) => tab.label === activeTab)?.id}
      >
        {renderContent()}
      </div>

      <ConfirmActionModal
        isOpen={!!pendingBulk}
        title={bulkConfirm.title}
        description={bulkConfirm.description}
        confirmLabel={bulkConfirm.confirmLabel}
        tone={bulkConfirm.tone}
        isSubmitting={isSubmitting}
        onCancel={cancelPendingBulk}
        onConfirm={confirmPendingBulk}
      />

      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
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
  );
}
