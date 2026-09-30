"use client";
import React, { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { BidResponse } from "@/services/bidService";
import { useBuyerUpdateBidStatus } from "@/hooks/queries/useBidQueries";
import { CounterBackModal } from "./CounterBackModal";
import { getAgentName, getPriceDelta } from "./bidHelpers";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatQuantityWithUnit } from "@/utils/productUnits";

interface CounteredProductBidsProps {
  bids: BidResponse[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

const Clamped: React.FC<{ text: string; speaker: string; tone: string }> = ({
  text,
  speaker,
  tone,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 100;
  const preview = isLong && !expanded ? `${text.slice(0, 100)}…` : text;
  return (
    <p className={`font-montserrat text-[11px] italic leading-snug ${tone}`}>
      <span className="not-italic font-medium">{speaker}:</span> &quot;{preview}&quot;
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="not-italic ml-1 text-[#2563eb] hover:underline cursor-pointer"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </p>
  );
};

export const CounteredProductBids: React.FC<CounteredProductBidsProps> = ({
  bids,
  page,
  limit,
  total,
  onPageChange,
  isFetching,
}) => {
  const {
    mutate: updateBid,
    isPending,
    variables,
    error: mutationError,
    reset: resetMutation,
  } = useBuyerUpdateBidStatus();
  const [counterBid, setCounterBid] = useState<BidResponse | null>(null);
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("newest");

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  if (total === 0) {
    return (
      <div className="w-full bg-[#fefefe] rounded-[6px] shadow-sm p-10 text-center">
        <p className="font-montserrat text-[13px] text-[#808080]">
          No counters waiting on you. Nice.
        </p>
      </div>
    );
  }

  const sorted = [...bids].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
    return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
  });

  const visible = sorted;
  const pendingId = isPending ? variables?.id : null;

  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <p className="font-montserrat text-[12px] text-[#808080]">
          Showing{" "}
          <span className="text-[#2b2b2b] font-medium">
            {startIndex}–{endIndex}
          </span>{" "}
          of <span className="text-[#2b2b2b] font-medium">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <label className="font-montserrat text-[11px] text-[#808080]">Sort:</label>
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "oldest" | "newest")
            }
            className="font-montserrat text-[11px] text-[#2b2b2b] bg-[#fefefe] border border-[#e2e2e2] rounded-[4px] px-2 py-1 cursor-pointer focus:outline-none focus:border-[#538e53]"
          >
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {visible.map((bid) => {
          const yourBid = bid.amount;
          const counterOffer = (bid as BidResponse & { counterOffer?: number })
            .counterOffer;
          const counterAmount = counterOffer ?? bid.product?.price ?? 0;
          const delta = getPriceDelta(yourBid, counterAmount);
          const image = bid.product.images?.[0] || "/images/placeholder.png";
          const agentName = getAgentName(bid);
          const submittedAgo = bid.updatedAt
            ? formatDistanceToNow(new Date(bid.updatedAt), { addSuffix: true })
            : "";
          const agentMessage = (bid as BidResponse & { agentMessage?: string })
            .agentMessage;
          const isRowPending = pendingId === bid._id;

          return (
            <div
              key={bid._id}
              className="bg-[#fefefe] rounded-[6px] shadow-sm border border-[#e2e2e2] border-l-[3px] border-l-[#2563eb] p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-3">
                <Image
                  src={image}
                  alt={bid.product.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 object-cover rounded-[4px] shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-montserrat text-[13px] font-medium text-[#2b2b2b] truncate">
                        {bid.product.name}
                      </p>
                      <p className="font-montserrat text-[10.5px] text-[#808080] truncate">
                        {formatQuantityWithUnit(bid.quantity, bid.unit)} · {agentName}
                      </p>
                    </div>
                    {submittedAgo && (
                      <span className="font-montserrat text-[10px] text-[#808080] whitespace-nowrap">
                        {submittedAgo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap bg-[#f8f8f8] rounded-[4px] px-2.5 py-1.5">
                    <span className="font-montserrat text-[11px] text-[#808080] font-medium">
                      You:{" "}
                      <span className="text-[#2b2b2b] font-bold text-[14px]">
                        ₦{yourBid.toLocaleString()}
                      </span>
                    </span>
                    <span className="text-[#b0b0b0] text-[13px]">→</span>
                    <span className="font-montserrat text-[11px] text-[#808080] font-medium">
                      Counter:{" "}
                      <span className="text-[#004085] font-bold text-[14px]">
                        ₦{counterAmount.toLocaleString()}
                      </span>
                    </span>
                    <span
                      className={`font-montserrat text-[12px] font-bold ${delta.tone}`}
                    >
                      {delta.formatted}
                    </span>
                  </div>

                  {(bid.message || agentMessage) && (
                    <div className="flex flex-col gap-0.5">
                      {bid.message && (
                        <Clamped
                          text={bid.message}
                          speaker="You"
                          tone="text-[#808080]"
                        />
                      )}
                      {agentMessage && (
                        <Clamped
                          text={agentMessage}
                          speaker="Seller"
                          tone="text-[#004085]"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => updateBid({ id: bid._id, status: "accepted" })}
                  disabled={isRowPending}
                  className="flex-1 h-9 bg-[#538e53] hover:bg-[#3a6b3a] text-[#fefefe] font-montserrat text-[12.5px] font-semibold rounded-[4px] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setCounterBid(bid)}
                  disabled={isRowPending}
                  className="flex-1 h-9 border border-[#2563eb] text-[#2563eb] hover:bg-[#e8f0fe] font-montserrat text-[12.5px] font-semibold rounded-[4px] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Counter
                </button>
                <button
                  type="button"
                  onClick={() => updateBid({ id: bid._id, status: "rejected" })}
                  disabled={isRowPending}
                  className="flex-1 h-9 border border-[#d32f2f] text-[#d32f2f] hover:bg-[#fde8e8] font-montserrat text-[12.5px] font-semibold rounded-[4px] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || isFetching}
            className="px-3 py-1.5 text-[12px] font-montserrat text-[#2b2b2b] bg-[#fefefe] border border-[#e2e2e2] rounded-[4px] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            Previous
          </button>
          <span className="font-montserrat text-[12px] text-[#808080] px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isFetching}
            className="px-3 py-1.5 text-[12px] font-montserrat text-[#2b2b2b] bg-[#fefefe] border border-[#e2e2e2] rounded-[4px] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            Next
          </button>
        </div>
      )}

      {counterBid && (
        <CounterBackModal
          isOpen={!!counterBid}
          onClose={() => {
            resetMutation();
            setCounterBid(null);
          }}
          title={`Counter ${getAgentName(counterBid)}`}
          yourBid={counterBid.amount}
          theirCounter={
            (counterBid as BidResponse & { counterOffer?: number })
              .counterOffer ?? counterBid.product.price
          }
          isSubmitting={isPending && variables?.id === counterBid._id}
          apiError={
            mutationError &&
            variables?.id === counterBid._id &&
            variables?.status === "countered"
              ? getApiErrorMessage(mutationError)
              : null
          }
          onSubmit={({ amount, message }) => {
            resetMutation();
            updateBid(
              {
                id: counterBid._id,
                status: "countered",
                counterOffer: amount,
                message,
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
