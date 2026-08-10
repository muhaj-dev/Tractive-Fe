"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PendingTableList } from "./_components/TransactionTables/PendingTableList";
import { ApprovedTableList } from "./_components/TransactionTables/ReceivedTableList";
import { useTransporterTransactions } from "@/hooks/queries/useFleetQueries";

interface SideProps {
  switchSides: "Pending" | "Approved";
  setSwitchSides: React.Dispatch<React.SetStateAction<"Pending" | "Approved">>;
}

export default function PendingTransactionListPage() {
  const { data: transactions = [] } = useTransporterTransactions();
  const pendingCount = transactions.filter(
    (t) => !t.status || t.status === "pending",
  ).length;
  const approvedCount = transactions.filter(
    (t) => t.status === "approved",
  ).length;
  const [switchSides, setSwitchSides] =
    useState<SideProps["switchSides"]>("Pending");
  const PendingContainerRef = useRef<HTMLDivElement>(null);
  const ApprovedContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });

  const handleSwitchSides = (side: SideProps["switchSides"]) => {
    setSwitchSides(side);
  };

  // Update indicator position and width when switchSides changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeContainer =
        switchSides === "Pending"
          ? PendingContainerRef.current
          : ApprovedContainerRef.current;
      const container = containerRef.current;
      if (activeContainer && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeContainer.getBoundingClientRect();
        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;
        setIndicatorStyle({ left, width });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [switchSides]);

  return (
    <div className="w-[95%] mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px] shadow-md">
      <h1 className="text-[16px] font-normal font-montserrat mb-4 px-6 pt-6 sm:text-lg">
        Transaction history
      </h1>
      <div className="flex flex-col">
        <div
          className="relative flex items-center gap-4 sm:gap-6 mb-2 px-6"
          ref={containerRef}
          role="tablist"
          aria-label="Stock management tabs"
        >
          <div
            className="flex items-center gap-1 relative"
            ref={PendingContainerRef}
          >
            <button
              role="tab"
              id="active-tab"
              onClick={() => handleSwitchSides("Pending")}
              className={`text-[14px] font-medium cursor-pointer p-2 sm:text-base ${
                switchSides === "Pending" ? "text-[#E0A63A]" : "text-[#E0A63A]"
              }`}
              aria-selected={switchSides === "Pending"}
              aria-controls="Pending-panel"
            >
              Pending
            </button>
            <span className="bg-[#E0A63A] text-[#fefefe] text-[10px] font-montserrat font-medium rounded-[4px] px-[4px] py-[1px]">
              {pendingCount}
            </span>
          </div>
          <div
            className="flex items-center gap-1 relative"
            ref={ApprovedContainerRef}
          >
            <button
              role="tab"
              id="Approved-tab"
              onClick={() => handleSwitchSides("Approved")}
              className={`text-[14px] font-medium cursor-pointer p-2 sm:text-base ${
                switchSides === "Approved" ? "text-[#538e53]" : "text-[#538e53]"
              }`}
              aria-selected={switchSides === "Approved"}
              aria-controls="Approved-panel"
            >
              Approved
            </button>
            <span className="bg-[#538e53] text-[#fefefe] text-[10px] font-montserrat font-normal rounded-[4px] px-[4px] py-[1px]">
              {approvedCount}
            </span>
          </div>
          <motion.div
            className={`absolute -bottom-[0.5rem] rounded-t-[10px] h-[3.7px] ${
              switchSides === "Pending" ? "bg-[#E0A63A]" : "bg-[#538e53]"
            }`}
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        <div className="w-full h-[1px] bg-[#e2e2e2]"></div>
      </div>

      <div
        className="mb-4"
        role="tabpanel"
        id={switchSides === "Pending" ? "Pending-panel" : "Approved-panel"}
      >
        {switchSides === "Pending" ? (
          <PendingTableList />
        ) : (
          <ApprovedTableList />
        )}
      </div>
    </div>
  );
}
