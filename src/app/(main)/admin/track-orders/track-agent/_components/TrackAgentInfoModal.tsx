"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { XModalIcon } from "@/app/(main)/transporter/_components/Icons/TransporterIcons";
import { OrderPartyInfo } from "@/utils/TrackAgentData";

interface TrackAgentInfoModalProps {
  /** The one buyer on the order. Absent on a row the list could not resolve. */
  buyer?: OrderPartyInfo | null;
  /** Sellers: several on a multi-producer order, so always a list. */
  sellers: OrderPartyInfo[];
  onClose: () => void;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="font-montserrat text-[11px] text-[#808080]">{label}</span>
    <span className="font-montserrat text-[13px] text-[#2b2b2b] break-words">
      {value && value.trim() ? value : "—"}
    </span>
  </div>
);

const PartyCard: React.FC<{ party: OrderPartyInfo }> = ({ party }) => {
  // Accounts carry placeholder avatar URLs that 404 (e.g. `.../test_avatar.png`).
  // Without this, next/image renders the browser's broken-image glyph; the
  // initial-letter avatar is the better answer for "no usable picture".
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(party.image) && !imageFailed;

  return (
  <div className="flex flex-col gap-3 rounded-[10px] border border-[#e0e0e0] p-4">
    <div className="flex items-center gap-3">
      {showImage ? (
        <Image
          src={party.image}
          alt={party.name}
          width={44}
          height={44}
          onError={() => setImageFailed(true)}
          className="w-11 h-11 rounded-full object-cover"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center font-montserrat font-bold text-[#2b2b2b]">
          {(party.businessName || party.name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <span className="font-montserrat text-[14px] font-medium text-[#2b2b2b]">
        {party.businessName?.trim() || party.name || "—"}
      </span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Name" value={party.name} />
      <Field label="Phone" value={party.phone} />
      <Field label="Email" value={party.email} />
      <Field label="State" value={party.state} />
      <Field label="Address" value={party.address} />
    </div>
  </div>
  );
};

/** Section heading, so the two halves of the dialog stay told apart. */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h3 className="font-montserrat text-[12px] font-medium uppercase tracking-wide text-[#538e53]">
    {children}
  </h3>
);

const EmptyNote: React.FC<{ what: string }> = ({ what }) => (
  <p className="font-montserrat text-[13px] text-[#808080] rounded-[10px] border border-dashed border-[#e0e0e0] px-4 py-5 text-center">
    No {what} information on this order.
  </p>
);

/**
 * Read-only party details for one order on the admin track-agent page (A9).
 *
 * Both sides are shown together: an admin looking at a disputed order wants the
 * buyer AND the seller, and picking one at a time from a kebab menu meant
 * closing the dialog and reopening it to see the other half. The row itself is
 * the trigger now, so there is no menu and nothing to choose.
 *
 * Renders the party details already carried on the loaded list row — no extra
 * fetch.
 */
export const TrackAgentInfoModal: React.FC<TrackAgentInfoModalProps> = ({
  buyer,
  sellers,
  onClose,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#2b2b2bbc] flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Buyer and seller information"
          className="relative bg-[#fefefe] rounded-lg w-full max-w-[520px] max-h-[92vh] overflow-y-auto my-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#fefefe] px-4 py-3 border-b border-[#e0e0e0] rounded-t-lg">
            <h2 className="font-montserrat font-medium text-[15px] sm:text-[16px] text-[#2b2b2b]">
              Buyer &amp; Seller Information
            </h2>
            <button
              onClick={onClose}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
              aria-label="Close"
            >
              <XModalIcon />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <SectionLabel>Buyer</SectionLabel>
              {buyer ? <PartyCard party={buyer} /> : <EmptyNote what="buyer" />}
            </section>

            <section className="flex flex-col gap-2">
              <SectionLabel>
                {sellers.length > 1 ? `Sellers (${sellers.length})` : "Seller"}
              </SectionLabel>
              {sellers.length === 0 ? (
                <EmptyNote what="seller" />
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Two lines of the same order can carry the same seller,
                      so the id alone is not unique — pair it with the index. */}
                  {sellers.map((party, i) => (
                    <PartyCard key={`${party.id || "seller"}-${i}`} party={party} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
