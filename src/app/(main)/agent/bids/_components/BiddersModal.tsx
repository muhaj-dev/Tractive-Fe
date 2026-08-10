"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bidService, SingleBid } from "@/services/bidService";
import { toast } from "sonner";
import Image from "next/image";

interface BiddersModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  /**
   * Fired after a bid's status actually changed on the server. Accept closes the
   * modal (which refetches anyway), but reject and counter leave it open — without
   * this the row behind the modal kept showing the pre-action status until reload.
   */
  onBidUpdated?: () => void;
}

type ActionType = "accept" | "reject" | "counter";

const STATUS_TO_ACTION: Record<ActionType, "accepted" | "rejected" | "countered"> = {
  accept: "accepted",
  reject: "rejected",
  counter: "countered",
};

export const BiddersModal: React.FC<BiddersModalProps> = ({
  isOpen,
  onClose,
  listingId,
  onBidUpdated,
}) => {
  const [bidders, setBidders] = useState<SingleBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBidder, setSelectedBidder] = useState<SingleBid | null>(null);
  const [actionBid, setActionBid] = useState<SingleBid | null>(null);
  const [actionType, setActionType] = useState<ActionType>("accept");
  const [counterAmount, setCounterAmount] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const itemsPerPage = 5;

  useEffect(() => {
    if (isOpen && listingId) {
      fetchDetails();
      setSelectedBidder(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, listingId]);

  const fetchDetails = async (opts?: { silent?: boolean }): Promise<SingleBid[] | null> => {
    if (!opts?.silent) setIsLoading(true);
    try {
      const details = await bidService.getBidDetails(listingId);
      setBidders(details.bids);
      return details.bids;
    } catch {
      if (!opts?.silent) {
        toast.error("Failed to load bidders");
        onClose();
      }
      return null;
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  };

  const statusStyles = (status: SingleBid["status"]) =>
    status === "accepted"
      ? "bg-green-50 text-green-600 border-green-100"
      : status === "rejected"
      ? "bg-red-50 text-red-600 border-red-100"
      : status === "countered"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : "bg-yellow-50 text-yellow-600 border-yellow-100";

  const openAction = (bid: SingleBid, type: ActionType = "accept") => {
    setActionBid(bid);
    setActionType(type);
    setCounterAmount(bid.counterOffer ? String(bid.counterOffer) : "");
    setActionMessage("");
  };

  const closeAction = () => {
    setActionBid(null);
    setCounterAmount("");
    setActionMessage("");
  };

  const submitAction = async () => {
    if (!actionBid) return;
    const status = STATUS_TO_ACTION[actionType];

    if (actionType === "counter") {
      const parsed = Number(counterAmount);
      if (!parsed || parsed <= 0) {
        toast.error("Enter a valid counter offer amount");
        return;
      }
    }

    setProcessingBidId(actionBid.id);
    try {
      await bidService.updateBidStatus(actionBid.id, {
        status,
        ...(actionType === "counter"
          ? { counterOffer: Number(counterAmount) }
          : {}),
        ...(actionMessage.trim() ? { message: actionMessage.trim() } : {}),
      });

      toast.success(
        actionType === "counter"
          ? "Counter offer sent"
          : `Bid ${status} successfully`,
      );

      // Silently refetch from API so the table/detail view reflect server state
      const fresh = await fetchDetails({ silent: true });
      if (fresh && selectedBidder) {
        const updated = fresh.find((b) => b.id === selectedBidder.id);
        if (updated) setSelectedBidder(updated);
      }
      onBidUpdated?.();

      closeAction();
      if (status === "accepted") {
        onClose();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update bid",
      );
    } finally {
      setProcessingBidId(null);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const actionConfig = useMemo(
    () => ({
      accept: {
        label: "Accept",
        cta: "Accept Bid",
        color: "#538e53",
        hoverColor: "#467a46",
        description:
          "Confirm this bid. The buyer will be notified and the deal moves forward.",
      },
      reject: {
        label: "Reject",
        cta: "Reject Bid",
        color: "#D32F2F",
        hoverColor: "#b71c1c",
        description:
          "Decline this bid. You can optionally include a reason for the buyer.",
      },
      counter: {
        label: "Counter",
        cta: "Send Counter Offer",
        color: "#2563eb",
        hoverColor: "#1d4ed8",
        description:
          "Propose a new price. The buyer can accept, reject, or submit a fresh offer.",
      },
    }),
    [],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] bg-opacity-50 flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-[10px] w-full max-w-[800px] shadow-lg overflow-hidden flex flex-col max-h-[80vh]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="w-full">
                {selectedBidder ? (
                  <button
                    onClick={() => setSelectedBidder(null)}
                    className="flex items-center gap-2 text-sm text-[#538e53] hover:underline font-montserrat cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to bidders
                  </button>
                ) : (
                  <div className="relative w-full max-w-sm mb-2">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full pl-8 py-2 border rounded-md text-sm focus:outline-none focus:border-[#538e53]"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (selectedBidder) {
                    setSelectedBidder(null);
                  } else {
                    onClose();
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {selectedBidder ? (
              /* Bidder Detail View */
              <div className="overflow-y-auto flex-grow p-6 scrollbar-thin scrollbar-thumb-gray-200">
                {/* Bidder Info */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={
                        selectedBidder.bidderAvatar ||
                        "/images/placeholder-avatar.png"
                      }
                      alt={selectedBidder.bidderName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-semibold text-base text-[#2b2b2b]">
                      {selectedBidder.bidderName}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {new Date(selectedBidder.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Bid Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] font-medium text-gray-500 font-montserrat mb-1">Bid Amount</p>
                    <p className="font-montserrat font-bold text-2xl text-[#2b2b2b]">
                      ₦{selectedBidder.amount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] font-medium text-gray-500 font-montserrat mb-1">Quantity</p>
                    <p className="font-montserrat font-bold text-2xl text-[#2b2b2b]">
                      {selectedBidder.quantity?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                </div>

                {selectedBidder.counterOffer ? (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-[12px] font-semibold text-blue-700 font-montserrat mb-1">
                      Your last counter offer
                    </p>
                    <p className="font-montserrat font-bold text-2xl text-blue-800">
                      ₦{selectedBidder.counterOffer.toLocaleString()}
                    </p>
                  </div>
                ) : null}

                {/* Status */}
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-montserrat mb-1">Status</p>
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles(selectedBidder.status)}`}
                  >
                    {selectedBidder.status.charAt(0).toUpperCase() +
                      selectedBidder.status.slice(1)}
                  </span>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-montserrat mb-2">Message</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-montserrat text-sm text-[#2b2b2b] leading-relaxed whitespace-pre-wrap">
                      {selectedBidder.message || "No message provided."}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => openAction(selectedBidder, "accept")}
                    disabled={
                      processingBidId === selectedBidder.id ||
                      selectedBidder.status === "accepted" ||
                      selectedBidder.status === "rejected"
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-montserrat font-medium text-white bg-[#538e53] hover:bg-[#467a46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    Take Action
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto flex-grow flex flex-col">
                <div className="min-w-[720px]">
                  {/* Table Header */}
                  <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                    <div className="w-1/5">Name</div>
                    <div className="w-1/5 text-center">Amount</div>
                    <div className="w-1/5 text-center">Status</div>
                    <div className="w-1/5 text-center">Message</div>
                    <div className="w-1/5 text-right">Action</div>
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200 flex-grow min-w-[720px]">
                  {isLoading ? (
                    <div className="py-10 flex justify-center text-gray-500">
                      Loading...
                    </div>
                  ) : bidders.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 text-sm">
                      No bidders yet.
                    </div>
                  ) : (
                    <>
                      {bidders
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
                        )
                        .map((bidder) => {
                          const isFinal =
                            bidder.status === "accepted" ||
                            bidder.status === "rejected";
                          return (
                            <div
                              key={bidder.id}
                              className="flex items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setSelectedBidder(bidder)}
                            >
                              {/* Name & Avatar */}
                              <div className="w-1/5 flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  <Image
                                    src={
                                      bidder?.bidderAvatar ||
                                      "/images/placeholder-avatar.png"
                                    }
                                    alt={bidder?.bidderName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-montserrat text-sm text-[#2b2b2b] truncate pr-2">
                                  {bidder?.bidderName}
                                </span>
                              </div>

                              {/* Amount */}
                              <div className="w-1/5 text-center font-montserrat text-[15px] font-bold text-[#2b2b2b]">
                                ₦{bidder?.amount?.toLocaleString()}
                              </div>

                              {/* Status */}
                              <div className="w-1/5 flex items-center justify-center">
                                <span
                                  className={`inline-block text-[10px] font-medium px-2 py-1 rounded-full border ${statusStyles(bidder.status)}`}
                                >
                                  {bidder.status.charAt(0).toUpperCase() +
                                    bidder.status.slice(1)}
                                </span>
                              </div>

                              {/* Message */}
                              <div className="w-1/5 text-center font-montserrat text-xs text-gray-500 truncate px-2">
                                {bidder?.message
                                  ? bidder.message.length > 35
                                    ? bidder.message.slice(0, 35) + "..."
                                    : bidder.message
                                  : "—"}
                              </div>

                              {/* Action */}
                              <div className="w-1/5 flex items-center justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAction(bidder, "accept");
                                  }}
                                  disabled={
                                    processingBidId === bidder.id || isFinal
                                  }
                                  aria-label="Take action on bid"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-montserrat font-medium border border-[#538e53]/30 bg-[#538e53]/10 text-[#538e53] hover:bg-[#538e53] hover:text-white hover:border-[#538e53] hover:shadow-sm active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#538e53]/10 disabled:hover:text-[#538e53] transition-all duration-150 cursor-pointer whitespace-nowrap"
                                >
                                  {processingBidId === bidder.id ? (
                                    <svg
                                      className="animate-spin h-3 w-3"
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
                                  ) : (
                                    <svg
                                      className="h-3 w-3"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                      />
                                    </svg>
                                  )}
                                  {isFinal
                                    ? bidder.status === "accepted"
                                      ? "Accepted"
                                      : "Rejected"
                                    : "Action"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </>
                  )}
                </div>

                {/* Pagination Footer */}
                {!isLoading && bidders.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 min-w-[720px]">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      Page {currentPage} of{" "}
                      {Math.ceil(bidders.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            Math.ceil(bidders.length / itemsPerPage),
                            p + 1,
                          ),
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(bidders.length / itemsPerPage)
                      }
                      className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Action Modal */}
          <AnimatePresence>
            {actionBid && (
              <motion.div
                className="fixed inset-0 bg-[#2b2b2bcc] flex items-center justify-center z-[60] px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (processingBidId !== actionBid.id) closeAction();
                }}
              >
                <motion.div
                  className="bg-white rounded-[12px] w-full max-w-[480px] shadow-xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-montserrat font-semibold text-base text-[#2b2b2b]">
                          Respond to Bid
                        </h3>
                        <span
                          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusStyles(actionBid.status)}`}
                        >
                          {actionBid.status.charAt(0).toUpperCase() +
                            actionBid.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-montserrat mt-1">
                        {actionBid.bidderName} ·{" "}
                        <span className="font-bold text-[#2b2b2b]">
                          ₦{actionBid.amount?.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={closeAction}
                      disabled={processingBidId === actionBid.id}
                      className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="px-5 py-5 space-y-4">
                    {/* Action Tabs */}
                    <div className="grid grid-cols-3 gap-2">
                      {(["accept", "reject", "counter"] as ActionType[]).map(
                        (type) => {
                          const cfg = actionConfig[type];
                          const active = actionType === type;
                          return (
                            <button
                              key={type}
                              onClick={() => setActionType(type)}
                              disabled={processingBidId === actionBid.id}
                              className="rounded-lg border px-3 py-2.5 text-sm font-montserrat font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                borderColor: active ? cfg.color : "#e5e7eb",
                                background: active ? cfg.color : "#fff",
                                color: active ? "#fff" : "#4b5563",
                              }}
                            >
                              {cfg.label}
                            </button>
                          );
                        },
                      )}
                    </div>

                    <p className="text-xs text-gray-500 font-montserrat leading-relaxed">
                      {actionConfig[actionType].description}
                    </p>

                    {/* Counter Amount */}
                    {actionType === "counter" && (
                      <div>
                        <label className="block text-[13px] font-semibold text-[#2b2b2b] font-montserrat mb-1.5">
                          Counter Offer (₦)
                        </label>
                        <input
                          type="number"
                          value={counterAmount}
                          onChange={(e) => setCounterAmount(e.target.value)}
                          disabled={processingBidId === actionBid.id}
                          placeholder="e.g. 4700"
                          min={1}
                          className="w-full px-3 py-3 border border-gray-200 rounded-lg text-[16px] font-montserrat font-bold focus:outline-none focus:border-[#2563eb] disabled:opacity-50"
                        />
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <label className="block text-[13px] font-semibold text-[#2b2b2b] font-montserrat mb-1.5">
                        Message{" "}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={actionMessage}
                        onChange={(e) => setActionMessage(e.target.value)}
                        disabled={processingBidId === actionBid.id}
                        placeholder={
                          actionType === "counter"
                            ? "Best I can do is ₦4,700"
                            : actionType === "reject"
                            ? "Reason for rejection"
                            : "Optional note to the buyer"
                        }
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] font-montserrat resize-none focus:outline-none focus:border-[#538e53] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={closeAction}
                      disabled={processingBidId === actionBid.id}
                      className="px-4 py-2 rounded-lg text-sm font-montserrat font-medium text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitAction}
                      disabled={processingBidId === actionBid.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-montserrat font-medium text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: actionConfig[actionType].color,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          actionConfig[actionType].hoverColor)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          actionConfig[actionType].color)
                      }
                    >
                      {processingBidId === actionBid.id ? (
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
                          Processing...
                        </>
                      ) : (
                        actionConfig[actionType].cta
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
