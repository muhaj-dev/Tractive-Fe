"use client";

import React from "react";
import { motion } from "framer-motion";
import { AdminUserHistoryItem } from "@/services/adminUserService";
import { HistoryColumn, getHistoryRowId } from "./historyColumns";

interface UserHistoryTableProps {
  columns: HistoryColumn[];
  data: AdminUserHistoryItem[];
  onRowClick?: (item: AdminUserHistoryItem) => void;
}

const STATUS_BADGE_KEYS = new Set([
  "status",
  "orderStatus",
  "transportStatus",
]);

const statusBadgeClass = (raw: string) => {
  const s = raw.toLowerCase();
  if (
    s.includes("approved") ||
    s.includes("paid") ||
    s.includes("delivered") ||
    s === "active" ||
    s === "completed"
  )
    return "bg-green-50 text-green-600 border-green-100";
  if (
    s.includes("pending") ||
    s === "parked" ||
    s === "picked" ||
    s === "on_transit" ||
    s === "suspended"
  )
    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  if (
    s.includes("rejected") ||
    s.includes("failed") ||
    s === "removed" ||
    s === "refunded"
  )
    return "bg-red-50 text-red-600 border-red-100";
  return "bg-gray-50 text-gray-600 border-gray-200";
};

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export const UserHistoryTable: React.FC<UserHistoryTableProps> = ({
  columns,
  data,
  onRowClick,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 font-montserrat text-[11px] sm:text-[12px] font-normal text-[#2b2b2b] ${
                  col.minWidth || "min-w-[100px]"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={getHistoryRowId(item, index)}
              className={`border-b border-gray-100 hover:bg-[#EFF7EF] transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                    // Only when the row itself has focus, so Enter on a control inside the
                    // row does not also open it.
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }
                  : undefined
              }
            >
              {columns.map((col) => {
                const raw = col.render ? col.render(item) : "—";
                const isStatus = STATUS_BADGE_KEYS.has(col.key) && raw !== "—";
                return (
                  <td
                    key={col.key}
                    className="py-3 px-4 text-[11px] sm:text-[12px] font-montserrat text-[#2b2b2b]"
                  >
                    {isStatus ? (
                      <span
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass(
                          raw,
                        )}`}
                      >
                        {raw.charAt(0).toUpperCase() + raw.slice(1)}
                      </span>
                    ) : (
                      raw
                    )}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
