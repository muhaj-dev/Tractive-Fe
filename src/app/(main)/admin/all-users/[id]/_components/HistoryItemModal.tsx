"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  AdminUserHistoryItem,
  HISTORY_RESOURCE_LABELS,
  HistoryResource,
  HistoryRole,
} from "@/services/adminUserService";
import { useModalA11y } from "@/hooks/useModalA11y";

interface HistoryItemModalProps {
  isOpen: boolean;
  role: HistoryRole | null;
  resource: HistoryResource | null;
  item: AdminUserHistoryItem | null;
  onClose: () => void;
}

// Keys hidden from the generic field grid (handled specially or noise).
const HIDDEN_KEYS = new Set([
  "_id",
  "__v",
  "id",
  "images",
  "videos",
  "owner",
  "farmer",
  "approvedBy",
  "buyer",
]);

// Keys hidden when rendering nested objects (buyer / product / order / etc.).
const NESTED_HIDDEN_KEYS = new Set(["_id", "id", "__v", "owner", "farmer"]);

// Fields whose value is an ID-like string and should be truncated.
const ID_LIKE_KEYS = new Set([
  "orderId",
  "transactionId",
  "paymentId",
  "tripId",
  "saleId",
  "reference",
]);

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const AMOUNT_HINT_KEYS = new Set([
  "price",
  "amount",
  "totalAmount",
  "fare",
  "fee",
  "discount",
  "unitPrice",
  "lineSubtotal",
]);

const labelFromKey = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/_/g, " ")
    .trim();

const formatDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const idShort = (value: string): string => {
  if (!value || value.length <= 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const looksLikeDate = (key: string, value: string) =>
  /(At|Date)$/i.test(key) && /\d{4}-\d{2}-\d{2}/.test(value);

const isImageUrl = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//.test(value);

const renderPrimitive = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (AMOUNT_HINT_KEYS.has(key)) return NGN.format(value);
    return value.toLocaleString();
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (ID_LIKE_KEYS.has(key)) return idShort(value);
    if (looksLikeDate(key, value)) return formatDate(value);
    return value;
  }
  return "";
};

const isPrimitive = (value: unknown) =>
  value === null ||
  value === undefined ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

interface FieldEntry {
  key: string;
  label: string;
  value: unknown;
}

const collectFields = (item: AdminUserHistoryItem): FieldEntry[] =>
  Object.entries(item)
    .filter(([key]) => !HIDDEN_KEYS.has(key))
    .map(([key, value]) => ({ key, label: labelFromKey(key), value }));

// ─── Image / Video primitives ──────────────────────────────────────────────

