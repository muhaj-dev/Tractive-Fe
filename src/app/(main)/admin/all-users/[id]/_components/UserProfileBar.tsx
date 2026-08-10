"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { toast } from "sonner";
import {
  adminUserService,
  AdminUserStatus,
  AdminUserSummary,
} from "@/services/adminUserService";

interface UserProfileBarProps {
  user: AdminUserSummary;
  onUpdated: () => void;
  onOpenProfile: () => void;
}

type PendingAction = "suspend" | "reactivate" | "remove" | null;

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusBadge = (status?: string) => {
  const s = (status || "").toLowerCase();
  const styles =
    s === "active"
      ? "bg-green-50 text-green-600 border-green-100"
      : s === "suspended"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : s === "removed"
      ? "bg-red-50 text-red-600 border-red-100"
      : "bg-gray-50 text-gray-600 border-gray-200";
  return { styles, label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "—" };
};

const approvalBadge = (label: string, value?: string) => {
  if (!value) return null;
  const s = value.toLowerCase();
  const styles =
    s === "approved"
      ? "bg-green-50 text-green-600 border-green-100"
      : s === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : s === "rejected"
      ? "bg-red-50 text-red-600 border-red-100"
      : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      key={label}
      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles}`}
    >
      {label}: {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

export const UserProfileBar: React.FC<UserProfileBarProps> = ({
  user,
  onUpdated,
  onOpenProfile,
}) => {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const isBusy = pendingAction !== null;

  const userId = user._id;
  const badge = statusBadge(user.status as string | undefined);
  const currentStatus = ((user.status as string) || "").toLowerCase();
  const created = formatDate(user.createdAt as string);

  const patchStatus = async (
    action: "suspend" | "remove",
    nextStatus: AdminUserStatus,
  ) => {
    setPendingAction(action);
    try {
      // `profession` is not required by the backend — sending `{ status }`
      // alone returns 200. Deriving it used to abort the action outright.
      await adminUserService.updateUserStatus(userId, nextStatus);
      toast.success(action === "suspend" ? "User suspended" : "User removed");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setPendingAction(null);
    }
  };

  const reactivate = async () => {
    setPendingAction("reactivate");
    try {
      await adminUserService.reactivateUser(userId);
      toast.success("User reactivated");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reactivate user");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="bg-[#fefefe] rounded-[10px] shadow-md">
      <div className="px-6 pt-5">
        <Link
          href="/admin/all-users"
          className="inline-flex items-center gap-1.5 text-xs font-montserrat text-gray-500 hover:text-[#538e53] transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to users
        </Link>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-white shadow-sm">
            {/* Avatar covers both a missing URL and one that 404s; the plain
                `src || placeholder` form only covered the first. */}
            <Avatar
              src={(user.image as string) || (user.avatar as string)}
              alt={(user.name as string) || "User"}
              size={56}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-montserrat font-semibold text-lg text-[#2b2b2b] truncate">
                {(user.name as string) || "Unknown"}
              </h1>
              <span
                className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.styles}`}
              >
                {badge.label}
              </span>
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs font-montserrat text-gray-500">
              {(user.email as string) ? <span className="truncate">{user.email as string}</span> : null}
              {(user.phone as string) ? (
                <>
                  <Dot />
                  <span>{user.phone as string}</span>
                </>
              ) : null}
              {created ? (
                <>
                  <Dot />
                  <span>Joined {created}</span>
                </>
              ) : null}
            </div>

            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {approvalBadge("Agent", user.agentApprovalStatus as string | undefined)}
              {approvalBadge(
                "Transporter",
                user.transporterApprovalStatus as string | undefined,
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 sm:justify-end">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-montserrat font-medium text-[#2b2b2b] border border-gray-200 bg-white hover:border-[#538e53] hover:text-[#538e53] transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m-6-8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
              />
            </svg>
            View full profile
          </button>

          {currentStatus === "active" && (
            <>
              <ActionButton
                label="Suspend"
                tone="warning"
                loading={pendingAction === "suspend"}
                disabled={isBusy}
                onClick={() => patchStatus("suspend", "suspended")}
              />
              <ActionButton
                label="Remove"
                tone="danger"
                loading={pendingAction === "remove"}
                disabled={isBusy}
                onClick={() => patchStatus("remove", "removed")}
              />
            </>
          )}
          {currentStatus === "suspended" && (
            <>
              <ActionButton
                label="Reactivate"
                tone="success"
                loading={pendingAction === "reactivate"}
                disabled={isBusy}
                onClick={reactivate}
              />
              <ActionButton
                label="Remove"
                tone="danger"
                loading={pendingAction === "remove"}
                disabled={isBusy}
                onClick={() => patchStatus("remove", "removed")}
              />
            </>
          )}
          {currentStatus === "removed" && (
            <ActionButton
              label="Reactivate"
              tone="success"
              loading={pendingAction === "reactivate"}
              disabled={isBusy}
              onClick={reactivate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const Dot = () => (
  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gray-300" />
);

const ActionButton: React.FC<{
  label: string;
  tone: "success" | "warning" | "danger";
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, tone, loading, disabled, onClick }) => {
  const colors =
    tone === "success"
      ? "bg-[#538e53] hover:bg-[#467a46]"
      : tone === "warning"
      ? "bg-[#d97706] hover:bg-[#b45309]"
      : "bg-[#D32F2F] hover:bg-[#b71c1c]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-montserrat font-medium text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${colors}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Working
        </>
      ) : (
        label
      )}
    </button>
  );
};
