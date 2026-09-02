"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderRecord } from "@/services/OrderService";
import { formatUnitAfterQuantity } from "@/utils/productUnits";
import { useAppDispatch } from "@/lib/hooks";
import { setPendingTransportOrderIds } from "@/lib/features/pendingTransport/pendingTransportSlice";

interface OrderCardProps {
  order: OrderRecord;
  variant: "awaiting-transport" | "shipping";
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: (orderId: string) => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const getPreview = (order: OrderRecord) => {
  const first = order.products?.[0];
  const product = first?.product;
  const isObj = product && typeof product === "object";
  const name = isObj ? product.name : undefined;
  const image =
    (isObj && product.images && product.images[0]) || "/images/placeholder.png";
  const itemCount = order.products?.length ?? 0;
  const extraItems = itemCount > 1 ? itemCount - 1 : 0;
  return {
    title: name || "Order",
    image,
    extraItems,
    unit: isObj ? product.unit : undefined,
    quantity: first?.quantity,
  };
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  variant,
  selectable,
  selected,
  onToggleSelected,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const orderId = order._id || order.id || "";
  const { title, image, extraItems, unit, quantity } = getPreview(order);

  const handleBookTransport = () => {
    dispatch(setPendingTransportOrderIds([orderId]));
    router.push(`/buyer/transporter-list?orderIds=${orderId}`);
  };

  const handleClick = () => {
    if (selectable) {
      onToggleSelected?.(orderId);
      return;
    }
    if (variant === "shipping") {
      router.push("/buyer/track-orders");
    }
  };

  const isClickable = selectable || variant === "shipping";

  return (
    <div
      className={`flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-[#fefefe] rounded-[5px] border transition-shadow ${
        selected
          ? "border-[#538e53] shadow-[0_0_0_1px_#538e53]"
          : "border-[#e2e2e2] hover:shadow-md"
      } ${isClickable ? "cursor-pointer" : ""}`}
      onClick={handleClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) handleClick();
      }}
    >
      {selectable && (
        <div className="flex sm:items-start pt-1">
          <span
            className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-[4px] border transition-colors ${
              selected
                ? "bg-[#538e53] border-[#538e53]"
                : "bg-[#fefefe] border-[#b8becd]"
            }`}
            aria-hidden="true"
          >
            {selected && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5l2.5 2.5L9 2"
                  stroke="#fefefe"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </div>
      )}

      <div className="relative w-full sm:w-[96px] h-[96px] sm:h-[96px] flex-shrink-0 rounded-[5px] overflow-hidden bg-[#f1f1f1]">
        <Image
          src={image}
          alt={title}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-montserrat font-medium text-[14px] text-[#2b2b2b] truncate">
            {title}
            {extraItems > 0 && (
              <span className="text-[#808080] font-normal ml-1">
                +{extraItems} more
              </span>
            )}
          </p>
          {variant === "shipping" && (
            <StatusBadge status={order.transportStatus || "not_moved"} />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-montserrat text-[#808080]">
          {quantity !== undefined && (
            <span>
              Qty: {quantity}
              {unit ? ` ${formatUnitAfterQuantity(unit)}` : ""}
            </span>
          )}
          <span>Ordered: {formatDate(order.createdAt)}</span>
          <span className="text-[#2b2b2b] font-medium">
            ₦{(order.totalAmount ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-montserrat text-[11px] text-[#808080] truncate">
            Order #{orderId ? orderId.slice(-8).toUpperCase() : "—"}
          </span>

          {variant === "awaiting-transport" ? (
            !selectable && (
              <span onClick={(e) => e.stopPropagation()}>
                <Button
                  text="Book Transport"
                  onClick={handleBookTransport}
                  className="!py-[6px] !px-3 !rounded-[4px] text-[12px]"
                />
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/buyer/track-orders");
              }}
              className="font-montserrat text-[12px] text-[#538e53] hover:underline cursor-pointer"
            >
              View details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
