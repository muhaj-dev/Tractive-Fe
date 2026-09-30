"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminBanner } from "@/services/bannerService";
import { useModalA11y } from "@/hooks/useModalA11y";

interface BannerDetailsModalProps {
  banner: AdminBanner | null;
  onClose: () => void;
  onEdit: (banner: AdminBanner) => void;
}

/**
 * Long destination URLs blow out the layout, so show a readable short form
 * (host + a clipped path) and keep the full URL in the title attribute.
 */
const shortenUrl = (url: string, max = 42) => {
  const stripped = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return stripped.length > max ? `${stripped.slice(0, max - 1)}…` : stripped;
};

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3 py-2 border-b border-gray-100 last:border-b-0">
    <span className="w-[92px] shrink-0 text-[12px] font-montserrat text-[#808080]">
      {label}
    </span>
    <div className="min-w-0 flex-1 text-[13px] font-montserrat text-[#2b2b2b] break-words">
      {children}
    </div>
  </div>
);

/** Banner image, wrapped in its destination link when it has one. */
const BannerPreview = ({ banner }: { banner: AdminBanner }) => {
  const frame =
    "relative block w-full h-[180px] rounded-[8px] overflow-hidden bg-[#f1f1f1]";

  const image = banner.imageUrl ? (
    <Image
      src={banner.imageUrl}
      alt={banner.alt || banner.title}
      fill
      sizes="520px"
      className="object-contain"
    />
  ) : (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 border border-dashed border-gray-300 rounded-[8px]">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b8b8b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-[11px] font-montserrat text-[#a0a0a0]">
        No image
      </span>
    </span>
  );

  if (!banner.link) return <div className={frame}>{image}</div>;

  return (
    <a
      href={banner.link}
      target="_blank"
      rel="noopener noreferrer"
      title={banner.link}
      className={`${frame} cursor-pointer group`}
    >
      {image}
      <span className="absolute inset-0 bg-[#2b2b2b]/0 group-hover:bg-[#2b2b2b]/20 transition-colors" />
    </a>
  );
};

export const BannerDetailsModal: React.FC<BannerDetailsModalProps> = ({
  banner,
  onClose,
  onEdit,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(!!banner, dialogRef, { onEscape: onClose });

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-[200] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            className="bg-[#fefefe] rounded-[10px] shadow-xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-6"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="banner-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <h2
                  id="banner-details-title"
                  className="text-[16px] font-montserrat font-semibold text-[#2b2b2b] truncate"
                >
                  {banner.title || "Untitled banner"}
                </h2>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-montserrat font-medium ${
                    banner.isActive
                      ? "bg-[#538e53]/10 text-[#538e53]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {banner.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer text-[#808080] hover:text-[#2b2b2b] text-[16px]"
              >
                ✕
              </button>
            </div>

            {/* The preview doubles as the destination link — clicking it opens
                wherever the banner points a buyer. */}
            <BannerPreview banner={banner} />
            {banner.link && (
              <p className="text-[11px] font-montserrat text-[#808080] mt-1.5 mb-3">
                Opens {shortenUrl(banner.link, 52)}
              </p>
            )}

            <div className="flex flex-col">
              <Row label="Position">{banner.position ?? "—"}</Row>
              <Row label="Alt text">{banner.alt || "—"}</Row>
              <Row label="Link">
                {banner.link ? (
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={banner.link}
                    className="text-[#538e53] hover:underline"
                  >
                    {shortenUrl(banner.link)}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Starts">{formatDate(banner.startDate)}</Row>
              <Row label="Ends">{formatDate(banner.endDate)}</Row>
              <Row label="Created">{formatDate(banner.createdAt)}</Row>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2 text-[13px] font-montserrat font-medium text-[#2b2b2b] border border-gray-300 rounded-[6px] hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onEdit(banner)}
                className="cursor-pointer px-4 py-2 text-[13px] font-montserrat font-medium text-[#fefefe] bg-[#538e53] rounded-[6px] hover:bg-[#467746] transition-colors"
              >
                Edit banner
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
