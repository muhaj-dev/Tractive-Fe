"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAdminFleetPaymentById } from "@/hooks/queries/useTransporterQueries";
import {
  AdminFleetPaymentRecord,
  FleetPaymentParty,
  fleetService,
} from "@/services/fleetService";
import { ConfirmActionModal } from "../../_components/ConfirmActionModal";
import Avatar from "@/components/ui/Avatar";

interface FleetPaymentDetailModalProps {
  isOpen: boolean;
  paymentId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
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

const formatMethod = (m?: string) => {
  if (!m) return "—";
  return m
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
};

const statusBadge = (status?: string) => {
  const s = (status || "").toLowerCase();
  const styles =
    s === "approved"
      ? "bg-green-50 text-green-600 border-green-100"
      : s === "pending"
        ? "bg-yellow-50 text-yellow-700 border-yellow-100"
        : s === "rejected"
          ? "bg-red-50 text-red-600 border-red-100"
          : s === "refunded"
            ? "bg-blue-50 text-blue-600 border-blue-100"
            : "bg-gray-50 text-gray-600 border-gray-200";
  return { styles, label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "—" };
};

const fleetField = (
  p: AdminFleetPaymentRecord | undefined,
  key: "fleetName" | "fleetNumber" | "plateNumber" | "model" | "image",
): string | undefined => {
  if (!p?.fleet || typeof p.fleet !== "object") return undefined;
  const value = (p.fleet as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

const fleetPrice = (p: AdminFleetPaymentRecord | undefined): number | undefined => {
  if (!p?.fleet || typeof p.fleet !== "object") return undefined;
  const value = (p.fleet as Record<string, unknown>).price;
  return typeof value === "number" ? value : undefined;
};

const bookingObject = (
  p: AdminFleetPaymentRecord | undefined,
): Record<string, unknown> | undefined => {
  if (!p?.booking || typeof p.booking !== "object") return undefined;
  return p.booking as Record<string, unknown>;
};

const approvedByName = (
  p: AdminFleetPaymentRecord | undefined,
): string | undefined => {
  const raw = p?.approvedBy;
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") {
    const name = (raw as Record<string, unknown>).name;
    if (typeof name === "string") return name;
    const email = (raw as Record<string, unknown>).email;
    if (typeof email === "string") return email;
  }
  return undefined;
};

const fleetImageSrc = (p?: AdminFleetPaymentRecord): string | undefined => {
  if (!p?.fleet || typeof p.fleet !== "object") return undefined;
  const direct = fleetField(p, "image");
  if (direct) return direct;
  const images = (p.fleet as { images?: string[] }).images;
  return Array.isArray(images) ? images[0] : undefined;
};

const fleetRoute = (
  p?: AdminFleetPaymentRecord,
): { from?: string; to?: string } => {
  if (!p?.fleet || typeof p.fleet !== "object") return {};
  const route = (p.fleet as { route?: { fromState?: string; toState?: string } })
    .route;
  return { from: route?.fromState, to: route?.toState };
};

const partyField = (
  source: string | FleetPaymentParty | undefined,
  key: keyof FleetPaymentParty,
): string | undefined => {
  if (!source || typeof source !== "object") return undefined;
  const value = source[key];
  return typeof value === "string" ? value : undefined;
};

export const FleetPaymentDetailModal: React.FC<
  FleetPaymentDetailModalProps
> = ({ isOpen, paymentId, onClose, onUpdated }) => {
  const { data: payment, isLoading, refetch } = useAdminFleetPaymentById(
    isOpen ? paymentId : null,
  );

  const [pending, setPending] = useState<
    "approve" | "reject" | "refund" | null
  >(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [confirmStatus, setConfirmStatus] = useState<
    "approved" | "rejected" | null
  >(null);

  const closeAndReset = () => {
    setShowRefundForm(false);
    setRefundReason("");
    setRefundAmount("");
    setPending(null);
    setConfirmStatus(null);
    onClose();
  };

  const openRefundForm = () => {
    setRefundAmount(
      typeof payment?.amount === "number" ? String(payment.amount) : "",
    );
    setShowRefundForm(true);
  };

  const isBusy = pending !== null;

  const runStatusUpdate = async () => {
    if (!paymentId || !confirmStatus) return;
    setPending(confirmStatus === "approved" ? "approve" : "reject");
    try {
      await fleetService.adminUpdateFleetPaymentStatus(paymentId, {
        status: confirmStatus,
      });
      toast.success(
        confirmStatus === "approved"
          ? "Fleet payment approved"
          : "Fleet payment rejected",
      );
      setConfirmStatus(null);
      onUpdated?.();
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update fleet payment",
      );
    } finally {
      setPending(null);
    }
  };

  const submitRefund = async () => {
    if (!paymentId) return;
    const reason = refundReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for the refund");
      return;
    }
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    setPending("refund");
    try {
      await fleetService.adminRefundFleetPayment({
        fleetPaymentId: paymentId,
        reason,
        refundAmount: amount,
      });
      toast.success("Refund issued");
      setShowRefundForm(false);
      setRefundReason("");
      setRefundAmount("");
      onUpdated?.();
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to issue refund",
      );
    } finally {
      setPending(null);
    }
  };

