"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import {
  useTransportReadyOrders,
  usePaidShippingOrders,
  useUnpaidOrders,
  orderKeys,
} from "@/hooks/queries/useOrderQueries";
import type { OrderRecord } from "@/services/OrderService";
import { OrdersTable } from "./_components/OrdersTable";
import { OrderDetailsModal } from "./_components/OrderDetailsModal";
import { toRows, type BuyerOrderRow } from "./_components/ordersData";
import { OrderPaymentModal } from "../../my-biddings/_components/OrderPaymentModal";

type TabKey = "pending" | "awaiting" | "shipping";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending Payment" },
  { key: "awaiting", label: "Awaiting Transport" },
  { key: "shipping", label: "Shipping & Delivered" },
];

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full" />
  </div>
);

const Page: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam === "shipping"
      ? "shipping"
      : tabParam === "pending"
        ? "pending"
        : "awaiting",
  );
  const [paying, setPaying] = useState<OrderRecord | null>(null);
  const [details, setDetails] = useState<OrderRecord | null>(null);

  const unpaid = useUnpaidOrders();
  const awaiting = useTransportReadyOrders();
  const shipping = usePaidShippingOrders();

  const rows = useMemo(
    () => ({
      pending: toRows(unpaid.data),
      awaiting: toRows(awaiting.data),
      shipping: toRows(shipping.data),
    }),
    [unpaid.data, awaiting.data, shipping.data],
  );

  const activeQuery =
    activeTab === "pending" ? unpaid : activeTab === "awaiting" ? awaiting : shipping;

  // Smart default: with no `?tab=` in the URL, open where the buyer most needs
  // to act rather than on a fixed tab — landing on an empty "Awaiting
  // Transport" while five orders sit unpaid reads as "I have no orders".
  const [autoPicked, setAutoPicked] = useState<boolean>(Boolean(tabParam));
  const stillLoading =
    unpaid.isLoading || awaiting.isLoading || shipping.isLoading;
  useEffect(() => {
    if (autoPicked || stillLoading) return;
    if (rows.pending.length) setActiveTab("pending");
    else if (rows.awaiting.length) setActiveTab("awaiting");
    else if (rows.shipping.length) setActiveTab("shipping");
    setAutoPicked(true);
  }, [autoPicked, stillLoading, rows]);

  // Sliding underline, kept from the previous card layout.
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    pending: null,
    awaiting: null,
    shipping: null,
  });
  const [borderStyle, setBorderStyle] = useState<{ width: number; left: number }>({
    width: 0,
    left: 0,
  });
  useEffect(() => {
    const update = () => {
      const ref = tabRefs.current[activeTab];
      if (ref) setBorderStyle({ width: ref.offsetWidth, left: ref.offsetLeft });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab, rows]);

  const empty: Record<TabKey, { title: string; hint: string; action?: React.ReactNode }> = {
    pending: {
      title: "Nothing awaiting payment",
      hint: "Orders you create but haven't paid for will show up here.",
      action: (
        <Button
          text="Browse sellers"
          onClick={() => router.push("/buyer/sellers-list")}
          className="!py-[6px] !px-4 !rounded-[4px] text-[12px] cursor-pointer mx-auto"
        />
      ),
    },
    awaiting: {
      title: "No orders waiting for transport",
      hint: "After you pay for a product, it will appear here until you book a transporter.",
      action: (
        <Button
          text="Browse sellers"
          onClick={() => router.push("/buyer/sellers-list")}
          className="!py-[6px] !px-4 !rounded-[4px] text-[12px] cursor-pointer mx-auto"
        />
      ),
    },
    shipping: {
      title: "Nothing shipping yet",
      hint: "Orders being delivered, and those already delivered, appear here.",
    },
  };

  return (
    <div className="w-full">
      <div className="mb-5">
        <h1 className="font-montserrat font-semibold text-[18px] sm:text-[20px] text-[#2b2b2b]">
          My Orders
        </h1>
        <p className="font-montserrat text-[12px] text-[#808080] mt-1">
          Track what you&apos;ve paid for and what&apos;s on the way.
        </p>
      </div>

      <div className="bg-[#fefefe] rounded-[10px] shadow-sm p-3 sm:p-4">
        <div className="relative flex flex-col gap-2">
          <div className="relative flex items-center gap-4 sm:gap-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2 font-montserrat text-[13px] sm:text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "text-[#538e53] font-medium"
                    : "text-[#2b2b2b] hover:text-[#538e53]"
                }`}
              >
                {tab.label}
                <span className="ml-2 font-montserrat text-[11px] text-[#808080]">
                  {rows[tab.key].length}
                </span>
              </button>
            ))}
            <motion.div
              className="absolute -bottom-[1px] rounded-t-[5px] h-[3px] bg-[#538e53]"
              animate={{ width: borderStyle.width, left: borderStyle.left }}
              transition={{ type: "tween", duration: 0.25 }}
            />
          </div>
          <span className="w-full h-[1px] bg-[#d2d2d2]" />
        </div>

        <div className="mt-5">
          {activeQuery.isLoading ? (
            <Spinner />
          ) : activeQuery.isError ? (
            <div className="bg-[#fefefe] rounded-[8px] py-14 px-6 text-center">
              <p className="font-montserrat text-[13px] text-[#2b2b2b] mb-3">
                Couldn&apos;t load your orders.
              </p>
              <Button
                text="Try again"
                onClick={() => activeQuery.refetch()}
                className="!py-[6px] !px-4 !rounded-[4px] text-[12px] cursor-pointer mx-auto"
              />
            </div>
          ) : (
            <OrdersTable
              rows={rows[activeTab]}
              emptyTitle={empty[activeTab].title}
              emptyHint={empty[activeTab].hint}
              emptyAction={empty[activeTab].action}
              onPay={(row: BuyerOrderRow) => setPaying(row.record)}
              onOpen={(row: BuyerOrderRow) => setDetails(row.record)}
            />
          )}
        </div>
      </div>

      <OrderPaymentModal
        orderId={paying?._id || paying?.id || ""}
        totalAmount={paying?.totalAmount ?? 0}
        isOpen={!!paying}
        onClose={() => setPaying(null)}
        onPaid={() => {
          setPaying(null);
          queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
        }}
      />

      {details ? (
        <OrderDetailsModal order={details} onClose={() => setDetails(null)} />
      ) : null}
    </div>
  );
};

export default Page;
