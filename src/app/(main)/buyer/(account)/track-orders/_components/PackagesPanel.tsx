"use client";
import React from "react";
import Image from "next/image";
import type { TrackOrder } from "./trackOrdersData";

interface Props {
  order: TrackOrder;
}

export const PackagesPanel: React.FC<Props> = ({ order }) => {
  return (
    <div className="bg-[#fefefe] rounded-[10px] shadow-md p-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
      <div className="flex items-center">
        <span className="font-montserrat text-[11px] text-[#808080]">
          Package
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {order.packages.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 py-1"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 rounded-[4px] overflow-hidden bg-[#f1f1f1] flex-shrink-0">
                <Image
                  src={p.image}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="object-cover w-10 h-10"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-montserrat text-[12px] text-[#2b2b2b] truncate">
                  {p.name}
                </span>
                <span className="font-montserrat text-[10px] text-[#808080] truncate">
                  {p.description}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
