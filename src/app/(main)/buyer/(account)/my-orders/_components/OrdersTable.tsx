"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";
import type { BuyerOrderRow } from "./ordersData";

interface Props {
  rows: BuyerOrderRow[];
  emptyTitle: string;
  emptyHint: string;
  emptyAction?: React.ReactNode;
  /** Opens the payment flow for an unpaid order. */
  onPay?: (row: BuyerOrderRow) => void;
  /** Opens the order detail view. */
  onOpen?: (row: BuyerOrderRow) => void;
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

/**
 * Buyer orders as a table, matching the Transactions screen so the two account
 * pages read as siblings rather than two unrelated designs.
 */
export const OrdersTable: React.FC<Props> = ({
  rows,
  emptyTitle,
  emptyHint,
  emptyAction,
  onPay,
  onOpen,
}) => {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-[#fefefe] rounded-[5px] border border-dashed border-[#e2e2e2]">
        <p className="font-montserrat font-medium text-[14px] text-[#2b2b2b]">
          {emptyTitle}
        </p>
        <p className="font-montserrat text-[12px] text-[#808080] mt-1 mb-4">
          {emptyHint}
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 min-w-[760px]">
        <thead>
          <tr className="text-left font-montserrat text-[12px] text-[#808080]">
            <th className="py-2 px-4 font-normal">Item</th>
            <th className="py-2 px-4 font-normal">Quantity</th>
            <th className="py-2 px-4 font-normal">Amount</th>
            <th className="py-2 px-4 font-normal">Seller</th>
            <th className="py-2 px-4 font-normal">Status</th>
            <th className="py-2 px-4 font-normal">Date</th>
            <th className="py-2 px-4 w-[150px]" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.04 }}
              className={`bg-[#fefefe] ${onOpen ? "cursor-pointer" : ""}`}
              onClick={onOpen ? () => onOpen(row) : undefined}
              tabIndex={onOpen ? 0 : undefined}
              role={onOpen ? "button" : undefined}
              onKeyDown={
                onOpen
                  ? (e) => {
                    // Only when the row itself has focus, so Enter on a control inside the
                    // row does not also open it.
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(row);
                    }
                  }
                  : undefined
              }
            >
              <td className="py-3 px-4 border-y border-l border-[#eeeeee] rounded-l-[6px]">
                <div className="flex items-center gap-2">
                  <div className="w-[44px] h-[34px] rounded-[4px] overflow-hidden bg-[#f1f1f1] shrink-0">
                    <Image
                      src={row.image}
                      alt={row.item}
                      width={44}
                      height={34}
                      className="object-cover w-[44px] h-[34px]"
                    />
                  </div>
                  {/* Capped so a long product name cannot stretch the column. */}
                  <span className="font-montserrat text-[12px] text-[#2b2b2b] truncate max-w-[150px] md:max-w-[200px]">
                    {row.item}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 border-y border-[#eeeeee] font-montserrat text-[12px] text-[#2b2b2b]">
                {row.quantity}
              </td>
              <td className="py-3 px-4 border-y border-[#eeeeee] font-montserrat text-[12px] text-[#2b2b2b]">
                ₦{row.amount.toLocaleString()}
              </td>
              <td className="py-3 px-4 border-y border-[#eeeeee] font-montserrat text-[12px] text-[#2b2b2b]">
                {row.seller}
              </td>
              <td className="py-3 px-4 border-y border-[#eeeeee]">
                <span
                  className={`inline-block rounded-[4px] px-2 py-[3px] font-montserrat text-[11px] whitespace-nowrap ${row.statusTone}`}
                >
                  {row.statusLabel}
                </span>
              </td>
              <td className="py-3 px-4 border-y border-[#eeeeee] font-montserrat text-[12px] text-[#2b2b2b] whitespace-nowrap">
                {row.date}
              </td>
              <td className="py-3 px-4 border-y border-r border-[#eeeeee] rounded-r-[6px] text-right">
                {row.canPay && onPay ? (
                  // `Button`'s onClick takes no event, so the row's own click
                  // handler is stopped on this wrapper instead.
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block"
                  >
                    <Button
                      text="Complete payment"
                      onClick={() => onPay(row)}
                      className="!py-[6px] !px-3 !rounded-[4px] text-[11px] cursor-pointer whitespace-nowrap"
                    />
                  </span>
                ) : null}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
