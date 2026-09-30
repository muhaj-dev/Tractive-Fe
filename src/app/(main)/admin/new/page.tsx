"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ApprovalsAgents } from "./_components/ApprovalsAgents";
import { ApprovalTransporters } from "./_components/ApprovalTransporters";
import { AgentsProps, TransportersProps } from "@/utils/Approvals";
import {
  approvalService,
  ApprovalDecision,
} from "@/services/approvalService";
import { ConfirmActionModal } from "../_components/ConfirmActionModal";
import { UserDetailsModal } from "../_components/UserDetailsModal";
import { BulkAction } from "../_components/BulkActionBar";

type SlideType = "Agents" | "Transporters";
type ApprovalKind = "agent" | "transporter";

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

interface PendingAction {
  kind: ApprovalKind;
  id: string;
  decision: ApprovalDecision;
}

interface PendingBulk {
  kind: ApprovalKind;
  ids: string[];
  decision: ApprovalDecision;
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

export default function ApprovalPage() {
  const [activeTab, setActiveTab] = useState<SlideType>("Agents");

  const [agents, setAgents] = useState<AgentsProps[]>([]);
  const [transporters, setTransporters] = useState<TransportersProps[]>([]);
  const [agentsLoading, setAgentsLoading] = useState<boolean>(true);
  const [transportersLoading, setTransportersLoading] = useState<boolean>(true);
  const [agentsTotal, setAgentsTotal] = useState<number>(0);
  const [transportersTotal, setTransportersTotal] = useState<number>(0);

  // Filter state lives here so it can be forwarded to the API.
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [allChecked, setAllChecked] = useState<boolean>(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<
    AgentsProps | TransportersProps | null
  >(null);
  const [selectedKind, setSelectedKind] = useState<ApprovalKind>("agent");

  const [pendingBulk, setPendingBulk] = useState<PendingBulk | null>(null);

  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
  });

  const pageSizeOptions = [5, 10, 20, 50];
  const totalItems = activeTab === "Agents" ? agentsTotal : transportersTotal;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const isLoading =
    activeTab === "Agents" ? agentsLoading : transportersLoading;