const LazyImage: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt ?? ""}
        fill
        loading="lazy"
        unoptimized
        className={`object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
};

const ImageGrid: React.FC<{ images: unknown[] }> = ({ images }) => {
  const urls = images.filter(isImageUrl);
  if (urls.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.slice(0, 6).map((src, i) => (
        <LazyImage key={i} src={src} />
      ))}
    </div>
  );
};

const VideoGrid: React.FC<{ videos: unknown[] }> = ({ videos }) => {
  const urls = videos.filter(
    (v) => typeof v === "string" && /^https?:\/\//.test(v),
  ) as string[];
  if (urls.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {urls.slice(0, 4).map((src, i) => (
        <div
          key={i}
          className="rounded-md overflow-hidden bg-black/5 border border-gray-100"
        >
          <video
            src={src}
            controls
            preload="metadata"
            playsInline
            className="w-full h-auto max-h-[260px] bg-black"
          />
        </div>
      ))}
    </div>
  );
};

const StringChips: React.FC<{ values: unknown[] }> = ({ values }) => (
  <div className="flex flex-wrap gap-1.5">
    {values.map((v, i) => (
      <span
        key={i}
        className="text-[11px] font-montserrat bg-gray-100 text-[#2b2b2b] rounded-full px-2 py-0.5"
      >
        {String(v)}
      </span>
    ))}
  </div>
);

// ─── Nested object renderer ────────────────────────────────────────────────

const NestedObject: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const entries = Object.entries(data).filter(
    ([k]) => !NESTED_HIDDEN_KEYS.has(k),
  );

  // Pull images / videos out for special rendering.
  const images = Array.isArray(data.images) ? (data.images as unknown[]) : [];
  const videos = Array.isArray(data.videos) ? (data.videos as unknown[]) : [];
  const fieldEntries = entries.filter(
    ([k]) => k !== "images" && k !== "videos",
  );

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50/60 overflow-hidden">
      {fieldEntries.length > 0 && (
        <div className="divide-y divide-gray-100">
          {fieldEntries.map(([k, v]) => (
            <div
              key={k}
              className="px-3 py-2 flex items-start justify-between gap-3"
            >
              <span className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
                {labelFromKey(k)}
              </span>
              <span className="text-xs font-montserrat text-[#2b2b2b] text-right break-words max-w-[60%]">
                {isPrimitive(v)
                  ? renderPrimitive(k, v)
                  : Array.isArray(v) && v.every(isPrimitive)
                  ? v.join(", ")
                  : JSON.stringify(v)}
              </span>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div className="px-3 py-3 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
            Images
          </p>
          <ImageGrid images={images} />
        </div>
      )}
      {videos.length > 0 && (
        <div className="px-3 py-3 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
            Videos
          </p>
          <VideoGrid videos={videos} />
        </div>
      )}
    </div>
  );
};

// ─── Modal ─────────────────────────────────────────────────────────────────

export const HistoryItemModal: React.FC<HistoryItemModalProps> = ({
  isOpen,
  role,
  resource,
  item,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen && !!item, dialogRef, { onEscape: onClose });

  const title =
    role && resource
      ? `${HISTORY_RESOURCE_LABELS[resource]} details`
      : "Details";

  const images = item && Array.isArray(item.images) ? (item.images as unknown[]) : [];
  const videos = item && Array.isArray(item.videos) ? (item.videos as unknown[]) : [];
  const fields = item ? collectFields(item) : [];

  // Embedded buyer (rendered specially as its own section)
  const buyerObject =
    item && item.buyer && typeof item.buyer === "object" && !Array.isArray(item.buyer)
      ? (item.buyer as Record<string, unknown>)
      : null;

  const primaryName =
    item && typeof item.name === "string"
      ? (item.name as string)
      : item && typeof item.title === "string"
      ? (item.title as string)
      : null;

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="bg-white rounded-[12px] w-full max-w-[680px] shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
                  {role && `${role.charAt(0).toUpperCase()}${role.slice(1)} · `}
                  {title}
                </p>
                {primaryName ? (
                  <h3 className="font-montserrat font-semibold text-base text-[#2b2b2b] truncate">
                    {primaryName}
                  </h3>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
                aria-label="Close"
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
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-grow px-5 py-5 space-y-5">
              {images.length > 0 ? <ImageGrid images={images} /> : null}
              {videos.length > 0 ? <VideoGrid videos={videos} /> : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(({ key, label, value }) => {
                  if (isPrimitive(value)) {
                    return (
                      <Field
                        key={key}
                        label={label}
                        value={renderPrimitive(key, value)}
                      />
                    );
                  }
                  if (Array.isArray(value) && value.every(isPrimitive)) {
                    return (
                      <div
                        key={key}
                        className="bg-gray-50 rounded-lg px-3 py-2.5 sm:col-span-2"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-1.5">
                          {label}
                        </p>
                        {value.length > 0 ? (
                          <StringChips values={value} />
                        ) : (
                          <p className="text-sm font-montserrat text-[#2b2b2b]">—</p>
                        )}
                      </div>
                    );
                  }
                  if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                  ) {
                    return (
                      <div key={key} className="sm:col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-1.5">
                          {label}
                        </p>
                        <NestedObject data={value as Record<string, unknown>} />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {buyerObject ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-1.5">
                    Buyer
                  </p>
                  <NestedObject data={buyerObject} />
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2.5">
    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-1">
      {label}
    </p>
    <p className="text-sm text-[#2b2b2b] break-words font-montserrat">
      {value || "—"}
    </p>
  </div>
);
