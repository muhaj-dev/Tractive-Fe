"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useModalA11y } from "@/hooks/useModalA11y";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { transactionService } from "@/services/transactionService";
import { ConfirmActionModal } from "../../_components/ConfirmActionModal";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount?: number) => {
  if (amount == null) return "—";
  return `₦${amount.toLocaleString()}`;
};

const statusBadge = (status?: string) => {
  const s = (status || "").toLowerCase();
  const styles =
    s === "approved"
      ? "bg-green-50 text-green-600 border-green-100"
      : s === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : s === "rejected" || s === "failed"
      ? "bg-red-50 text-red-600 border-red-100"
      : s === "refunded"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : "bg-gray-50 text-gray-600 border-gray-200";
  return { styles, label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "—" };
};

const formatMethod = (m?: string) => {
  if (!m) return "—";
  return m
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transactionId,
  onClose,
  onUpdated,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tx, setTx] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pending, setPending] = useState<
    "approve" | "reject" | "refund" | null
  >(null);
  const [showRefundForm, setShowRefundForm] = useState<boolean>(false);
  const [refundReason, setRefundReason] = useState<string>("");
  const [confirmStatus, setConfirmStatus] = useState<
    "approved" | "rejected" | null
  >(null);

  const panelRef = useRef<HTMLDivElement>(null);
  // 15g: this dialog had no role, no focus management and did not close on
  // Escape — the overlay stayed up and swallowed the next click, so the tester
  // had to reload between rows.
  useModalA11y(isOpen, panelRef, { onEscape: onClose });

  useEffect(() => {
    if (!isOpen || !transactionId) return;
    let cancelled = false;
    setIsLoading(true);
    setTx(null);
    setShowRefundForm(false);
    setRefundReason("");
    setPending(null);
    transactionService
      .getTransactionById(transactionId)
      .then((data) => {
        if (cancelled) return;
        console.log("🔎 /api/transactions/{id} response:", data);
        setTx(data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(
          err instanceof Error ? err.message : "Failed to load transaction",
        );
        onClose();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, transactionId, onClose]);

  const badge = statusBadge(tx?.status);
  const payer = tx?.payer ?? {};
  const payee = tx?.payee ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payees: any[] = Array.isArray(tx?.payees) ? tx.payees : [];
  const order = tx?.order ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderProducts: any[] =
    order && typeof order === "object" && Array.isArray(order.products)
      ? order.products
      : [];
  const currentStatus = (tx?.status as string | undefined)?.toLowerCase();
  const isBusy = pending !== null;

  const updateStatus = async (status: "approved" | "rejected") => {
    if (!transactionId) return;
    setPending(status === "approved" ? "approve" : "reject");
    try {
      await transactionService.adminUpdateTransactionStatus(
        transactionId,
        status,
      );
      toast.success(
        status === "approved" ? "Transaction approved" : "Transaction rejected",
      );
      setTx((prev: unknown) =>
        prev && typeof prev === "object"
          ? { ...(prev as object), status }
          : prev,
      );
      onUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update transaction",
      );
    } finally {
      setPending(null);
    }
  };

  const submitRefund = async () => {
    if (!transactionId) return;
    const reason = refundReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for the refund");
      return;
    }
    setPending("refund");
    try {
      await transactionService.refundTransaction({
        transactionId,
        reason,
      });
      toast.success("Refund issued");
      setTx((prev: unknown) =>
        prev && typeof prev === "object"
          ? { ...(prev as object), status: "refunded" }
          : prev,
      );
      setShowRefundForm(false);
      setRefundReason("");
      onUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to issue refund",
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[12px] w-full max-w-[760px] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3
                id="transaction-detail-title"
                className="font-montserrat font-semibold text-base text-[#2b2b2b]"
              >
                Transaction Details
              </h3>
              <button
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
            <div className="overflow-y-auto flex-grow px-5 py-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-7 w-7 border-4 border-[#538e53] border-t-transparent rounded-full" />
                </div>
              ) : tx ? (
                <div className="space-y-5">
                  {/* Products — hero at the top */}
                  {orderProducts.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-3">
                        {orderProducts.length > 1
                          ? `Products (${orderProducts.length})`
                          : "Product"}
                      </p>
                      <div className="space-y-4">
                        {orderProducts.map((item, idx) => (
                          <ProductCard
                            key={item?.product?._id ?? item?._id ?? idx}
                            item={item}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amount + Status header */}
                  <div className="bg-gradient-to-r from-[#538e53]/10 to-[#538e53]/5 border border-[#538e53]/20 rounded-lg px-4 py-4">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 font-montserrat mb-1">
                      Amount
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="font-montserrat font-semibold text-xl text-[#2b2b2b]">
                        {formatCurrency(tx.amount)}
                      </p>
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${badge.styles}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailRow
                      label="Payment Method"
                      value={formatMethod(tx.method)}
                    />
                    <DetailRow
                      label="Approved By"
                      value={
                        typeof tx.approvedBy === "object" && tx.approvedBy
                          ? tx.approvedBy?.name
                          : (tx.approvedBy as string) || "—"
                      }
                    />
                    <DetailRow
                      label="Created"
                      value={formatDate(tx.createdAt)}
                    />
                    <DetailRow
                      label="Updated"
                      value={formatDate(tx.updatedAt)}
                    />
                  </div>

                  {/* Payer */}
                  {payer && (payer.name || payer.email) ? (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Payer (Buyer)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailRow label="Name" value={payer.name} />
                        <DetailRow label="Email" value={payer.email} />
                      </div>
                    </div>
                  ) : null}

                  {/* Payee(s) */}
                  {(payees.length > 0 || payee?.name || payee?.email) && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        {payees.length > 1 ? "Payees (Sellers)" : "Payee (Seller)"}
                      </p>
                      {payees.length > 1 ? (
                        <div className="space-y-2">
                          {payees.map((p, i) => (
                            <div
                              key={p?.id ?? i}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            >
                              <DetailRow label="Name" value={p?.name} />
                              <DetailRow label="Email" value={p?.email} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <DetailRow
                            label="Name"
                            value={payee?.name || payees[0]?.name}
                          />
                          <DetailRow
                            label="Email"
                            value={payee?.email || payees[0]?.email}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order. Raw ids (order / transaction / product) are
                      deliberately not shown — they are internal identifiers
                      with no meaning to an admin reading this panel. */}
                  {order && typeof order === "object" ? (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Order
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailRow
                          label="Order Status"
                          value={order.status}
                        />
                        <DetailRow
                          label="Transport Status"
                          value={order.transportStatus}
                        />
                        <DetailRow
                          label="Total Amount"
                          value={formatCurrency(order.totalAmount)}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Footer actions */}
            {!isLoading && tx && (
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                {showRefundForm ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-montserrat text-gray-600">
                      Refund reason
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      disabled={isBusy}
                      rows={3}
                      placeholder="e.g. Duplicate charge"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-montserrat resize-none focus:outline-none focus:border-[#538e53] disabled:opacity-50"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowRefundForm(false);
                          setRefundReason("");
                        }}
                        disabled={isBusy}
                        className="px-4 py-2 rounded-lg text-sm font-montserrat font-medium text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <FooterButton
                        label="Confirm Refund"
                        tone="info"
                        loading={pending === "refund"}
                        disabled={isBusy}
                        onClick={submitRefund}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {currentStatus === "pending" && (
                      <>
                        <FooterButton
                          label="Reject"
                          tone="danger"
                          disabled={isBusy}
                          onClick={() => setConfirmStatus("rejected")}
                        />
                        <FooterButton
                          label="Approve"
                          tone="success"
                          disabled={isBusy}
                          onClick={() => setConfirmStatus("approved")}
                        />
                      </>
                    )}
                    {currentStatus === "approved" && (
                      <FooterButton
                        label="Refund"
                        tone="info"
                        disabled={isBusy}
                        onClick={() => setShowRefundForm(true)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <ConfirmActionModal
            isOpen={!!confirmStatus}
            title={
              confirmStatus === "approved"
                ? "Approve transaction?"
                : "Reject transaction?"
            }
            description={
              confirmStatus === "approved"
                ? "This marks the transaction as approved. The buyer and seller will be notified."
                : "This marks the transaction as rejected. The buyer will be notified and may need to retry."
            }
            confirmLabel={confirmStatus === "approved" ? "Approve" : "Reject"}
            tone={confirmStatus === "approved" ? "success" : "danger"}
            isSubmitting={pending === "approve" || pending === "reject"}
            onCancel={() => !isBusy && setConfirmStatus(null)}
            onConfirm={async () => {
              if (!confirmStatus) return;
              await updateStatus(confirmStatus);
              setConfirmStatus(null);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FooterButton: React.FC<{
  label: string;
  tone: "success" | "danger" | "info";
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, tone, loading, disabled, onClick }) => {
  const colors =
    tone === "success"
      ? "bg-[#538e53] hover:bg-[#467a46]"
      : tone === "danger"
      ? "bg-[#D32F2F] hover:bg-[#b71c1c]"
      : "bg-[#2563eb] hover:bg-[#1d4ed8]";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-montserrat font-medium text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${colors}`}
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
          Working...
        </>
      ) : (
        label
      )}
    </button>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductCard: React.FC<{ item: any }> = ({ item }) => {
  const product = item?.product ?? {};
  const image =
    Array.isArray(product?.images) && product.images[0]
      ? product.images[0]
      : null;
  const unit = item?.unit || product?.unit || "";
  const quantity = item?.quantity;
  const unitPrice =
    typeof item?.unitPrice === "number" ? item.unitPrice : product?.price;
  const lineTotal =
    typeof item?.lineSubtotal === "number"
      ? item.lineSubtotal
      : typeof unitPrice === "number" && typeof quantity === "number"
      ? unitPrice * quantity
      : undefined;
  const categories: string[] = Array.isArray(product?.categories)
    ? product.categories
    : [];
  const owner = product?.owner ?? {};
  const localTransportRequired =
    item?.localTransportRequired || product?.localTransport?.required;
  const localTransportFee =
    item?.localTransportFee ?? product?.localTransport?.fee ?? 0;
  const localFrom =
    item?.localTransportFrom ?? product?.localTransport?.from ?? null;
  const localTo =
    item?.localTransportTo ?? product?.localTransport?.to ?? null;

  const statusKey = String(product?.status || "").toLowerCase();
  const statusStyle =
    statusKey === "available" || statusKey === "in_stock"
      ? "bg-green-50 text-green-700 border-green-100"
      : statusKey === "out_of_stock"
      ? "bg-red-50 text-red-600 border-red-100"
      : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Hero image */}
      <div className="relative w-full aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200">
        {image ? (
          <Image
            src={image}
            alt={product?.name || "Product"}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-montserrat">
            No image available
          </div>
        )}

        {/* Gradient scrim for overlay legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Status badge top-right */}
        {product?.status && (
          <span
            className={`absolute top-3 right-3 inline-block text-[10px] font-medium px-2.5 py-1 rounded-full border font-montserrat backdrop-blur-sm bg-opacity-90 ${statusStyle}`}
          >
            {statusKey.replace(/_/g, " ")}
          </span>
        )}

        {/* Name + category overlay bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {categories.map((c) => (
              <span
                key={c}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-[#538e53] font-montserrat font-medium backdrop-blur-sm"
              >
                {c}
              </span>
            ))}
          </div>
          <h4 className="font-montserrat font-bold text-xl text-white capitalize drop-shadow-sm">
            {product?.name || "—"}
          </h4>
          {product?.description && (
            <p className="text-xs text-white/90 font-montserrat mt-0.5 line-clamp-2 drop-shadow-sm">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Price strip */}
        <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
              Line Subtotal
            </p>
            <p className="font-montserrat font-bold text-lg text-[#2b2b2b]">
              {formatCurrency(lineTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
              Qty × Unit Price
            </p>
            <p className="font-montserrat text-sm text-[#2b2b2b]">
              <span className="font-semibold">{quantity ?? "—"}</span>
              {unit ? (
                <span className="text-gray-500">
                  {" "}
                  {unit.replace(/_/g, " ")}
                </span>
              ) : null}
              <span className="text-gray-400 mx-1.5">×</span>
              <span className="font-semibold">{formatCurrency(unitPrice)}</span>
            </p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-montserrat">
          {(owner?.name || owner?.email) && (
            <MetaRow
              label="Seller"
              value={owner?.name || owner?.email}
              sub={owner?.name ? owner?.email : undefined}
            />
          )}
          <MetaRow
            label="Unit"
            value={unit ? unit.replace(/_/g, " ") : "—"}
          />
          {typeof product?.unitWeightKg === "number" && (
            <MetaRow label="Unit Weight" value={`${product.unitWeightKg} kg`} />
          )}
          {typeof product?.price === "number" && (
            <MetaRow
              label="Catalog Price"
              value={formatCurrency(product.price)}
            />
          )}
        </div>

        {/* Local transport */}
        {localTransportRequired && (
          <div className="mt-2 rounded-lg bg-[#538e53]/5 border border-[#538e53]/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#538e53]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                />
              </svg>
              <p className="text-[11px] font-semibold text-[#538e53] uppercase tracking-wide font-montserrat">
                Local Transport
              </p>
              <span className="ml-auto text-sm font-montserrat font-semibold text-[#2b2b2b]">
                {formatCurrency(localTransportFee)}
              </span>
            </div>
            {(localFrom || localTo) && (
              <p className="text-xs text-gray-600 font-montserrat">
                {localFrom || "—"} <span className="text-gray-400">→</span>{" "}
                {localTo || "—"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetaRow: React.FC<{
  label: string;
  value?: string | number | null;
  sub?: string;
  mono?: boolean;
  className?: string;
}> = ({ label, value, sub, mono, className }) => (
  <div className={`min-w-0 ${className || ""}`}>
    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
      {label}
    </p>
    <p
      className={`text-[#2b2b2b] break-words ${
        mono ? "font-mono text-[11px]" : "font-montserrat text-sm"
      }`}
    >
      {value === undefined || value === null || value === "" ? "—" : value}
    </p>
    {sub && (
      <p className="text-[11px] text-gray-500 font-montserrat truncate">
        {sub}
      </p>
    )}
  </div>
);

const DetailRow: React.FC<{
  label: string;
  value?: string | number | null;
  className?: string;
  mono?: boolean;
}> = ({ label, value, className, mono }) => (
  <div className={`bg-gray-50 rounded-lg px-3 py-2.5 ${className || ""}`}>
    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-1">
      {label}
    </p>
    <p
      className={`text-sm text-[#2b2b2b] break-words ${
        mono ? "font-mono text-xs" : "font-montserrat"
      }`}
    >
      {value === undefined || value === null || value === "" ? "—" : value}
    </p>
  </div>
);
