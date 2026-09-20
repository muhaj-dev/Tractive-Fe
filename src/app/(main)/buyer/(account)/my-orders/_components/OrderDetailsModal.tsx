"use client";
import React from "react";
import Image from "next/image";
import { XIcon } from "@/icons/Icon1";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderRecord } from "@/services/OrderService";
import { formatUnitAfterQuantity } from "@/utils/productUnits";

interface Props {
  order: OrderRecord | null;
  onClose: () => void;
}

const STEPS: { key: string; label: string; description: string }[] = [
  {
    key: "not_moved",
    label: "Fleet Not Moved",
    description: "Transporter has been booked. Awaiting pickup.",
  },
  {
    key: "in_transit",
    label: "In Transit",
    description: "Your order is on the way.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
];

const normalize = (s?: string) => (s || "").toLowerCase();

const stepIndex = (status?: string) => {
  const s = normalize(status);
  if (s === "delivered") return 2;
  if (s === "in_transit") return 1;
  return 0;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const OrderDetailsModal: React.FC<Props> = ({ order, onClose }) => {
  if (!order) return null;

  const active = stepIndex(order.transportStatus);
  const transporter = order.transporter;
  const transporterName =
    typeof transporter === "object" && transporter !== null
      ? transporter.name
      : undefined;
  const transporterPhone =
    typeof transporter === "object" && transporter !== null
      ? transporter.phone
      : undefined;

  return (
    <div
      className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#fefefe] rounded-[8px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e2e2e2]">
          <div>
            <p className="font-montserrat font-semibold text-[15px] text-[#2b2b2b]">
              Order Details
            </p>
            <p className="font-montserrat text-[11px] text-[#808080]">
              #{(order._id || order.id || "").slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#2b2b2b] cursor-pointer"
          >
            <XIcon />
          </button>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <StatusBadge status={order.transportStatus || "not_moved"} />
          <span className="font-montserrat text-[12px] text-[#808080]">
            Ordered {formatDateTime(order.createdAt)}
          </span>
        </div>

        <div className="px-5 pb-4">
          <div className="flex flex-col gap-3">
            {STEPS.map((step, i) => {
              const reached = i <= active;
              const isCurrent = i === active;
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        reached
                          ? "bg-[#538e53] border-[#538e53]"
                          : "bg-[#fefefe] border-[#b8becd]"
                      }`}
                    />
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-[2px] flex-1 min-h-[24px] ${
                          i < active ? "bg-[#538e53]" : "bg-[#e2e2e2]"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-3">
                    <p
                      className={`font-montserrat text-[13px] font-medium ${
                        reached ? "text-[#2b2b2b]" : "text-[#808080]"
                      }`}
                    >
                      {step.label}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-normal text-[#538e53] uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="font-montserrat text-[11px] text-[#808080] mt-[2px]">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#e2e2e2]">
          <p className="font-montserrat font-medium text-[13px] text-[#2b2b2b] mb-2">
            Items
          </p>
          <div className="flex flex-col gap-2">
            {(order.products ?? []).map((line, idx) => {
              const prod = line.product;
              const isObj = prod && typeof prod === "object";
              const name = isObj ? prod.name : "Product";
              const image =
                (isObj && prod.images && prod.images[0]) ||
                "/images/placeholder.png";
              return (
                <div
                  key={line._id || idx}
                  className="flex items-center gap-3 p-2 rounded-[4px] bg-[#f7f7f7]"
                >
                  <div className="relative w-10 h-10 rounded-[4px] overflow-hidden bg-[#f1f1f1] flex-shrink-0">
                    <Image
                      src={image}
                      alt={name || "Product"}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-montserrat text-[12px] text-[#2b2b2b] truncate">
                      {name}
                    </p>
                    <p className="font-montserrat text-[11px] text-[#808080]">
                      Qty: {line.quantity ?? 0}
                      {isObj && prod.unit
                        ? ` ${formatUnitAfterQuantity(prod.unit)}`
                        : ""}
                    </p>
                  </div>
                  <p className="font-montserrat text-[12px] text-[#2b2b2b]">
                    ₦{(line.lineSubtotal ?? 0).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#e2e2e2] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="font-montserrat text-[11px] text-[#808080]">
              Delivery Address
            </p>
            <p className="font-montserrat text-[12px] text-[#2b2b2b]">
              {order.address || "—"}
            </p>
          </div>
          <div>
            <p className="font-montserrat text-[11px] text-[#808080]">
              Transporter
            </p>
            <p className="font-montserrat text-[12px] text-[#2b2b2b]">
              {transporterName || "—"}
            </p>
            {transporterPhone && (
              <p className="font-montserrat text-[11px] text-[#808080]">
                {transporterPhone}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#e2e2e2] flex items-center justify-between">
          <span className="font-montserrat font-semibold text-[13px] text-[#2b2b2b]">
            Total
          </span>
          <span className="font-montserrat font-semibold text-[14px] text-[#2b2b2b]">
            ₦{(order.totalAmount ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
