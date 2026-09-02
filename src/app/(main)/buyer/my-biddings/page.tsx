// page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MyBids } from "./_components/MyBids";
import { BidsCheckout } from "./_components/BidsCheckout";
import { MyFleetBids } from "./_components/MyFleetBids";
import { CounteredProductBids } from "./_components/CounteredProductBids";
import { PendingProductBids } from "./_components/PendingProductBids";
import { RejectedProductBids } from "./_components/RejectedProductBids";
import {
  useCounteredBids,
  usePendingBids,
  useRejectedBids,
  useWonBidsCheckout,
} from "@/hooks/queries/useBidQueries";
import { BidResponse } from "@/services/bidService";
import { getAgentName } from "./_components/bidHelpers";

type TopTab = "product-bids" | "fleet-bids";
type ProductSubTab = "countered" | "pending" | "ready" | "rejected";

interface BidItem {
  id: string;
  title: string;
  quantity: string;
  seller: string;
  price: number;
  imageSrc: string;
}

const Page: React.FC = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const subTabParam = searchParams.get("sub") as ProductSubTab | null;

  const [activeTab, setActiveTab] = useState<TopTab>(
    tabParam === "fleet-bids" ? "fleet-bids" : "product-bids",
  );
  const [subTab, setSubTab] = useState<ProductSubTab | null>(
    subTabParam &&
      ["countered", "pending", "ready", "rejected"].includes(subTabParam)
      ? subTabParam
      : null,
  );

  const PAGE_LIMIT = 10;
  const [counteredPage, setCounteredPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const {
    data: counteredData,
    isLoading: isLoadingCountered,
    isFetching: isFetchingCountered,
    refetch: refetchCountered,
  } = useCounteredBids(counteredPage, PAGE_LIMIT);
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    isFetching: isFetchingPending,
    refetch: refetchPending,
  } = usePendingBids(pendingPage, PAGE_LIMIT);
  const {
    data: rejectedData,
    isLoading: isLoadingRejected,
    isFetching: isFetchingRejected,
    refetch: refetchRejected,
  } = useRejectedBids(rejectedPage, PAGE_LIMIT);
  const {
    data: checkoutData,
    isLoading: isLoadingCheckout,
    isFetching,
    refetch: refetchCheckout,
  } = useWonBidsCheckout();

  const counteredBids = useMemo(
    () => counteredData?.bids ?? [],
    [counteredData],
  );
  const pendingBids = useMemo(() => pendingData?.bids ?? [], [pendingData]);
  const rejectedBids = useMemo(() => rejectedData?.bids ?? [], [rejectedData]);
  const counteredTotal = counteredData?.pagination.total ?? 0;
  const pendingTotal = pendingData?.pagination.total ?? 0;
  const rejectedTotal = rejectedData?.pagination.total ?? 0;

  const isRefetching = isFetching && !isLoadingCheckout;
  const isAnyRefetching =
    isFetchingCountered ||
    isFetchingPending ||
    isFetchingRejected ||
    isFetching;

  const handleRefreshAll = () => {
    refetchCountered();
    refetchPending();
    refetchRejected();
    refetchCheckout();
  };
  const wonBids = useMemo(() => checkoutData?.bids || [], [checkoutData?.bids]);

  const bidItems: BidItem[] = useMemo(
    () =>
      wonBids.map((item: BidResponse) => ({
        id: item._id,
        title: item.product.name,
        quantity: `${item.quantity} ${item.unit}`,
        seller: getAgentName(item),
        price: item.amount,
        imageSrc: item.product.images[0] || "/images/placeholder.png",
      })),
    [wonBids],
  );

  const isAnyLoading =
    isLoadingCountered ||
    isLoadingPending ||
    isLoadingRejected ||
    isLoadingCheckout;

  // Smart default: if URL didn't pick, go where the user most needs to act.
  useEffect(() => {
    if (subTab !== null || isAnyLoading) return;
    if (counteredTotal > 0) setSubTab("countered");
    else if (wonBids.length > 0) setSubTab("ready");
    else if (pendingTotal > 0) setSubTab("pending");
    else setSubTab("ready");
  }, [
    subTab,
    isAnyLoading,
    counteredTotal,
    wonBids.length,
    pendingTotal,
  ]);

  const [selection, setSelection] = useState<{
    isCheckoutAll: boolean;
    selectedBids: string[];
  }>({ isCheckoutAll: false, selectedBids: [] });

  const handleSelectionChange = (
    isCheckoutAll: boolean,
    selectedBids: string[],
  ) => {
    setSelection({ isCheckoutAll, selectedBids });
  };

  const handleTransactionSuccess = () => {
    setSelection({ isCheckoutAll: false, selectedBids: [] });
  };

  const selectedBidIds = useMemo(
    () =>
      selection.isCheckoutAll
        ? bidItems.map((item) => item.id)
        : selection.selectedBids,
    [selection, bidItems],
  );

  // `won/checkout` returns the totals for the WHOLE basket. Checking out a
  // subset used to send those whole-basket totals alongside only the selected
  // bidIds, and POST /api/orders rejected it with "Total amount does not match
  // accepted bids" — so any partial checkout was impossible. Re-derive the
  // summary from the selection, the same way the backend composes it:
  // sum of effective (counter-aware) amounts, plus local transport where the
  // product charges it.
  const selectedTotals = useMemo(() => {
    const chosen = wonBids.filter((bid: BidResponse) =>
      selectedBidIds.includes(bid._id),
    );
    const productsSubtotal = chosen.reduce(
      (sum: number, bid: BidResponse) => sum + (bid.effectiveAmount ?? bid.amount),
      0,
    );
    const localTransportTotal = chosen.reduce((sum: number, bid: BidResponse) => {
      const lt = bid.product.localTransport;
      return sum + (lt?.required ? lt.fee || 0 : 0);
    }, 0);
    return {
      productsSubtotal,
      localTransportTotal,
      totalAmount: productsSubtotal + localTransportTotal,
    };
  }, [wonBids, selectedBidIds]);

  const pills: Array<{ id: ProductSubTab; label: string; count: number }> = [
    { id: "countered", label: "Needs response", count: counteredTotal },
    { id: "pending", label: "Waiting", count: pendingTotal },
    { id: "ready", label: "Ready to checkout", count: wonBids.length },
    { id: "rejected", label: "Rejected", count: rejectedTotal },
  ];

  const activeSub = subTab ?? "ready";

  const pillTone = (id: ProductSubTab, count: number, isActive: boolean) => {
    if (isActive) return "bg-[#538e53] text-[#fefefe] border-[#538e53]";
    if (id === "countered" && count > 0) {
      return "bg-[#e8f0fe] text-[#2563eb] border-[#bcd4fe] hover:bg-[#d9e5fd]";
    }
    if (id === "ready" && count > 0) {
      return "bg-[#eaf6ea] text-[#2a6b2a] border-[#c7e1c7] hover:bg-[#ddefdd]";
    }
    return "bg-[#fefefe] text-[#2b2b2b] border-[#e2e2e2] hover:bg-[#f5f5f5]";
  };

  return (
    <div className="w-full bg-[#f1f1f1] min-h-screen flex justify-center">
      <div className="flex flex-col w-[90%] max-w-[1200px] mx-auto pb-10">
        {/* Primary tabs */}
        <div className="flex items-center gap-0 mt-6 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("product-bids")}
            className={`px-5 py-2.5 font-montserrat text-[13px] sm:text-[14px] font-medium rounded-tl-[6px] rounded-bl-[6px] border transition-colors cursor-pointer ${
              activeTab === "product-bids"
                ? "bg-[#538e53] text-[#fefefe] border-[#538e53]"
                : "bg-[#fefefe] text-[#2b2b2b] border-[#e2e2e2] hover:bg-[#f5f5f5]"
            }`}
          >
            Product Bids
            {counteredTotal > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] bg-[#2563eb] text-white rounded-full">
                {counteredTotal}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fleet-bids")}
            className={`px-5 py-2.5 font-montserrat text-[13px] sm:text-[14px] font-medium rounded-tr-[6px] rounded-br-[6px] border border-l-0 transition-colors cursor-pointer ${
              activeTab === "fleet-bids"
                ? "bg-[#538e53] text-[#fefefe] border-[#538e53]"
                : "bg-[#fefefe] text-[#2b2b2b] border-[#e2e2e2] hover:bg-[#f5f5f5]"
            }`}
          >
            Fleet Bids
          </button>
        </div>

        {activeTab === "product-bids" ? (
          isAnyLoading && subTab === null ? (
            <div className="w-full flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Sub-tab pills */}
              <div className="flex items-center gap-2 flex-wrap mb-4 sticky top-0 bg-[#f1f1f1] py-2 z-10">
                {pills.map((pill) => {
                  const isActive = activeSub === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setSubTab(pill.id)}
                      className={`font-montserrat text-[12px] px-3 py-1.5 rounded-full border transition cursor-pointer ${pillTone(
                        pill.id,
                        pill.count,
                        isActive,
                      )}`}
                    >
                      {pill.label}
                      <span
                        className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] rounded-full ${
                          isActive
                            ? "bg-white/25 text-white"
                            : pill.id === "countered" && pill.count > 0
                              ? "bg-[#2563eb] text-white"
                              : pill.id === "ready" && pill.count > 0
                                ? "bg-[#538e53] text-white"
                                : "bg-[#f1f1f1] text-[#808080]"
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleRefreshAll}
                  disabled={isAnyRefetching}
                  aria-label="Refresh bids"
                  title="Refresh bids"
                  className="ml-auto inline-flex items-center gap-1.5 font-montserrat text-[12px] px-3 py-1.5 rounded-full border border-[#e2e2e2] bg-[#fefefe] text-[#2b2b2b] hover:bg-[#f5f5f5] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 ${isAnyRefetching ? "animate-spin" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v6h6M20 20v-6h-6M20 10a8 8 0 10-2.34 5.66L20 14"
                    />
                  </svg>
                  {isAnyRefetching ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {/* Cross-tab nudges */}
              {activeSub !== "countered" && counteredTotal > 0 && (
                <button
                  type="button"
                  onClick={() => setSubTab("countered")}
                  className="flex items-center justify-between bg-[#e8f0fe] border border-[#bcd4fe] rounded-[6px] px-3 py-2 mb-3 cursor-pointer hover:bg-[#d9e5fd] transition"
                >
                  <span className="font-montserrat text-[12px] text-[#004085]">
                    <span className="font-semibold">{counteredTotal}</span>{" "}
                    counter{counteredTotal > 1 ? "s" : ""} need your
                    response.
                  </span>
                  <span className="font-montserrat text-[12px] text-[#2563eb] font-medium">
                    Review →
                  </span>
                </button>
              )}
              {activeSub !== "ready" && wonBids.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSubTab("ready")}
                  className="flex items-center justify-between bg-[#eaf6ea] border border-[#c7e1c7] rounded-[6px] px-3 py-2 mb-3 cursor-pointer hover:bg-[#ddefdd] transition"
                >
                  <span className="font-montserrat text-[12px] text-[#2a6b2a]">
                    <span className="font-semibold">{wonBids.length}</span> bid
                    {wonBids.length > 1 ? "s" : ""} ready to checkout.
                  </span>
                  <span className="font-montserrat text-[12px] text-[#538e53] font-medium">
                    Checkout →
                  </span>
                </button>
              )}

              {/* Scoped content */}
              <div className="flex flex-col">
                {activeSub === "countered" && (
                  <CounteredProductBids
                    bids={counteredBids}
                    page={counteredPage}
                    limit={PAGE_LIMIT}
                    total={counteredTotal}
                    onPageChange={setCounteredPage}
                    isFetching={isFetchingCountered}
                  />
                )}
                {activeSub === "pending" && (
                  <PendingProductBids
                    bids={pendingBids}
                    page={pendingPage}
                    limit={PAGE_LIMIT}
                    total={pendingTotal}
                    onPageChange={setPendingPage}
                    isFetching={isFetchingPending}
                  />
                )}
                {activeSub === "rejected" && (
                  <RejectedProductBids
                    bids={rejectedBids}
                    page={rejectedPage}
                    limit={PAGE_LIMIT}
                    total={rejectedTotal}
                    onPageChange={setRejectedPage}
                    isFetching={isFetchingRejected}
                  />
                )}
                {activeSub === "ready" && (
                  <div className="flex flex-col md:flex-row gap-6">
                    <MyBids
                      bidItems={bidItems}
                      selection={selection}
                      setSelection={handleSelectionChange}
                      isRefetching={isRefetching}
                    />
                    <BidsCheckout
                      productsSubtotal={selectedTotals.productsSubtotal}
                      localTransportTotal={selectedTotals.localTransportTotal}
                      totalAmount={selectedTotals.totalAmount}
                      hasSelection={
                        selection.isCheckoutAll ||
                        selection.selectedBids.length > 0
                      }
                      selectedBidIds={selectedBidIds}
                      checkoutData={wonBids}
                      onTransactionSuccess={handleTransactionSuccess}
                    />
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          <MyFleetBids />
        )}
      </div>
    </div>
  );
};

export default Page;
