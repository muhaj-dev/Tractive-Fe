"use client";
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useBuyerFleetBids,
  useRespondToFleetBid,
} from "@/hooks/queries/useTransporterQueries";
import { FleetBidResponse } from "@/services/negotiationService";
import { FleetBidPaymentModal } from "./FleetBidPaymentModal";
import { CounterBackModal } from "./CounterBackModal";
import { getPriceDelta } from "./bidHelpers";
import { getApiErrorMessage } from "@/lib/apiError";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-[#FFF3CD]", text: "text-[#856404]", label: "Pending" },
  accepted: { bg: "bg-[#D4EDDA]", text: "text-[#155724]", label: "Accepted" },
  countered: { bg: "bg-[#CCE5FF]", text: "text-[#004085]", label: "Countered" },
  rejected: { bg: "bg-[#F8D7DA]", text: "text-[#721C24]", label: "Rejected" },
};

const ExpandableMessage: React.FC<{
  text: string;
  speaker: string;
  tone: string;
}> = ({ text, speaker, tone }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 140;
  const displayed = expanded || !isLong ? text : `${text.slice(0, 140)}…`;
  return (
    <p className={`font-montserrat text-[11px] italic leading-relaxed ${tone}`}>
      {speaker}: &quot;{displayed}&quot;
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="not-italic ml-1 text-[#2563eb] hover:underline cursor-pointer"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </p>
  );
};

