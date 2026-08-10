"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { useUnpaidOrders, orderKeys } from "@/hooks/queries/useOrderQueries";
import {
  OrderRecord,
  isOrderAwaitingApproval,
} from "@/services/OrderService";
import { OrderPaymentModal } from "../../my-biddings/_components/OrderPaymentModal";

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full" />
  </div>
);

const orderRef = (o: OrderRecord) => {
  const id = o._id || o.id || "";
  return id ? `#${id.slice(-8).toUpperCase()}` : "—";
};

const firstProductName = (o: OrderRecord): string => {
  const line = o.products?.[0];
  const p = line?.product;
  const name = p && typeof p === "object" ? p.name : undefined;
  const extra = (o.products?.length ?? 0) - 1;
  return `${name || "Order"}${extra > 0 ? ` +${extra} more` : ""}`;
};

const firstProductImage = (o: OrderRecord): string => {
  const p = o.products?.[0]?.product;
  const img = p && typeof p === "object" ? p.images?.[0] : undefined;
  return img || "/images/noData.png";
};

const formatDate = (raw?: string) => {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Orders the buyer created but never paid for.
 *
 * Without this list such an order is unreachable: it is not `paid`, so it never
 * appears under Awaiting Transport, and the payment modal used to exist only in
 * the moment right after checkout. Closing that modal stranded the order for good.
 */
export const PendingPaymentList: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useUnpaidOrders();
  const [paying, setPaying] = useState<OrderRecord | null>(null);

  const orders: OrderRecord[] = Array.isArray(data) ? data : [];

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="bg-[#fefefe] rounded-[8px] py-14 px-6 text-center">
        <p className="font-montserrat text-[13px] text-[#2b2b2b] mb-3">
          Couldn&apos;t load your pending payments.
        </p>
        <Button
          text="Try again"
          onClick={() => refetch()}
          className="!py-[6px] !px-4 !rounded-[4px] text-[12px] cursor-pointer mx-auto"
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-[#fefefe] rounded-[8px] py-14 px-6 text-center">
        <p className="font-montserrat font-medium text-[14px] text-[#2b2b2b]">
          Nothing awaiting payment
        </p>
        <p className="font-montserrat text-[12px] text-[#808080] mt-1 mb-4">
          Orders you create but haven&apos;t paid for will show up here.
        </p>
        <Button
          text="Browse sellers"
          onClick={() => router.push("/buyer/sellers-list")}
          className="!py-[6px] !px-4 !rounded-[4px] text-[12px] cursor-pointer mx-auto"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {orders.map((o) => {
          const awaitingApproval = isOrderAwaitingApproval(o);
          return (
            <div
              key={o._id || o.id}
              className="bg-[#fefefe] rounded-[8px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
            >
              <Image
                src={firstProductImage(o)}
                alt={firstProductName(o)}
                width={64}
                height={48}
                className="w-14 h-11 sm:w-16 sm:h-12 rounded-[4px] object-cover shrink-0"
              />

              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-montserrat font-medium text-[13px] text-[#2b2b2b] truncate">
                  {firstProductName(o)}
                </span>
                <span className="font-montserrat text-[11px] text-[#808080]">
                  Ordered: {formatDate(o.createdAt)} · Order {orderRef(o)}
                </span>
                <span
                  className={`font-montserrat text-[11px] mt-0.5 ${
                    awaitingApproval ? "text-[#b8860b]" : "text-[#c0392b]"
                  }`}
                >
                  {awaitingApproval
                    ? "Transfer submitted — awaiting confirmation"
                    : "Payment not completed"}
                </span>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="font-montserrat font-semibold text-[13px] text-[#2b2b2b]">
                  ₦{(o.totalAmount ?? 0).toLocaleString()}
                </span>
                {!awaitingApproval && (
                  <Button
                    text="Complete payment"
                    onClick={() => setPaying(o)}
                    className="!py-[6px] !px-3 !rounded-[4px] text-[12px] cursor-pointer whitespace-nowrap"
                  />
                )}
              </div>
            </div>
          );
        })}
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
    </>
  );
};
