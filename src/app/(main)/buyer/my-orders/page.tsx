"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  useTransportReadyOrders,
  usePaidShippingOrders,
  useUnpaidOrders,
} from "@/hooks/queries/useOrderQueries";
import { OrderRecord } from "@/services/OrderService";
import { AwaitingTransportList } from "./_components/AwaitingTransportList";
import { ShippingList } from "./_components/ShippingList";
import { PendingPaymentList } from "./_components/PendingPaymentList";

type TabKey = "pending" | "awaiting" | "shipping";

const Page: React.FC = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam === "shipping"
      ? "shipping"
      : tabParam === "pending"
        ? "pending"
        : "awaiting"
  );
  const [borderStyle, setBorderStyle] = useState<{ width: number; left: number }>({
    width: 0,
    left: 0,
  });
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    pending: null,
    awaiting: null,
    shipping: null,
  });

  const { data: unpaid } = useUnpaidOrders();
  const { data: awaiting } = useTransportReadyOrders();
  const { data: shipping } = usePaidShippingOrders();

  const extractList = (raw: unknown): OrderRecord[] => {
    if (Array.isArray(raw)) return raw as OrderRecord[];
    return (raw as { data?: OrderRecord[] } | null)?.data ?? [];
  };

  const unpaidCount = useMemo(() => extractList(unpaid).length, [unpaid]);
  const awaitingCount = useMemo(
    () => extractList(awaiting).length,
    [awaiting]
  );
  const shippingCount = useMemo(
    () => extractList(shipping).length,
    [shipping]
  );

  useEffect(() => {
    const ref = tabRefs.current[activeTab];
    if (ref) {
      setBorderStyle({ width: ref.offsetWidth, left: ref.offsetLeft });
    }
  }, [activeTab, unpaidCount, awaitingCount, shippingCount]);

  return (
    <div className="w-full bg-[#f1f1f1] min-h-screen">
      <div className="w-[90%] max-w-[1100px] mx-auto py-6">
        <div className="mb-5">
          <h1 className="font-montserrat font-semibold text-[18px] sm:text-[20px] text-[#2b2b2b]">
            My Orders
          </h1>
          <p className="font-montserrat text-[12px] text-[#808080] mt-1">
            Track what you&apos;ve paid for and what&apos;s on the way.
          </p>
        </div>

        <div className="relative flex flex-col gap-2">
          <div className="flex relative gap-8">
            <button
              type="button"
              ref={(el) => {
                tabRefs.current.pending = el;
              }}
              onClick={() => setActiveTab("pending")}
              className={`py-2 flex items-center gap-[6px] text-sm font-normal cursor-pointer ${
                activeTab === "pending" ? "text-[#538e53]" : "text-[#2b2b2b]"
              }`}
            >
              Pending Payment
              <span className="text-[#fefefe] bg-[#538e53] px-[5px] py-[1px] text-[9px] rounded-[3px] min-w-[16px] flex items-center justify-center">
                {unpaidCount}
              </span>
            </button>
            <button
              type="button"
              ref={(el) => {
                tabRefs.current.awaiting = el;
              }}
              onClick={() => setActiveTab("awaiting")}
              className={`py-2 flex items-center gap-[6px] text-sm font-normal cursor-pointer ${
                activeTab === "awaiting" ? "text-[#538e53]" : "text-[#2b2b2b]"
              }`}
            >
              Awaiting Transport
              <span className="text-[#fefefe] bg-[#538e53] px-[5px] py-[1px] text-[9px] rounded-[3px] min-w-[16px] flex items-center justify-center">
                {awaitingCount}
              </span>
            </button>
            <button
              type="button"
              ref={(el) => {
                tabRefs.current.shipping = el;
              }}
              onClick={() => setActiveTab("shipping")}
              className={`py-2 flex items-center gap-[6px] text-sm font-normal cursor-pointer ${
                activeTab === "shipping" ? "text-[#538e53]" : "text-[#2b2b2b]"
              }`}
            >
              Shipping &amp; Delivered
              <span className="text-[#fefefe] bg-[#538e53] px-[5px] py-[1px] text-[9px] rounded-[3px] min-w-[16px] flex items-center justify-center">
                {shippingCount}
              </span>
            </button>
            <motion.div
              className="absolute -bottom-[1px] rounded-t-[5px] h-[3px] bg-[#538e53]"
              animate={{ width: borderStyle.width, left: borderStyle.left }}
              transition={{ type: "tween", duration: 0.25 }}
            />
          </div>
          <span className="w-full h-[1px] bg-[#d2d2d2]" />
        </div>

        <div className="mt-6">
          {activeTab === "pending" ? (
            <PendingPaymentList />
          ) : activeTab === "awaiting" ? (
            <AwaitingTransportList />
          ) : (
            <ShippingList />
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
