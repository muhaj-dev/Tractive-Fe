"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AdminActionMenuProps } from "../AdminActionMenuProps";
import "../../Table.css";

const CheckTickIcon = () => (
  <svg
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
    viewBox="0 0 16 16"
    fill="#fefefe"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6.4 11.2L3.2 8L2 9.2L6.4 13.6L14 6L12.8 4.8L6.4 11.2Z"
      stroke="#fefefe"
      strokeWidth="1"
    />
  </svg>
);

interface BaseData {
  id: string;
  checked?: boolean;
  status?: string;
}

export interface ColumnConfig<T> {
  header: string;
  key: keyof T | string;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

interface ListTableProps<T extends BaseData> {
  dataType: string;
  allChecked?: boolean;
  initialData?: T[];
  columns: ColumnConfig<T>[];
  handleSelectAll?: () => void;
  handleRefund?: (id: string) => void;
  handleProfile?: (id: string) => void;
  handleDecline?: (id: string) => void;
  handleApprove?: (id: string) => void;
  handleSuspended?: (id: string) => void;
  handleBuyerInfo?: (id: string) => void;
  handleTBuyerInfo?: (id: string) => void;
  handleSellerInfo?: (id: string) => void;
  handleReactivate?: (id: string) => void;
  handleTrackOrder?: (id: string) => void;
  handleViewProfile?: (id: string) => void;
  handleToggleStatus?: (id: string) => void;
  handleAgentApprove?: (id: string) => void;
  handleAdminRemoved?: (id: string) => void;
  handleAgentDecline?: (id: string) => void;
  handleFarmerApprove?: (id: string) => void;
  handleFarmerDecline?: (id: string) => void;
  handleTransporterApprove?: (id: string) => void;
  handleTransporterDecline?: (id: string) => void;
  handleAdminSuspended?: (id: string) => void;
  handleAdminOnboarding?: (id: string) => void;
  handleTransporterInfo?: (id: string) => void;
  handleCheckboxChange?: (id: string) => void;
  fetchData?: (dataType: string) => Promise<T[]>;
  ActionMenuComponent?: React.ComponentType<AdminActionMenuProps>;
  onRowClick?: (id: string) => void;
}

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const AdminTable = <T extends BaseData>({
  dataType,
  columns,
  fetchData,
  allChecked,
  handleRefund,
  handleProfile,
  handleApprove,
  handleDecline,
  handleSuspended,
  handleSelectAll,
  handleBuyerInfo,
  handleTBuyerInfo,
  handleSellerInfo,
  initialData = [],
  handleReactivate,
  handleTrackOrder,
  handleViewProfile,
  handleAdminRemoved,
  handleToggleStatus,
  handleAgentDecline,
  handleAgentApprove,
  ActionMenuComponent,
  handleFarmerApprove,
  handleFarmerDecline,
  handleTransporterApprove,
  handleTransporterDecline,
  handleAdminSuspended,
  handleCheckboxChange,
  handleAdminOnboarding,
  handleTransporterInfo,
  onRowClick,
}: ListTableProps<T>): React.ReactElement => {
  const [data, setData] = useState<T[]>(initialData);
  // const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isCheckboxTable = [
    "initialUsers",
    "TransactionalData",
    "AgentsData",
    "FarmersData",
    "TransportersData",
    "ASRDataControl",
  ].includes(dataType);

  useEffect(() => {
    if (fetchData) {
      fetchData(dataType).then((fetchedData) => setData(fetchedData));
    } else {
      setData(initialData);
    }
  }, [dataType, fetchData, initialData]);

  const defaultHandleViewProfile = (id: string) => {
    console.log(`Default handleEdit called for id: ${id}`);
    alert(`Edit ${dataType} with ID: ${id}`);
  };

  const defaultHandleSuspended = (id: string) => {
    console.log(`Default handleRemove called for id: ${id}`);
    alert(`Remove ${dataType} with ID: ${id}`);
  };

  const defaultHandleApprove = (id: string) => {
    console.log(`Default handleApprove called for id: ${id}`);
    alert(`Approve ${dataType} with ID: ${id}`);
  };

  const defaultHandleDeclined = (id: string) => {
    console.log(`Default handleDeclined called for id: ${id}`);
    alert(`Decline ${dataType} with ID: ${id}`);
  };

  const defaultHandleRefund = (id: string) => {
    console.log(`Default handleRefund called for id: ${id}`);
    alert(`Refund ${dataType} with ID: ${id}`);
  };

