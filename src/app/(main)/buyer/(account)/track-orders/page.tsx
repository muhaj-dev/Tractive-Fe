"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchIcon } from "@/icons/Icons";
import { XIcon } from "@/icons/Icon1";
import { OrderListCard } from "./_components/OrderListCard";
import { OrderTrackingMap } from "./_components/OrderTrackingMap";
import { ConfirmReceiptButton } from "./_components/ConfirmReceiptButton";
import { LeaveReviewButton } from "./_components/LeaveReviewButton";
import { TransporterInfoPanel } from "./_components/TransporterInfoPanel";
import { PackagesPanel } from "./_components/PackagesPanel";
import {
  OrderListSkeleton,
  TrackingDetailSkeleton,
} from "./_components/OrderListSkeleton";
import {
  isTrackableOrder,
  orderToTrackOrder,
  type TrackOrder,
  type TrackOrderStatus,
} from "./_components/trackOrdersData";
import { useOrders } from "@/hooks/queries/useOrderQueries";
import type { OrderRecord } from "@/services/OrderService";

type TabKey = "new" | "picked" | "on_transit" | "delivered";

const TABS: { key: TabKey; label: string; status: TrackOrderStatus }[] = [
  { key: "new", label: "New", status: "pending" },
  { key: "picked", label: "Picked", status: "picked" },
  { key: "on_transit", label: "On transit", status: "on_transit" },
  { key: "delivered", label: "Delivered", status: "delivered" },
];

