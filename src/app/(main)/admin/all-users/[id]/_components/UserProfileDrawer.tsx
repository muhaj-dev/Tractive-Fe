"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminUserSummary } from "@/services/adminUserService";
import { useModalA11y } from "@/hooks/useModalA11y";

interface UserProfileDrawerProps {
  isOpen: boolean;
  user: AdminUserSummary | null;
  onClose: () => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  isOpen,
  user,
  onClose,
}) => {
  const drawerRef = useRef<HTMLElement>(null);
  useModalA11y(isOpen && !!user, drawerRef, { onEscape: onClose });

  if (!user) return null;

  const professions = Array.isArray(user.profession)
    ? (user.profession as string[])
    : user.profession
    ? [user.profession as string]
    : [];
  const interests = Array.isArray(user.interests)
    ? (user.interests as unknown[]).map((i) => String(i))
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-[#2b2b2b]/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-profile-drawer-title"
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-montserrat">
                  Full profile
                </p>
                <h2
                  id="user-profile-drawer-title"
                  className="font-montserrat font-semibold text-base text-[#2b2b2b] truncate">
                  {(user.name as string) || "—"}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <Section title="Account">
                <Row label="Phone" value={(user.phone as string) || "—"} />
                <Row label="Active Role" value={(user.activeRole as string) || "—"} />
                <Row
                  label="Professions"
                  value={professions.length ? professions.join(", ") : "—"}
                />
                <Row
                  label="Business Name"
                  value={(user.businessName as string) || "—"}
                />
                <Row label="Created" value={formatDate(user.createdAt as string)} />
                <Row label="Updated" value={formatDate(user.updatedAt as string)} />
              </Section>

              <Section title="Approval">
                <Row
                  label="Agent Status"
                  value={(user.agentApprovalStatus as string) || "—"}
                />
                <Row
                  label="Transporter Status"
                  value={(user.transporterApprovalStatus as string) || "—"}
                />
                <Row
                  label="Approval Notes"
                  value={(user.approvalNotes as string) || "—"}
                />
              </Section>

              <Section title="Address">
                <Row label="Address" value={(user.address as string) || "—"} />
                <Row label="State" value={(user.state as string) || "—"} />
                <Row label="Country" value={(user.country as string) || "—"} />
                <Row label="LGA" value={(user.lga as string) || "—"} />
                <Row
                  label="Village / Local Market"
                  value={(user.villageOrLocalMarket as string) || "—"}
                />
              </Section>

              <Section title="Identity & Banking">
                <Row label="NIN" value={(user.nin as string) || "—"} mono />
                <Row label="Business CAC" value={(user.businessCAC as string) || "—"} mono />
                <Row label="Bank Name" value={(user.bankName as string) || "—"} />
                <Row
                  label="Bank Account Name"
                  value={(user.bankAccountName as string) || "—"}
                />
                <Row
                  label="Bank Account Number"
                  value={(user.bankAccountNumber as string) || "—"}
                  mono
                />
              </Section>

              {(user.bio as string) ? (
                <Section title="Bio">
                  <p className="text-sm font-montserrat text-[#2b2b2b] leading-relaxed">
                    {user.bio as string}
                  </p>
                </Section>
              ) : null}

              {interests.length > 0 ? (
                <InterestsBlock interests={interests} />
              ) : null}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section>
    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-montserrat font-semibold mb-3">
      {title}
    </p>
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
      {children}
    </div>
  </section>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div className="flex items-start justify-between gap-4 px-3.5 py-2.5 bg-white">
    <span className="text-[11px] uppercase tracking-wide text-gray-400 font-montserrat">
      {label}
    </span>
    <span
      className={`text-sm text-[#2b2b2b] text-right break-words max-w-[60%] ${
        mono ? "font-mono text-xs" : "font-montserrat"
      }`}
    >
      {value || "—"}
    </span>
  </div>
);

const InterestsBlock: React.FC<{ interests: string[] }> = ({ interests }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-montserrat font-semibold">
        Interests
      </p>
      <span className="text-[10px] font-montserrat text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
        {interests.length}
      </span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {interests.map((interest, i) => (
        <span
          key={i}
          className="text-xs font-montserrat bg-[#538e53]/10 text-[#538e53] rounded-full px-3 py-1"
        >
          {interest}
        </span>
      ))}
    </div>
  </section>
);
