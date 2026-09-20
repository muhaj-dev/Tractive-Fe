"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { OrderRecord, OrderProductLine } from "@/services/OrderService";
import { useCustomerById } from "@/hooks/queries/useCustomerQueries";

interface OrderDetailsModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(typeof value === "number" ? value : 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** "bank_transfer" -> "Bank transfer". */
const humanize = (value?: string | null) => {
  if (!value) return "—";
  const spaced = value.replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// Status pill colour by order/transport state.
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#FFF4E5] text-[#B26A00]",
  paid: "bg-[#E8F5E9] text-[#2E7D32]",
  parked: "bg-[#E8F5E9] text-[#2E7D32]",
  picked: "bg-[#E3F2FD] text-[#1565C0]",
  on_transit: "bg-[#E3F2FD] text-[#1565C0]",
  delivered: "bg-[#E8F5E9] text-[#2E7D32]",
};

const StatusPill: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => {
  const key = (value ?? "").toLowerCase();
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-montserrat font-medium text-[#808080] uppercase">
        {label}
      </span>
      <span
        className={`inline-flex w-fit items-center rounded-[4px] px-2 py-[3px] text-[11px] font-montserrat font-medium ${
          STATUS_STYLES[key] ?? "bg-[#f1f1f1] text-[#2b2b2b]"
        }`}
      >
        {humanize(value)}
      </span>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-montserrat font-medium text-[#808080] uppercase">
      {label}
    </span>
    <span className="text-[13px] font-montserrat text-[#2b2b2b] break-words">
      {children}
    </span>
  </div>
);

/**
 * Full order-details modal for the agent order tables (New / Packed / Delivered).
 * Reads straight off the raw `OrderRecord` already cached by the list query, so
 * it shows every line item, payment, transport and timeline field the backend
 * returns — degrading missing/unpopulated values to "—" rather than throwing.
 */
export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Orders carry `buyer` as a bare id, so the buyer's name/phone/email are
  // looked up from the agent's customer list. Only fetched while the modal is
  // open, and cached, so opening row after row costs one request.
  const rawBuyer = order?.buyer;
  const lookupId =
    typeof rawBuyer === "string" ? rawBuyer : (rawBuyer?._id ?? undefined);
  const customer = useCustomerById(lookupId, { enabled: isOpen });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen || !order) return null;

  const buyer = order.buyer;
  // Prefer whatever the order populated; fall back to the customer lookup,
  // which is where the details actually live for an agent.
  const buyerName =
    (typeof buyer === "string" ? null : buyer?.name) ?? customer?.name ?? "—";
  const buyerPhone = customer?.mobile ?? "—";
  const buyerEmail = customer?.email ?? "—";
  const buyerState = customer?.state ?? "—";

  const lines: OrderProductLine[] = Array.isArray(order.products)
    ? order.products
    : [];

  const transporter =
    order.transporter && typeof order.transporter === "object"
      ? order.transporter
      : null;
  const fleet = order.fleet ?? null;
  const hasTransport = Boolean(transporter || fleet || order.trackingCode);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-[200] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          ref={modalRef}
          className="bg-[#fefefe] rounded-[10px] shadow-lg w-full max-w-[560px] p-6 max-h-[90vh] overflow-y-auto hide-scrollbar"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-montserrat font-semibold text-[#2b2b2b]">
                Order Details
              </h2>
              {/* The raw order id was shown here. It means nothing to a seller,
                  so the buyer's name leads instead. */}
              <span className="text-[11px] font-montserrat text-[#808080]">
                {buyerName !== "—" ? buyerName : "Order"} ·{" "}
                {formatDate(order.createdAt)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[#808080] hover:text-[#2b2b2b] text-[20px] font-montserrat transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Status + summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <StatusPill label="Status" value={order.status} />
            <StatusPill label="Transport" value={order.transportStatus} />
            <Field label="Total">
              <span className="font-semibold text-[#538e53]">
                {formatCurrency(order.totalAmount)}
              </span>
            </Field>
            <Field label="Payment">{humanize(order.paymentMethod)}</Field>
          </div>

          <div className="w-full h-[1px] bg-[#e2e2e2] mb-5" />

          {/* Buyer + dates */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Field label="Buyer">{buyerName}</Field>
            <Field label="Phone">{buyerPhone}</Field>
            <Field label="Email">
              <span className="break-words">{buyerEmail}</span>
            </Field>
            <Field label="State">{buyerState}</Field>
            <Field label="Order date">{formatDate(order.createdAt)}</Field>
            <Field label="Last updated">{formatDate(order.updatedAt)}</Field>
            {order.address ? (
              <Field label="Delivery address">{order.address}</Field>
            ) : null}
            <Field label="Receipt confirmed">
              {order.receiptConfirmed || order.receiptConfirmedAt
                ? `Yes · ${formatDate(order.receiptConfirmedAt)}`
                : "No"}
            </Field>
          </div>

          <div className="w-full h-[1px] bg-[#e2e2e2] mb-5" />

          {/* Products */}
          <h3 className="text-[13px] font-montserrat font-semibold text-[#2b2b2b] mb-3">
            Items ({lines.length})
          </h3>
          <div className="flex flex-col gap-3 mb-5">
            {lines.map((line, i) => {
              const product =
                line.product && typeof line.product === "object"
                  ? line.product
                  : undefined;
              const image = product?.images?.[0] ?? "/images/noData.png";
              return (
                <div
                  key={line._id ?? `line-${i}`}
                  className="flex gap-3 bg-[#f9f9f9] rounded-[6px] p-3"
                >
                  <Image
                    src={image}
                    alt={product?.name ?? "Product"}
                    width={56}
                    height={56}
                    className="w-[56px] h-[56px] rounded-[4px] object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col gap-0.5 w-full min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-montserrat font-medium text-[#2b2b2b] truncate">
                        {product?.name ?? "—"}
                      </span>
                      <span className="text-[12px] font-montserrat font-semibold text-[#2b2b2b] whitespace-nowrap">
                        {formatCurrency(line.lineSubtotal)}
                      </span>
                    </div>
                    {product?.description ? (
                      <span className="text-[11px] font-montserrat text-[#808080] truncate">
                        {product.description}
                      </span>
                    ) : null}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] font-montserrat text-[#2b2b2b]">
                      <span>
                        Qty:{" "}
                        <span className="font-medium">
                          {line.quantity ?? "—"}
                          {line.product &&
                          typeof line.product === "object" &&
                          line.product.unit
                            ? ` ${line.product.unit}`
                            : ""}
                        </span>
                      </span>
                      <span>
                        Unit price:{" "}
                        <span className="font-medium">
                          {formatCurrency(line.unitPrice)}
                        </span>
                      </span>
                    </div>
                    {line.localTransportRequired ? (
                      <div className="mt-1.5 text-[10px] font-montserrat text-[#808080] border-t border-[#e2e2e2] pt-1.5">
                        Local transport: {line.localTransportFrom ?? "—"} →{" "}
                        {line.localTransportTo ?? "—"} ·{" "}
                        {formatCurrency(line.localTransportFee)}
                        {line.localTransportNote
                          ? ` · ${line.localTransportNote}`
                          : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transport / fleet (only once assigned) */}
          {hasTransport ? (
            <>
              <div className="w-full h-[1px] bg-[#e2e2e2] mb-5" />
              <h3 className="text-[13px] font-montserrat font-semibold text-[#2b2b2b] mb-3">
                Transport
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {transporter ? (
                  <>
                    <Field label="Transporter">
                      {transporter.name ?? "—"}
                    </Field>
                    <Field label="Location">
                      {transporter.location ?? "—"}
                    </Field>
                    <Field label="Phone">{transporter.phone ?? "—"}</Field>
                    <Field label="Rating">
                      {transporter.ratingLabel ??
                        (typeof transporter.rating === "number"
                          ? String(transporter.rating)
                          : "—")}
                    </Field>
                  </>
                ) : null}
                {fleet ? (
                  <>
                    <Field label="Fleet">{fleet.fleetName ?? "—"}</Field>
                    <Field label="Model">{fleet.model ?? "—"}</Field>
                    <Field label="Plate number">
                      {fleet.plateNumber ?? "—"}
                    </Field>
                    <Field label="IOT ID">{fleet.iotId ?? "—"}</Field>
                  </>
                ) : null}
                {order.trackingCode ? (
                  <Field label="Tracking code">{order.trackingCode}</Field>
                ) : null}
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Picked">{formatDate(order.pickedAt)}</Field>
                <Field label="On transit">
                  {formatDate(order.onTransitAt)}
                </Field>
                <Field label="Delivered">{formatDate(order.deliveredAt)}</Field>
              </div>
            </>
          ) : null}

          <button
            onClick={onClose}
            className="mt-6 w-full bg-[#538e53] text-[#fefefe] text-[13px] font-montserrat py-2.5 rounded-[6px] hover:bg-[#467746] transition-colors cursor-pointer"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderDetailsModal;
