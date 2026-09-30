import React from "react";
import { motion } from "framer-motion";
import { ActionMenu } from "./ActionMenu";
import Image from "next/image";
import { Fleet, fleetStatusToLabel } from "@/utils/Fleet";

// Animation variants for table rows
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface ProductRowProps {
  fleet: Fleet;
  index: number;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  copyToClipboard: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleToggleStatus: (id: string, newStatusStr: string) => void; // Changed from handleSetAvailable
  handleTracking: (id: string) => void; // Added
  onRowClick?: (fleet: Fleet) => void;
}

export const TickIcon = () => {
  return (
    <svg
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.4 11.2L3.2 8L2 9.2L6.4 13.6L14 6L12.8 4.8L6.4 11.2Z"
        stroke="#fefefe"
        strokeWidth="1"
      />
    </svg>
  );
};

export const IdCopyIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 18 18"
      fill="none"
      className="cursor-pointer"
    >
      <g clipPath="url(#clip0_10196_93765)">
        <path
          d="M12 0.75H3C2.175 0.75 1.5 1.425 1.5 2.25V12.75H3V2.25H12V0.75ZM11.25 3.75H6C5.175 3.75 4.5075 4.425 4.5075 5.25L4.5 15.75C4.5 16.575 5.1675 17.25 5.9925 17.25H14.25C15.075 17.25 15.75 16.575 15.75 15.75V8.25L11.25 3.75ZM6 15.75V5.25H10.5V9H14.25V15.75H6Z"
          fill="#2B2B2B"
        />
      </g>
      <defs>
        <clipPath id="clip0_10196_93765">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const ProductRow: React.FC<ProductRowProps> = ({
  fleet,
  index,
  activeMenu,
  setActiveMenu,
  copyToClipboard,
  handleEdit,
  handleDelete,
  handleToggleStatus,
  handleTracking,
  onRowClick,
}) => {
  // Map status to color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Maintenance":
        return "text-[#8B4513]";
      case "Available":
        return "text-[#538e53]";
      case "On Transit":
        return "text-[#2b2b2b]";
      default:
        return "text-[#2b2b2b]";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent row click if clicking on actionable items
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest(".action-menu-container") ||
      target.closest("svg")
    ) {
      return;
    }
    
    if (onRowClick) {
      onRowClick(fleet);
    }
  };

  return (
    <motion.tr
      className="bg-white relative cursor-pointer hover:bg-gray-50 transition-colors"
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        // Only when the row itself has focus, so Enter on a control inside the
        // row does not also open it.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick?.(fleet);
        }
      }}
    >
      <td className="py-2.5 pl-4 border-y border-l border-gray-200 rounded-l-[8px]">
        <div className="flex items-center gap-2">
          <div className="bg-[#f1f1f1] flex items-center justify-center w-[63px] h-[37px] rounded-[4px] overflow-hidden">
            <Image
              src={fleet.image}
              alt={fleet.name}
              width={40}
              height={24}
              className="object-contain h-full w-full"
            />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-medium truncate font-montserrat text-[#2b2b2b]">
              {fleet.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-montserrat font-normal text-[#808080]">
                {fleet.IOT}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(fleet.IOT);
                }}
                title="Copy Fleet IOT"
                aria-label="Copy Fleet IOT"
                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
              >
                <IdCopyIcon />
              </button>
            </div>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#2b2b2b] border-y border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-montserrat font-normal text-[#808080]">
            {fleet.IOT}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(fleet.IOT);
            }}
            title="Copy Fleet IOT"
            aria-label="Copy Fleet IOT"
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IdCopyIcon />
          </button>
        </div>
      </td>
      <td className="py-2.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#2b2b2b] border-y border-gray-200">
        {fleet.route}
      </td>
      <td
        className={`py-2.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal ${getStatusColor(
          fleetStatusToLabel(fleet.status)
        )} border-y border-gray-200`}
      >
        {fleetStatusToLabel(fleet.status)}
      </td>
      <td className="py-2.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-medium text-[#2b2b2b] border-y border-gray-200">
        ₦{fleet.price.toLocaleString()}
      </td>
      <td className="py-2.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#808080] border-y border-gray-200">
        {fleet.date}
      </td>
      <td className="py-2.5 px-4 relative z-10 action-menu-container border-y border-r border-gray-200 rounded-r-[8px]" onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          productId={fleet.id}
          status={fleet.status} // Pass status
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleToggleStatus={handleToggleStatus} // Pass new callback
          handleTracking={handleTracking} // Pass new callback
        />
      </td>
    </motion.tr>
  );
};