  const badge = statusBadge(payment?.status as string | undefined);
  const currentStatus = (payment?.status as string | undefined)?.toLowerCase();
  const fleetName =
    fleetField(payment, "fleetName") ||
    fleetField(payment, "plateNumber") ||
    "Fleet";
  const fleetModel = fleetField(payment, "model");
  const heroImage = fleetImageSrc(payment);
  const route = fleetRoute(payment);

  const buyer = payment?.buyer ?? payment?.payer;
  const buyerName =
    partyField(buyer, "name") || partyField(buyer, "email") || "—";
  const buyerEmail = partyField(buyer, "email");
  const buyerPhone = partyField(buyer, "phone");
  // Avatar handles the missing case *and* the present-but-404 case, so no
  // `|| placeholder` here.
  const buyerAvatar = partyField(buyer, "avatar");

  const transporter = payment?.transporter;
  const transporterName =
    partyField(transporter, "name") || partyField(transporter, "email");
  const transporterEmail = partyField(transporter, "email");
  const transporterPhone = partyField(transporter, "phone");

  const shipmentItems = Array.isArray(payment?.shipmentItems)
    ? payment.shipmentItems
    : [];

  const refundReasonText =
    typeof payment?.refundReason === "string" ? payment.refundReason : null;
  const rejectReasonText =
    !refundReasonText && typeof payment?.reason === "string"
      ? payment.reason
      : null;

  const fleetPlateNumber = fleetField(payment, "plateNumber");
  const fleetUnitNumber = fleetField(payment, "fleetNumber");
  const fleetUnitPrice = fleetPrice(payment);
  const approver = approvedByName(payment);

