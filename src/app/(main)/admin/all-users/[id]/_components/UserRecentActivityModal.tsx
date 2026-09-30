"use client";

import React, { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AdminUserHistoryItem,
  AdminUserSummary,
  HISTORY_RESOURCE_LABELS,
  HISTORY_RESOURCES_BY_ROLE,
  HistoryResource,
  HistoryRole,
  RECENT_KEY_BY_RESOURCE,
} from "@/services/adminUserService";
import { UserHistoryTable } from "./UserHistoryTable";
import { getHistoryColumns } from "./historyColumns";
import { useModalA11y } from "@/hooks/useModalA11y";

interface UserRecentActivityModalProps {
  isOpen: boolean;
  user: AdminUserSummary | null;
  availableRoles: HistoryRole[];
  onClose: () => void;
  onItemClick: (
    role: HistoryRole,
    resource: HistoryResource,
    item: AdminUserHistoryItem,
  ) => void;
}

const ROLE_LABELS: Record<HistoryRole, string> = {
  buyer: "As a buyer",
  agent: "As an agent",
  transporter: "As a transporter",
};

interface ResourceGroup {
  resource: HistoryResource;
  label: string;
  items: AdminUserHistoryItem[];
}

interface RoleGroup {
  role: HistoryRole;
  label: string;
  resources: ResourceGroup[];
}

const buildGroups = (
  user: AdminUserSummary,
  availableRoles: HistoryRole[],
): RoleGroup[] => {
  const history = user.history;
  if (!history) return [];
  const groups: RoleGroup[] = [];
  for (const role of availableRoles) {
    const block = history[role];
    if (!block || typeof block !== "object") continue;
    const resources: ResourceGroup[] = [];
    for (const resource of HISTORY_RESOURCES_BY_ROLE[role]) {
      const raw = (block as Record<string, unknown>)[
        RECENT_KEY_BY_RESOURCE[resource]
      ];
      if (!Array.isArray(raw) || raw.length === 0) continue;
      resources.push({
        resource,
        label: HISTORY_RESOURCE_LABELS[resource],
        items: raw as AdminUserHistoryItem[],
      });
    }
    if (resources.length === 0) continue;
    groups.push({ role, label: ROLE_LABELS[role], resources });
  }
  return groups;
};

export const UserRecentActivityModal: React.FC<UserRecentActivityModalProps> = ({
  isOpen,
  user,
  availableRoles,
  onClose,
  onItemClick,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen && !!user, dialogRef, { onEscape: onClose });

  const groups = useMemo(
    () => (user ? buildGroups(user, availableRoles) : []),
    [user, availableRoles],
  );

  return (
    <AnimatePresence>
      {isOpen && user && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b]/40 z-40 flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-recent-activity-title"
            className="bg-white rounded-[12px] w-full max-w-[1080px] shadow-2xl max-h-[88vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-montserrat font-semibold">
                  Snapshot
                </p>
                <h2
                  id="user-recent-activity-title"
                  className="font-montserrat font-semibold text-base text-[#2b2b2b]"
                >
                  Recent activity
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>

            <div className="overflow-y-auto flex-1">
              {groups.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-montserrat text-gray-500">
                    No recent activity yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {groups.map((group) => (
                    <section key={group.role} className="px-6 py-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] font-montserrat font-semibold text-gray-400 mb-4">
                        {group.label}
                      </p>
                      <div className="space-y-6">
                        {group.resources.map((rg) => {
                          const columns = getHistoryColumns(
                            group.role,
                            rg.resource,
                          );
                          return (
                            <div key={rg.resource}>
                              <div className="flex items-baseline justify-between mb-2">
                                <h3 className="font-montserrat text-sm font-semibold text-[#2b2b2b]">
                                  {rg.label}
                                </h3>
                                <span className="text-[11px] font-montserrat text-gray-500">
                                  {rg.items.length} recent
                                </span>
                              </div>
                              <div className="border border-gray-100 rounded-lg overflow-hidden">
                                <UserHistoryTable
                                  columns={columns}
                                  data={rg.items}
                                  onRowClick={(item) =>
                                    onItemClick(group.role, rg.resource, item)
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
