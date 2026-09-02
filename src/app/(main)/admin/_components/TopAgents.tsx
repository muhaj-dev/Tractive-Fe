"use client";
import React from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { useTopAgents } from "@/hooks/queries/useAdminDashboardQueries";
import { formatCurrency } from "@/lib/format";

// Framer Motion variants for table animation
const tableVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

// Framer Motion variants for table row animation
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const thClass =
  "px-4 py-1 text-left text-[11px] font-normal font-montserrat text-[#808080] capitalize tracking-wider";

const SkeletonRows = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}>
        <td className="px-4 py-1.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="h-[25px] w-[25px] rounded-full bg-[#ececec] animate-pulse" />
            <span className="h-3 w-24 rounded bg-[#ececec] animate-pulse" />
          </div>
        </td>
        <td className="px-4 py-1.5">
          <span className="block h-3 w-16 rounded bg-[#ececec] animate-pulse" />
        </td>
        <td className="px-4 py-1.5">
          <span className="block h-3 w-8 rounded bg-[#ececec] animate-pulse" />
        </td>
        <td className="px-4 py-1.5">
          <span className="block h-3 w-16 rounded bg-[#ececec] animate-pulse" />
        </td>
      </tr>
    ))}
  </>
);

export const TopAgents: React.FC = () => {
  const { data: agents, isLoading, isError } = useTopAgents(5);

  return (
    <div className="w-full bg-[#fefefe] shadow-md rounded-[6px] overflow-hidden">
      <h2 className="font-montserrat text-[#2b2b2b] text-[12px] p-2 rounded-tl-[6px] rounded-br-[6px] font-medium mb-4 bg-[#EFCEB780] flex items-center justify-center w-[40%]">
        Top Agents
      </h2>
      <motion.div
        className="overflow-x-auto"
        initial="hidden"
        animate="visible"
        variants={tableVariants}
      >
        <table className="min-w-full shadow-md rounded-lg overflow-hidden">
          <thead className="border-b border-[#e2e2e2]">
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Location</th>
              <th className={thClass}>Orders</th>
              <th className={thClass}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : isError || !agents?.length ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-[11px] font-montserrat text-[#808080]"
                >
                  {isError ? "Couldn't load top agents." : "No agents yet."}
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <motion.tr
                  key={agent.id}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 py-1 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={agent.image}
                        alt={agent.name}
                        size={30}
                        className="h-[25px] w-[25px] rounded-full object-cover"
                      />
                      <span className="text-[10.5px] font-montserrat font-normal text-[#2b2b2b]">
                        {agent.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-1 whitespace-nowrap text-[10.5px] font-montserrat font-normal text-[#2b2b2b]">
                    {agent.location}
                  </td>
                  <td className="px-4 py-1 rounded-[4px] mt-1.5 mr-1.5 whitespace-nowrap text-[10.5px] font-montserrat font-normal text-[#2b2b2b]">
                    {agent.orders}
                  </td>
                  <td className="px-4 py-1 bg-[#f1f1f1] flex items-center justify-center rounded-[4px] mt-1.5 mr-1.5 whitespace-nowrap text-[10.5px] font-montserrat font-normal text-[#2b2b2b]">
                    {formatCurrency(agent.revenue)}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};