export default function BuyerTrackOrdersPage() {
  const { data: ordersRaw, isLoading } = useOrders();
  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  // Mobile-only: when the user taps an order card, show details in a modal
  // instead of pushing the panel below the list.
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(false);

  const handleSelectOrder = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    new: null,
    picked: null,
    on_transit: null,
    delivered: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const active = tabRefs.current[activeTab];
      const container = tabsContainerRef.current;
      if (active && container) {
        const cRect = container.getBoundingClientRect();
        const tRect = active.getBoundingClientRect();
        setIndicatorStyle({ left: tRect.left - cRect.left, width: tRect.width });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab]);

  // Paid, delivered or receipt-confirmed orders with a known trip status. A
  // cancelled trip or an unknown status stays off the page rather than showing
  // up on New. Unpaid orders have their own list on My Orders.
  const trackOrders: TrackOrder[] = useMemo(() => {
    if (!Array.isArray(ordersRaw)) return [];
    return ordersRaw
      .filter((o) => isTrackableOrder(o as OrderRecord))
      .map(orderToTrackOrder)
      .filter((o) => !!o.id);
  }, [ordersRaw]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      new: 0,
      picked: 0,
      on_transit: 0,
      delivered: 0,
    };
    for (const o of trackOrders) {
      const tab = TABS.find((t) => t.status === o.status);
      if (tab) counts[tab.key]++;
    }
    return counts;
  }, [trackOrders]);

  const filteredOrders = useMemo(() => {
    const targetStatus = TABS.find((t) => t.key === activeTab)!.status;
    const q = searchQuery.toLowerCase();
    return trackOrders
      .filter((o) => o.status === targetStatus)
      .filter((o) => {
        if (!q) return true;
        return [
          o.id,
          o.transporter.name,
          o.transporter.company,
          o.fleet.name,
          o.fleet.iot,
          o.product.name,
          o.product.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [trackOrders, activeTab, searchQuery]);

  useEffect(() => {
    if (filteredOrders.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    const stillVisible = filteredOrders.some((o) => o.id === selectedId);
    if (!stillVisible) setSelectedId(filteredOrders[0].id);
  }, [filteredOrders, selectedId]);

  // Lock body scroll while the mobile modal is open
  useEffect(() => {
    if (!mobileDetailOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDetailOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileDetailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDetailOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileDetailOpen]);

  const selectedOrder = useMemo(
    () => trackOrders.find((o) => o.id === selectedId) ?? null,
    [trackOrders, selectedId],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col gap-3 bg-[#fefefe] rounded-[10px] p-4 shadow-sm">
        <h1 className="font-montserrat font-medium text-[16px] sm:text-[18px] text-[#2b2b2b] text-center">
          Order Tracking
        </h1>

        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search for chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#e2e2e2] rounded-[6px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53] placeholder:text-[#808080] placeholder:text-[12px] font-montserrat"
            aria-label="Search orders"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon stroke="#808080" className="w-4 h-4" />
          </div>
        </div>

        <div
          ref={tabsContainerRef}
          className="relative flex items-center gap-5 border-b border-[#e2e2e2]"
          role="tablist"
          aria-label="Track orders tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 py-2 font-montserrat text-[13px] font-medium cursor-pointer ${
                  isActive ? "text-[#538e53]" : "text-[#2b2b2b]"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] font-montserrat font-medium rounded-[4px] px-[5px] py-[1px] min-w-[18px] flex items-center justify-center ${
                    isActive
                      ? "bg-[#538e53] text-[#fefefe]"
                      : "bg-[#f1f1f1] text-[#2b2b2b]"
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
          <motion.div
            className="absolute -bottom-[1px] h-[3px] rounded-t-[4px] bg-[#538e53]"
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
          {isLoading ? (
            <OrderListSkeleton cards={3} />
          ) : filteredOrders.length === 0 ? (
            <div className="py-10 text-center font-montserrat text-sm text-[#808080]">
              No orders in this status.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderListCard
                key={order.id}
                order={order}
                selected={order.id === selectedOrder?.id}
                onSelect={handleSelectOrder}
              />
            ))
          )}
        </div>
      </div>

      {/* Desktop: side-by-side details panel. Hidden below lg, where the modal takes over. */}
      <div className="hidden lg:flex flex-col gap-4">
        {isLoading ? (
          <TrackingDetailSkeleton />
        ) : selectedOrder ? (
          <>
            <OrderTrackingMap order={selectedOrder} />
            {selectedOrder.status === "delivered" && (
              <ConfirmReceiptButton
                orderId={selectedOrder.id}
                alreadyConfirmed={selectedOrder.receiptConfirmed}
              />
            )}
            {selectedOrder.status === "delivered" && selectedOrder.agentId && (
              <LeaveReviewButton
                key={selectedOrder.id}
                agentId={selectedOrder.agentId}
                agentName={selectedOrder.agentName}
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TransporterInfoPanel order={selectedOrder} />
              <PackagesPanel order={selectedOrder} />
            </div>
          </>
        ) : (
          <div className="bg-[#fefefe] rounded-[10px] p-10 text-center font-montserrat text-sm text-[#808080] shadow-sm">
            Select an order to view tracking details.
          </div>
        )}
      </div>

      {/* Mobile/tablet: tracking detail in a modal so it doesn't push the list down. */}
      <AnimatePresence>
        {mobileDetailOpen && selectedOrder && (
          <motion.div
            key="track-order-mobile-modal"
            className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Order tracking details"
          >
            <button
              type="button"
              aria-label="Close tracking details"
              onClick={() => setMobileDetailOpen(false)}
              className="absolute inset-0 bg-black/50 cursor-pointer"
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full sm:w-[90%] sm:max-w-140 max-h-[90vh] overflow-y-auto bg-[#f7f7f7] rounded-t-2xl sm:rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-montserrat font-medium text-[14px] text-[#2b2b2b]">
                  Tracking details
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-[#fefefe] shadow flex items-center justify-center cursor-pointer hover:bg-[#f1f1f1]"
                >
                  <XIcon />
                </button>
              </div>
              <OrderTrackingMap order={selectedOrder} />
              {selectedOrder.status === "delivered" && (
                <ConfirmReceiptButton
                  orderId={selectedOrder.id}
                  alreadyConfirmed={selectedOrder.receiptConfirmed}
                />
              )}
              {selectedOrder.status === "delivered" &&
                selectedOrder.agentId && (
                  <LeaveReviewButton
                    key={selectedOrder.id}
                    agentId={selectedOrder.agentId}
                    agentName={selectedOrder.agentName}
                  />
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TransporterInfoPanel order={selectedOrder} />
                <PackagesPanel order={selectedOrder} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