  // Debounce search input (400ms) to avoid firing an API call on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedState, selectedMonth, selectedYear]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      state: selectedState || undefined,
      year: selectedYear || undefined,
      month: selectedMonth
        ? String(months.indexOf(selectedMonth) + 1)
        : undefined,
    }),
    [debouncedSearch, selectedState, selectedYear, selectedMonth],
  );

  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      // Without status the API returns every applicant, approved ones included,
      // which buried the one pending agent among eight approved accounts.
      const { data, pagination } = await approvalService.getPendingAgents({
        ...queryParams,
        status: "pending",
        page,
        limit,
      });
      setAgents(data.map((a) => ({ ...a, checked: false })));
      setAgentsTotal(pagination?.total ?? data.length);
    } catch {
      setAgents([]);
      setAgentsTotal(0);
    } finally {
      setAgentsLoading(false);
    }
  }, [queryParams, page, limit]);

  const fetchTransporters = useCallback(async () => {
    setTransportersLoading(true);
    try {
      const { data, pagination } = await approvalService.getPendingTransporters(
        { ...queryParams, status: "pending", page, limit },
      );
      setTransporters(data.map((t) => ({ ...t, checked: false })));
      setTransportersTotal(pagination?.total ?? data.length);
    } catch {
      setTransporters([]);
      setTransportersTotal(0);
    } finally {
      setTransportersLoading(false);
    }
  }, [queryParams, page, limit]);

  useEffect(() => {
    fetchAgents();
    fetchTransporters();
  }, [fetchAgents, fetchTransporters]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const counts = useMemo(
    () => ({
      Agents: agentsTotal,
      Transporters: transportersTotal,
    }),
    [agentsTotal, transportersTotal],
  );

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "agents-tab",
        label: "Agents",
        displayLabel: "Agents",
        count: counts.Agents,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
      {
        id: "transporters-tab",
        label: "Transporters",
        displayLabel: "Transporters",
        count: counts.Transporters,
        colorClass: "bg-[#538e53]",
        textColor: "text-[#538e53]",
        colorClassFaded: "text-[#fefefe]",
      },
    ],
    [counts],
  );

  const handleSwitchTab = (tab: SlideType) => {
    setActiveTab(tab);
    setAllChecked(false);
    setPage(1);
  };

  const handleCheckboxChange = (id: string) => {
    if (activeTab === "Agents") {
      setAgents(
        agents.map((agent) =>
          agent.id === id ? { ...agent, checked: !agent.checked } : agent,
        ),
      );
    } else {
      setTransporters(
        transporters.map((t) =>
          t.id === id ? { ...t, checked: !t.checked } : t,
        ),
      );
    }
  };

  const handleSelectAll = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);
    if (activeTab === "Agents") {
      setAgents(agents.map((agent) => ({ ...agent, checked: newAllChecked })));
    } else {
      setTransporters(
        transporters.map((t) => ({ ...t, checked: newAllChecked })),
      );
    }
  };

  const requestAction = (action: PendingAction) => setPendingAction(action);

  const handleAgentApprove = (id: string) =>
    requestAction({ kind: "agent", id, decision: "approved" });
  const handleAgentDecline = (id: string) =>
    requestAction({ kind: "agent", id, decision: "rejected" });
  const handleTransporterApprove = (id: string) =>
    requestAction({ kind: "transporter", id, decision: "approved" });
  const handleTransporterDecline = (id: string) =>
    requestAction({ kind: "transporter", id, decision: "rejected" });

  const handleAgentRowClick = (id: string) => {
    const found = agents.find((a) => a.id === id);
    if (!found) return;
    setSelectedKind("agent");
    setSelectedUser(found);
  };

  const handleTransporterRowClick = (id: string) => {
    const found = transporters.find((t) => t.id === id);
    if (!found) return;
    setSelectedKind("transporter");
    setSelectedUser(found);
  };

  const closeDetails = () => {
    if (isSubmitting) return;
    setSelectedUser(null);
  };

  const approveFromDetails = (id: string) => {
    setSelectedUser(null);
    requestAction({ kind: selectedKind, id, decision: "approved" });
  };

  const rejectFromDetails = (id: string) => {
    setSelectedUser(null);
    requestAction({ kind: selectedKind, id, decision: "rejected" });
  };

  const selectedAgentIds = useMemo(
    () => agents.filter((a) => a.checked).map((a) => a.id),
    [agents],
  );
  const selectedTransporterIds = useMemo(
    () => transporters.filter((t) => t.checked).map((t) => t.id),
    [transporters],
  );

  const selectedIds =
    activeTab === "Agents" ? selectedAgentIds : selectedTransporterIds;

  const clearSelection = () => {
    setAllChecked(false);
    if (activeTab === "Agents") {
      setAgents((prev) => prev.map((a) => ({ ...a, checked: false })));
    } else {
      setTransporters((prev) => prev.map((t) => ({ ...t, checked: false })));
    }
  };

  const requestBulk = (decision: ApprovalDecision) => {
    if (selectedIds.length === 0) return;
    setPendingBulk({
      kind: activeTab === "Agents" ? "agent" : "transporter",
      ids: selectedIds,
      decision,
    });
  };

  const cancelPendingBulk = () => {
    if (isSubmitting) return;
    setPendingBulk(null);
  };

  const confirmPendingBulk = async () => {
    if (!pendingBulk) return;
    const { kind, ids, decision } = pendingBulk;
    const reason =
      decision === "approved" ? "Bulk approval" : "Bulk rejection";

    setIsSubmitting(true);
    try {
      if (kind === "agent") {
        await approvalService.bulkUpdateAgentApproval({
          agentIds: ids,
          status: decision,
          reason,
        });
      } else {
        await approvalService.bulkUpdateTransporterApproval({
          transporterIds: ids,
          status: decision,
          reason,
        });
      }
      toast.success(
        decision === "approved"
          ? `${ids.length} ${kind}${ids.length > 1 ? "s" : ""} approved`
          : `${ids.length} ${kind}${ids.length > 1 ? "s" : ""} rejected`,
      );
      clearSelection();
      if (kind === "agent") {
        await fetchAgents();
      } else {
        await fetchTransporters();
      }
      setPendingBulk(null);
    } catch {
      // service layer toasts
    } finally {
      setIsSubmitting(false);
    }
  };

  const bulkActions: BulkAction[] =
    selectedIds.length === 0
      ? []
      : [
          {
            id: "approve",
            label: "Approve",
            tone: "success",
            onClick: () => requestBulk("approved"),
          },
          {
            id: "decline",
            label: "Decline",
            tone: "danger",
            onClick: () => requestBulk("rejected"),
          },
        ];

  const bulkDisabled = isSubmitting;

  const cancelPendingAction = () => {
    if (isSubmitting) return;
    setPendingAction(null);
    setRejectReason("");
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const { kind, id, decision } = pendingAction;
    const reason =
      decision === "approved"
        ? "Approved by admin"
        : rejectReason.trim() || "Rejected by admin";

    setIsSubmitting(true);
    try {
      if (kind === "agent") {
        await approvalService.updateAgentApproval(id, {
          status: decision,
          reason,
        });
        toast.success(
          decision === "approved" ? "Agent approved" : "Agent rejected",
        );
        await fetchAgents();
      } else {
        await approvalService.updateTransporterApproval(id, {
          status: decision,
          reason,
        });
        toast.success(
          decision === "approved"
            ? "Transporter approved"
            : "Transporter rejected",
        );
        await fetchTransporters();
      }
      setPendingAction(null);
      setRejectReason("");
    } catch {
      // Error toast is shown by the service layer.
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabIndex = tabs.findIndex((tab) => tab.label === activeTab);
      const activeContainer = tabRefs.current[activeTabIndex];
      const container = containerRef.current;

      if (activeContainer && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeContainer.getBoundingClientRect();
        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;
        setIndicatorStyle({ left, width });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  const renderContent = () => {
    const componentMap: Record<SlideType, React.ReactNode> = {
      Agents: (
        <ApprovalsAgents
          data={agents}
          isLoading={agentsLoading}
          handleAgentApprove={handleAgentApprove}
          handleAgentDecline={handleAgentDecline}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={handleAgentRowClick}
          bulkActions={bulkActions}
          bulkDisabled={bulkDisabled}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedState={selectedState}
          onStateChange={setSelectedState}
        />
      ),
      Transporters: (
        <ApprovalTransporters
          data={transporters}
          isLoading={transportersLoading}
          handleTransporterApprove={handleTransporterApprove}
          handleTransporterDecline={handleTransporterDecline}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={handleTransporterRowClick}
          bulkActions={bulkActions}
          bulkDisabled={bulkDisabled}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedState={selectedState}
          onStateChange={setSelectedState}
        />
      ),
    };
    return componentMap[activeTab];
  };

  const modalSubject =
    pendingAction?.kind === "agent" ? "agent" : "transporter";
  const modalIsApprove = pendingAction?.decision === "approved";

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
              className="cursor-pointer relative flex items-center gap-1 flex-shrink-0"
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
        <div className="h-[1px] w-[100%] bg-gray-200" />
      </div>

      <div
        className="mb-4"
        role="tabpanel"
        id={`${activeTab.toLowerCase()}-panel`}
        aria-labelledby={tabs.find((tab) => tab.label === activeTab)?.id}
      >
        {renderContent()}
      </div>

      <UserDetailsModal
        isOpen={!!selectedUser}
        kind={selectedKind}
        user={selectedUser}
        isSubmitting={isSubmitting}
        onClose={closeDetails}
        onApprove={approveFromDetails}
        onReject={rejectFromDetails}
      />

      <ConfirmActionModal
        isOpen={!!pendingAction}
        title={`${modalIsApprove ? "Approve" : "Reject"} ${modalSubject}?`}
        description={
          modalIsApprove
            ? `This will approve the ${modalSubject} and grant them access to the platform.`
            : `This will reject the ${modalSubject}'s application.`
        }
        confirmLabel={modalIsApprove ? "Approve" : "Reject"}
        tone={modalIsApprove ? "success" : "danger"}
        isSubmitting={isSubmitting}
        onCancel={cancelPendingAction}
        onConfirm={confirmPendingAction}
        reasonInput={!modalIsApprove}
        reasonValue={rejectReason}
        onReasonChange={setRejectReason}
        reasonLabel="Reason for rejection"
        reasonPlaceholder="Let the applicant know why (optional)"
      />

      <ConfirmActionModal
        isOpen={!!pendingBulk}
        title={
          pendingBulk
            ? `${pendingBulk.decision === "approved" ? "Approve" : "Reject"} ${pendingBulk.ids.length} ${pendingBulk.kind}${pendingBulk.ids.length > 1 ? "s" : ""}?`
            : ""
        }
        description={
          pendingBulk
            ? pendingBulk.decision === "approved"
              ? `This will approve ${pendingBulk.ids.length} selected ${pendingBulk.kind}${pendingBulk.ids.length > 1 ? "s" : ""} and grant access to the platform.`
              : `This will reject ${pendingBulk.ids.length} selected ${pendingBulk.kind}${pendingBulk.ids.length > 1 ? "s' applications" : "'s application"}.`
            : ""
        }
        confirmLabel={
          pendingBulk?.decision === "approved" ? "Approve all" : "Reject all"
        }
        tone={pendingBulk?.decision === "approved" ? "success" : "danger"}
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