export const MyFleetBids: React.FC = () => {
  const {
    data: bids,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useBuyerFleetBids();
  const {
    mutate: respondToBid,
    isPending: isResponding,
    variables,
    error: mutationError,
    reset: resetMutation,
  } = useRespondToFleetBid();
  const [payingBid, setPayingBid] = useState<FleetBidResponse | null>(null);
  const [counterBid, setCounterBid] = useState<FleetBidResponse | null>(null);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="w-6 h-6 border-3 border-[#538e53] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // A failed request is not an empty list — saying "No fleet bids yet" when the
  // endpoint 500s tells the buyer their bids are gone. Show the failure and a
  // way to retry instead.
  if (isError) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-3 py-12">
        <p className="font-montserrat text-[13px] text-[#808080]">
          We couldn&apos;t load your fleet bids just now.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="font-montserrat text-[12px] text-[#538e53] border border-[#538e53] rounded-[5px] px-4 py-[6px] cursor-pointer disabled:opacity-60"
        >
          {isFetching ? "Retrying…" : "Try again"}
        </button>
      </div>
    );
  }

  const fleetBids = bids || [];

  if (fleetBids.length === 0) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <p className="font-montserrat text-[13px] text-[#808080]">
          No fleet bids yet.
        </p>
      </div>
    );
  }

  const getFleetId = (bid: FleetBidResponse) =>
    typeof bid.fleet === "object" ? bid.fleet._id : bid.fleet;

  const getFleetName = (bid: FleetBidResponse) =>
    typeof bid.fleet === "object" ? bid.fleet.fleetName : "Fleet";

  const getFleetRoute = (bid: FleetBidResponse) => {
    if (typeof bid.fleet === "object" && bid.fleet.route) {
      return `${bid.fleet.route.fromState} → ${bid.fleet.route.toState}`;
    }
    return null;
  };

  const handleRespond = (bid: FleetBidResponse, action: "accept" | "reject") => {
    respondToBid({
      fleetId: getFleetId(bid),
      bidId: bid._id,
      payload: { action },
    });
  };

  const counteredBids = fleetBids.filter((b) => b.status === "countered");
  const otherBids = fleetBids.filter((b) => b.status !== "countered");
  const orderedBids = [...counteredBids, ...otherBids];
  const activeBidId = isResponding ? variables?.bidId : null;

  return (
    <>
      {counteredBids.length > 0 && (
        <div className="bg-[#e8f0fe] border-l-[3px] border-[#2563eb] px-3 py-2 mb-3 rounded-[4px]">
          <p className="font-montserrat text-[12px] text-[#004085]">
            <span className="font-medium">{counteredBids.length}</span>{" "}
            transporter counter{counteredBids.length > 1 ? "s" : ""} need your
            response.
          </p>
        </div>
      )}

      <div className="w-full flex flex-col gap-3">
        {orderedBids.map((bid) => {
          const status = statusStyles[bid.status] || statusStyles.pending;
          const route = getFleetRoute(bid);
          const isCountered = bid.status === "countered";
          const counterAmount = bid.counterAmount ?? 0;
          const delta =
            isCountered && counterAmount
              ? getPriceDelta(bid.amount, counterAmount)
              : null;
          const createdAgo = bid.createdAt
            ? formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })
            : "";
          const updatedAgo = bid.updatedAt
            ? formatDistanceToNow(new Date(bid.updatedAt), { addSuffix: true })
            : "";
          const isRowPending = activeBidId === bid._id;

          return (
            <div
              key={bid._id}
              className={`bg-[#fefefe] rounded-[6px] shadow-sm border p-4 flex flex-col gap-3 ${
                isCountered
                  ? "border-l-[3px] border-l-[#2563eb] border-[#e2e2e2]"
                  : "border-[#e2e2e2]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-montserrat text-[13px] sm:text-[14px] font-medium text-[#2b2b2b]">
                    {getFleetName(bid)}
                  </p>
                  {route && (
                    <p className="font-montserrat text-[10px] sm:text-[11px] text-[#808080]">
                      {route}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`${status.bg} ${status.text} font-montserrat text-[10px] sm:text-[11px] font-medium px-2 py-1 rounded-full`}
                  >
                    {status.label}
                  </span>
                  {(isCountered ? updatedAgo : createdAgo) && (
                    <span className="font-montserrat text-[10px] text-[#808080]">
                      {isCountered
                        ? `Countered ${updatedAgo}`
                        : createdAgo}
                    </span>
                  )}
                </div>
              </div>

              {isCountered ? (
                <div className="flex flex-wrap items-center gap-3 bg-[#f8f8f8] rounded-[4px] px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="font-montserrat text-[11px] text-[#808080] font-medium">
                      Your bid
                    </span>
                    <span className="font-montserrat text-[15px] text-[#2b2b2b] font-bold">
                      ₦{bid.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[#b0b0b0] text-[14px]">→</span>
                  <div className="flex flex-col">
                    <span className="font-montserrat text-[11px] text-[#808080] font-medium">
                      Counter
                    </span>
                    <span className="font-montserrat text-[15px] text-[#004085] font-bold">
                      ₦{counterAmount.toLocaleString()}
                    </span>
                  </div>
                  {delta && (
                    <span
                      className={`font-montserrat text-[13px] font-bold ${delta.tone}`}
                    >
                      {delta.formatted}
                    </span>
                  )}
                </div>
              ) : (
                <p className="font-montserrat text-[12px] sm:text-[13px] text-[#808080]">
                  Your Bid:{" "}
                  <span className="text-[#2b2b2b] font-bold text-[14px]">
                    ₦{bid.amount.toLocaleString()}
                  </span>
                </p>
              )}

              {bid.message && (
                <ExpandableMessage
                  text={bid.message}
                  speaker="You"
                  tone="text-[#808080]"
                />
              )}
              {bid.transporterMessage && (
                <ExpandableMessage
                  text={bid.transporterMessage}
                  speaker="Transporter"
                  tone="text-[#004085]"
                />
              )}

              {isCountered && (
                <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRespond(bid, "accept")}
                    disabled={isRowPending}
                    className="flex-1 h-9 bg-[#538e53] hover:bg-[#3a6b3a] text-[#fefefe] font-montserrat text-[12px] rounded-[4px] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Accept counter
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounterBid(bid)}
                    disabled={isRowPending}
                    className="flex-1 h-9 border border-[#2563eb] text-[#2563eb] hover:bg-[#e8f0fe] font-montserrat text-[12px] rounded-[4px] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Counter back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespond(bid, "reject")}
                    disabled={isRowPending}
                    className="flex-1 h-9 border border-[#d32f2f] text-[#d32f2f] hover:bg-[#fde8e8] font-montserrat text-[12px] rounded-[4px] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              )}

              {bid.status === "accepted" && (
                <button
                  type="button"
                  onClick={() => setPayingBid(bid)}
                  className="w-full h-9 bg-[#538e53] hover:bg-[#3a6b3a] text-[#fefefe] font-montserrat text-[12px] rounded-[4px] transition cursor-pointer"
                >
                  Pay Now
                </button>
              )}
            </div>
          );
        })}
      </div>

      {payingBid && (
        <FleetBidPaymentModal
          isOpen={!!payingBid}
          onClose={() => setPayingBid(null)}
          bid={payingBid}
        />
      )}

      {counterBid && counterBid.counterAmount !== undefined && (
        <CounterBackModal
          isOpen={!!counterBid}
          onClose={() => {
            resetMutation();
            setCounterBid(null);
          }}
          title={`Counter ${
            typeof counterBid.fleet === "object"
              ? counterBid.fleet.fleetName
              : "transporter"
          }`}
          yourBid={counterBid.amount}
          theirCounter={counterBid.counterAmount || 0}
          isSubmitting={
            isResponding && variables?.bidId === counterBid._id
          }
          apiError={
            mutationError &&
            variables?.bidId === counterBid._id &&
            variables?.payload?.action === "counter"
              ? getApiErrorMessage(mutationError)
              : null
          }
          onSubmit={({ amount, message }) => {
            resetMutation();
            respondToBid(
              {
                fleetId: getFleetId(counterBid),
                bidId: counterBid._id,
                payload: { action: "counter", amount, message },
              },
              {
                onSuccess: () => setCounterBid(null),
              },
            );
          }}
        />
      )}
    </>
  );
};
