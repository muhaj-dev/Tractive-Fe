"use client";
import { Avatar } from "@/components/ui/Avatar";
import React from "react";
import { useTopBuyers } from "@/hooks/queries/useAdminDashboardQueries";
import { formatCurrency } from "@/lib/format";

const SkeletonRows = () => (
  <>
    {Array.from({ length: 7 }).map((_, i) => (
      <div
        key={i}
        className="w-full flex items-center justify-between px-4"
      >
        <div className="flex items-center gap-[5px]">
          <span className="h-[40px] w-[40px] rounded-full bg-[#ececec] animate-pulse" />
          <span className="h-3 w-24 rounded bg-[#ececec] animate-pulse" />
        </div>
        <span className="h-3 w-16 rounded bg-[#ececec] animate-pulse" />
      </div>
    ))}
  </>
);

export const TopBuyer: React.FC = () => {
  const { data: buyers, isLoading, isError } = useTopBuyers(7);

  return (
    <div className="w-full lg:w-[39%] bg-[#fefefe] shadow-md rounded-[4px]">
      <div className="flex justify-between items-center mb-4 pr-4">
        <h2 className="font-montserrat text-[#2b2b2b] text-[12px] p-2 rounded-tl-[6px] rounded-br-[6px] font-medium bg-[#cce5cc] flex items-center justify-center w-[40%]">
          Top Buyers
        </h2>
        <span className="font-montserrat text-[#2b2b2b] text-[12px] font-normal">
          Revenue
        </span>
      </div>

      <div className="flex flex-col gap-2.5 pb-3">
        {isLoading ? (
          <SkeletonRows />
        ) : isError || !buyers?.length ? (
          <p className="px-4 py-6 text-center text-[11px] font-montserrat text-[#808080]">
            {isError ? "Couldn't load top buyers." : "No buyers yet."}
          </p>
        ) : (
          buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="w-full flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-[5px]">
                <Avatar
                  src={buyer.image}
                  alt={buyer.name}
                  size={40}
                  className="rounded-full object-cover h-[40px] w-[40px]"
                />
                <span className="font-montserrat text-[#2b2b2b] text-[11px] font-normal">
                  {buyer.name}
                </span>
              </div>
              <span className="font-montserrat text-[#2b2b2b] text-[12px] font-medium cursor-pointer">
                {formatCurrency(buyer.totalSpent)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