  const defaultHandleAgentApprove = (id: string) => {
    console.log(`Default handleAgentApprove called for id: ${id}`);
    alert(`Approve ${dataType} with ID: ${id}`);
  };

  const defaultHandleAgentDecline = (id: string) => {
    console.log(`Default handleAgentDecline called for id: ${id}`);
    alert(`Decline ${dataType} with ID: ${id}`);
  };

  const defaultHandleFarmerApprove = (id: string) => {
    console.log(`Default handleFarmerApprove called for id: ${id}`);
    alert(`Approve ${dataType} with ID: ${id}`);
  };

  const defaultHandleFarmerDecline = (id: string) => {
    console.log(`Default handleFarmerDecline called for id: ${id}`);
    alert(`Decline ${dataType} with ID: ${id}`);
  };

  const defaultHandleTransporterApprove = (id: string) => {
    console.log(`Default handleTransporterApprove called for id: ${id}`);
    alert(`Approve ${dataType} with ID: ${id}`);
  };

  const defaultHandleTransporterDecline = (id: string) => {
    console.log(`Default handleTransporterDecline called for id: ${id}`);
    alert(`Decline ${dataType} with ID: ${id}`);
  };

  const defaultHandleProfile = (id: string) => {
    console.log(`Default handleProfile called for id: ${id}`);
    alert(`Profile ${dataType} with ID: ${id}`);
  };
  const defaultHandleAdminSuspended = (id: string) => {
    console.log(`Default handleAdminSuspended called for id: ${id}`);
    alert(`Suspend ${dataType} with ID: ${id}`);
  };
  const defaultHandleReactivate = (id: string) => {
    console.log(`Default handleAdminReactivate called for id: ${id}`);
    alert(`Reactivate ${dataType} with ID: ${id}`);
  };
  const defaultHandleAdminRemoved = (id: string) => {
    console.log(`Default handleAdminRemoved called for id: ${id}`);
    alert(`Remove ${dataType} with ID: ${id}`);
  };
  const defaultHandleAdminOnboarding = (id: string) => {
    console.log(`Default handleAdminOnboarding called for id: ${id}`);
    alert(`Onboarding ${dataType} with ID: ${id}`);
  };