  const booking = bookingObject(payment);
  const bookingId =
    typeof booking?._id === "string" ? booking._id : undefined;
  const bookingStatus =
    typeof booking?.status === "string" ? booking.status : undefined;
  const bookingAmount =
    typeof booking?.amount === "number" ? booking.amount : undefined;
  const bookingWeight =
    typeof booking?.loadWeightKg === "number" ? booking.loadWeightKg : undefined;
  const bookingTripId =
    typeof booking?.fleetTripId === "string" ? booking.fleetTripId : undefined;
  const tripId =
    typeof payment?.fleetTripId === "string"
      ? payment.fleetTripId
      : bookingTripId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAndReset}
        >
          <motion.div
            className="bg-white rounded-[12px] w-full max-w-[760px] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-montserrat font-semibold text-base text-[#2b2b2b]">
                Fleet Payment Details
              </h3>
              <button
                onClick={closeAndReset}
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

            <div className="overflow-y-auto flex-grow px-5 py-5">
              {isLoading || !payment ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-7 w-7 border-4 border-[#538e53] border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Fleet hero with route */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="relative w-full aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200">
                      {heroImage ? (
                        <Image
                          src={heroImage}
                          alt={fleetName}
                          fill
                          sizes="(max-width: 768px) 100vw, 720px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-montserrat">
                          No fleet image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {fleetModel && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-[#538e53] font-montserrat font-medium backdrop-blur-sm">
                              {fleetModel}
                            </span>
                          )}
                          {fleetPlateNumber && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-[#2b2b2b] font-montserrat font-medium backdrop-blur-sm">
                              Plate {fleetPlateNumber}
                            </span>
                          )}
                          {fleetUnitNumber &&
                            fleetUnitNumber !== fleetPlateNumber && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-[#2b2b2b] font-montserrat font-medium backdrop-blur-sm">
                                Unit {fleetUnitNumber}
                              </span>
                            )}
                        </div>
                        <h4 className="font-montserrat font-bold text-xl text-white capitalize drop-shadow-sm">
                          {fleetName}
                        </h4>
                        {(route.from || route.to) && (
                          <p className="text-xs text-white/90 font-montserrat mt-1 drop-shadow-sm">
                            {route.from || "—"}{" "}
                            <span className="text-white/60">→</span>{" "}
                            {route.to || "—"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount + Status */}
                  <div className="bg-gradient-to-r from-[#538e53]/10 to-[#538e53]/5 border border-[#538e53]/20 rounded-lg px-4 py-4">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 font-montserrat mb-1">
                      Amount
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="font-montserrat font-semibold text-xl text-[#2b2b2b]">
                        {formatCurrency(payment.amount)}
                      </p>
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${badge.styles}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailRow
                      label="Payment Method"
                      value={formatMethod(payment.paymentMethod)}
                    />
                    <DetailRow
                      label="Whole Truck"
                      value={payment.wholeTruckOnly ? "Yes" : "No"}
                    />
                    <DetailRow
                      label="Load Weight"
                      value={
                        typeof payment.loadWeightKg === "number"
                          ? `${payment.loadWeightKg.toLocaleString()} kg`
                          : "—"
                      }
                    />
                    <DetailRow
                      label="Fleet Price"
                      value={formatCurrency(fleetUnitPrice)}
                    />
                    <DetailRow
                      label="Created"
                      value={formatDate(payment.createdAt)}
                    />
                    <DetailRow
                      label="Updated"
                      value={formatDate(payment.updatedAt)}
                    />
                    <DetailRow
                      label="Approved By"
                      value={approver || "—"}
                    />
                    {tripId && (
                      <DetailRow label="Fleet Trip ID" value={tripId} mono />
                    )}
                  </div>

                  {/* Note */}
                  {typeof payment.note === "string" && payment.note && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Note
                      </p>
                      <p className="font-montserrat text-sm text-[#2b2b2b]">
                        {payment.note}
                      </p>
                    </div>
                  )}

                  {/* Buyer */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                      Buyer
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={buyerAvatar}
                        alt={buyerName}
                        size={40}
                        className="rounded-full w-10 h-10 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-montserrat text-sm text-[#2b2b2b] truncate">
                          {buyerName}
                        </p>
                        {buyerEmail && (
                          <p className="font-montserrat text-xs text-gray-500 truncate">
                            {buyerEmail}
                          </p>
                        )}
                        {buyerPhone && (
                          <p className="font-montserrat text-xs text-gray-500">
                            {buyerPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transporter */}
                  {transporterName && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Transporter
                      </p>
                      <div className="flex items-center gap-3">
                        {/* Was hardcoded to the placeholder, so a transporter
                            with a real photo never showed it. */}
                        <Avatar
                          src={partyField(transporter, "avatar")}
                          alt={transporterName}
                          size={40}
                          className="rounded-full w-10 h-10 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-montserrat text-sm text-[#2b2b2b] truncate">
                            {transporterName}
                          </p>
                          {transporterEmail && (
                            <p className="font-montserrat text-xs text-gray-500 truncate">
                              {transporterEmail}
                            </p>
                          )}
                          {transporterPhone && (
                            <p className="font-montserrat text-xs text-gray-500">
                              {transporterPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipment items */}
                  {shipmentItems.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Shipment Items ({shipmentItems.length})
                      </p>
                      <div className="space-y-2">
                        {shipmentItems.map((item, idx) => (
                          <div
                            key={item._id ?? idx}
                            className="bg-gray-50 rounded-lg px-3 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2"
                          >
                            <div className="col-span-2">
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
                                Product
                              </p>
                              <p className="font-montserrat text-sm text-[#2b2b2b] capitalize truncate">
                                {item.productName || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
                                Qty
                              </p>
                              <p className="font-montserrat text-sm text-[#2b2b2b]">
                                {item.quantity ?? "—"}{" "}
                                {item.unit
                                  ? item.unit.replace(/_/g, " ")
                                  : ""}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat">
                                Weight
                              </p>
                              <p className="font-montserrat text-sm text-[#2b2b2b]">
                                {typeof item.loadWeightKg === "number"
                                  ? `${item.loadWeightKg} kg`
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking */}
                  {booking && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Booking
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bookingStatus && (
                          <DetailRow
                            label="Booking Status"
                            value={bookingStatus
                              .split("_")
                              .map((p) =>
                                p ? p.charAt(0).toUpperCase() + p.slice(1) : p,
                              )
                              .join(" ")}
                          />
                        )}
                        <DetailRow
                          label="Booking Amount"
                          value={formatCurrency(bookingAmount)}
                        />
                        <DetailRow
                          label="Booking Weight"
                          value={
                            typeof bookingWeight === "number"
                              ? `${bookingWeight.toLocaleString()} kg`
                              : "—"
                          }
                        />
                        {bookingId && (
                          <DetailRow
                            label="Booking ID"
                            value={bookingId}
                            mono
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Refund / reject reason */}
                  {currentStatus === "refunded" && refundReasonText && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Refund Reason
                      </p>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                        <p className="text-sm text-blue-700 font-montserrat">
                          {refundReasonText}
                        </p>
                      </div>
                    </div>
                  )}
                  {currentStatus === "rejected" && rejectReasonText && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-montserrat mb-2">
                        Rejection Reason
                      </p>
                      <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                        <p className="text-sm text-red-700 font-montserrat">
                          {rejectReasonText}
                        </p>
                      </div>
                    </div>
                  )}

                  <DetailRow
                    label="Payment ID"
                    value={(payment._id || payment.id) as string}
                    className="col-span-2"
                    mono
                  />
                </div>
              )}
            </div>

            {!isLoading && payment && (
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                {showRefundForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-montserrat text-gray-600 mb-1">
                        Refund amount (₦)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        disabled={isBusy}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-montserrat focus:outline-none focus:border-[#538e53] disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-montserrat text-gray-600 mb-1">
                        Refund reason
                      </label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        disabled={isBusy}
                        rows={3}
                        placeholder="e.g. Fleet booking cancelled"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-montserrat resize-none focus:outline-none focus:border-[#538e53] disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowRefundForm(false);
                          setRefundReason("");
                          setRefundAmount("");
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
                        onClick={openRefundForm}
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
                ? "Approve fleet payment?"
                : "Reject fleet payment?"
            }
            description={
              confirmStatus === "approved"
                ? "This marks the payment as approved. The transporter and buyer will be notified."
                : "This marks the payment as rejected. The buyer will be notified and may need to retry."
            }
            confirmLabel={confirmStatus === "approved" ? "Approve" : "Reject"}
            tone={confirmStatus === "approved" ? "success" : "danger"}
            isSubmitting={
              pending === "approve" || pending === "reject"
            }
            onCancel={() => !isBusy && setConfirmStatus(null)}
            onConfirm={runStatusUpdate}
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