  const defaultHandleSellerInfo = (id: string) => {
    console.log(`Default handleSellerInfo called for id: ${id}`);
    alert(`Seller Info ${dataType} with ID: ${id}`);
  };
  const defaultHandleBuyerInfo = (id: string) => {
    console.log(`Default handleBuyerInfo called for id: ${id}`);
    alert(`Buyer Info ${dataType} with ID: ${id}`);
  };
  const defaultHandleTBuyerInfo = (id: string) => {
    console.log(`Default handleTBuyerInfo called for id: ${id}`);
    alert(`Buyer Info ${dataType} with ID: ${id}`);
  };
  const defaultHandleTransporterInfo = (id: string) => {
    console.log(`Default handleTransporterInfo called for id: ${id}`);
    alert(`Transporter Info ${dataType} with ID: ${id}`);
  };
  const defaultHandleTrackOrder = (id: string) => {
    console.log(`Default handleTrackOrder called for id: ${id}`);
    alert(`Track Order Info ${dataType} with ID: ${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="Table_Container hide-scrollbar"
    >
      <table className="Table_Style">
        <thead>
          <tr className="text-left text-[12px] font-normal font-montserrat text-[#2b2b2b] md:text-sm">
            {isCheckboxTable && (
              <th className="py-3 pl-4 w-[50px] min-w-[50px]">
                <div className="relative w-5 h-5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleSelectAll}
                    className="w-5 h-5 cursor-pointer rounded border-[1px] border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53] touch:p-2"
                  />
                  {allChecked && <CheckTickIcon />}
                </div>
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`py-1.5 px-4 font-montserrat text-[10px] sm:text-[11px] md:text-[12px] font-normal ${
                  col.minWidth || "min-w-[100px]"
                } sm:table-cell`}
              >
                {col.header}
              </th>
            ))}
            <th className="py-1.5 px-4 min-w-[50px]"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={item.id}
              className={`border-gray-200 border-b-[1px] py-1.5 px-4 relative transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-[#EFF7EF]" : "hover:bg-[#EFF7EF]"
              }`}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              onClick={onRowClick ? () => onRowClick(item.id) : undefined}
              // A clickable row must also be reachable and operable from the
              // keyboard -- the same gap fixed on the wishlist heart (11h) and
              // the add-to-store modal (12f).
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "link" : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(item.id);
                      }
                    }
                  : undefined
              }
            >
              {isCheckboxTable && (
                <td
                  className="py-1.5 pl-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-5 h-5">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange?.(item.id)}
                      className="w-5 h-5 cursor-pointer rounded border-[1px] border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53]"
                    />
                    {item.checked && <CheckTickIcon />}
                  </div>
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key as string}
                  className="py-1.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b]"
                >
                  {col.render
                    ? col.render(item)
                    : String(item[col.key as keyof T])}
                </td>
              ))}
              <td
                className="py-1.5 px-4 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {ActionMenuComponent && (
                  <ActionMenuComponent
                    userTypeId={item.id}
                    handleViewProfile={
                      dataType === "initialUsers"
                        ? handleViewProfile || defaultHandleViewProfile
                        : undefined
                    }
                    handleSuspended={
                      dataType === "initialUsers"
                        ? handleSuspended || defaultHandleSuspended
                        : undefined
                    }
                    handleToggleStatus={
                      dataType === "initialUsers"
                        ? handleToggleStatus
                        : undefined
                    }
                    handleApprove={
                      dataType === "TransactionalData"
                        ? handleApprove || defaultHandleApprove
                        : undefined
                    }
                    handleDecline={
                      dataType === "TransactionalData"
                        ? handleDecline || defaultHandleDeclined
                        : undefined
                    }
                    handleRefund={
                      dataType === "TransactionalData"
                        ? handleRefund || defaultHandleRefund
                        : undefined
                    }
                    handleProfile={
                      dataType === "TransactionalData"
                        ? handleProfile || defaultHandleProfile
                        : undefined
                    }
                    handleAgentApprove={
                      dataType === "AgentsData"
                        ? handleAgentApprove || defaultHandleAgentApprove
                        : undefined
                    }
                    handleAgentDecline={
                      dataType === "AgentsData"
                        ? handleAgentDecline || defaultHandleAgentDecline
                        : undefined
                    }
                    handleFarmerApprove={
                      dataType === "FarmersData"
                        ? handleFarmerApprove || defaultHandleFarmerApprove
                        : undefined
                    }
                    handleFarmerDecline={
                      dataType === "FarmersData"
                        ? handleFarmerDecline || defaultHandleFarmerDecline
                        : undefined
                    }
                    handleTransporterApprove={
                      dataType === "TransportersData"
                        ? handleTransporterApprove ||
                          defaultHandleTransporterApprove
                        : undefined
                    }
                    handleTransporterDecline={
                      dataType === "TransportersData"
                        ? handleTransporterDecline ||
                          defaultHandleTransporterDecline
                        : undefined
                    }
                    handleAdminSuspended={
                      dataType === "ASRDataControl"
                        ? handleAdminSuspended || defaultHandleAdminSuspended
                        : undefined
                    }
                    handleReactivate={
                      dataType === "ASRDataControl"
                        ? handleReactivate || defaultHandleReactivate
                        : undefined
                    }
                    handleAdminRemoved={
                      dataType === "ASRDataControl"
                        ? handleAdminRemoved || defaultHandleAdminRemoved
                        : undefined
                    }
                    handleAdminOnboarding={
                      dataType === "ASRDataControl"
                        ? handleAdminOnboarding || defaultHandleAdminOnboarding
                        : undefined
                    }
                    handleSellerInfo={
                      dataType === "TrackAgentData"
                        ? handleSellerInfo || defaultHandleSellerInfo
                        : undefined
                    }
                    handleBuyerInfo={
                      dataType === "TrackAgentData"
                        ? handleBuyerInfo || defaultHandleBuyerInfo
                        : undefined
                    }
                    handleTBuyerInfo={
                      dataType === "TrackTransporterData"
                        ? handleTBuyerInfo || defaultHandleTBuyerInfo
                        : undefined
                    }
                    handleTransporterInfo={
                      dataType === "TrackTransporterData"
                        ? handleTransporterInfo || defaultHandleTransporterInfo
                        : undefined
                    }
                    handleTrackOrder={
                      dataType === "TrackTransporterData"
                        ? handleTrackOrder || defaultHandleTrackOrder
                        : undefined
                    }
                    status={item.status}
                  />
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default AdminTable;
