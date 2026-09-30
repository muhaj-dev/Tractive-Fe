"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../../Table.css";
import { TransportActionMenuProps } from "../TransportActionMenuProps";
import { TickIcon } from "../Icons/TransporterIcons";
// import { TickIcon } from "@/app/(main)/agents/produce-list/_components/table/ProductRow";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T, handlers?: { handleViewDetails?: (id: string) => void }) => React.ReactNode;
  minWidth?: string;
}

interface BaseData {
  id: string;
  checked?: boolean;
}

interface ListTableProps<T extends BaseData> {
  dataType: string;
  columns: ColumnConfig<T>[];
  initialData?: T[];
  fetchData?: (dataType: string) => Promise<T[]>;
  ActionMenuComponent?: React.ComponentType<TransportActionMenuProps>;
  handleEdit?: (id: string) => void;
  handleRemove?: (id: string) => void;
  handleAssignFleet?: (id: string) => void;
  handleViewDetails?: (id: string) => void;
  handleViewBidders?: (id: string) => void;
  handleCustomerInfo?: (id: string) => void;
  handleSupport?: (id: string) => void;
  handleBuyerInfo?: (id: string) => void;
  handleParked?: (id: string) => void;
  handleDelivered?: (id: string) => void;
  handleCustomerCare?: (id: string) => void;
  handleReject?: (id: string) => void;
  handleAccept?: (id: string) => void;
  handleCheckboxChange?: (id: string) => void;
  handleSelectAll?: () => void;
  allChecked?: boolean;
  emptyState?: React.ReactNode;
}

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const TableList = <T extends BaseData>({
  dataType,
  columns,
  initialData = [],
  fetchData,
  ActionMenuComponent,
  handleEdit,
  handleRemove,
  handleAssignFleet,
  handleBuyerInfo,
  handleParked,
  handleDelivered,
  handleCustomerCare,
  handleCustomerInfo,
  handleCheckboxChange,
  handleSelectAll,
  allChecked,
  handleSupport,
  handleViewDetails,
  handleReject,
  handleAccept,
  emptyState,
}: ListTableProps<T>): React.ReactElement => {
  const [data, setData] = useState<T[]>(initialData);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isCheckboxTable = ["negotiations"].includes(dataType);

  useEffect(() => {
    if (fetchData) {
      fetchData(dataType).then((fetchedData) => setData(fetchedData));
    } else {
      setData(initialData);
    }
  }, [dataType, fetchData, initialData]);

  const defaultHandleEdit = (id: string) => {
    alert(`Edit ${dataType} with ID: ${id}`);
    setActiveMenu(null);
  };

  const defaultHandleRemove = (id: string) => {
    alert(`Remove ${dataType} with ID: ${id}`);
    setActiveMenu(null);
  };

  const defaultHandleAssignFleet = (id: string) => {
    if (handleAssignFleet) {
      handleAssignFleet(id);
    } else {
      alert(`Assign fleet to ${dataType} with ID: ${id}`);
    }
    setActiveMenu(null);
  };
  
  const defaultHandleBuyerInfo = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleParked = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleDelivered = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleCustomerCare = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleCustomerInfo = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleSupport = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleReject = (id: string) => {
    alert(`Reject ${dataType} with ID: ${id}`);
    setActiveMenu(null);
  };

  const defaultHandleAccept = (id: string) => {
    alert(`Accept ${dataType} with ID: ${id}`);
    setActiveMenu(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="Table_Container"
    >
      <table className="Table_Style w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-[12px] font-normal font-montserrat text-[#2b2b2b] md:text-sm">
            {isCheckboxTable && (
              <th className="py-3 pl-4 w-[50px] min-w-[50px]">
                <div className="relative w-5 h-5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53] touch:p-2"
                  />
                  {allChecked && <TickIcon />}
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
          {data.length > 0 ? (
            data.map((item, index) => (
              <motion.tr
              key={item.id}
              className="bg-white hover:bg-gray-50 transition-colors relative"
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
            >
              {isCheckboxTable && (
                <td className="py-2.5 pl-4 border-y border-l border-gray-200 rounded-l-[8px] whitespace-nowrap">
                  <div className="relative w-5 h-5">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange?.(item.id)}
                      className="w-5 h-5 rounded border border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53]"
                    />
                    {item.checked && <TickIcon />}
                  </div>
                </td>
              )}
              {columns.map((col, colIndex) => (
                <td
                  key={col.key as string}
                  className={`py-2.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b] border-y border-gray-200 
                  ${!isCheckboxTable && colIndex === 0 ? "border-l rounded-l-[8px] pl-4" : ""}
                  ${handleViewDetails ? "cursor-pointer" : ""}
                  `}
                  onClick={() => handleViewDetails?.(item.id)}
                >
                  {col.render ? col.render(item, { handleViewDetails }) : String(item[col.key])}
                </td>
              ))}
              <td className="py-2.5 px-4 relative action-menu-container z-10 border-y border-r border-gray-200 rounded-r-[8px]">
                {ActionMenuComponent && (
                  <ActionMenuComponent
                    driverId={item.id}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    handleEdit={
                      dataType === "drivers"
                        ? handleEdit || defaultHandleEdit
                        : undefined
                    }
                    handleRemove={
                      dataType === "drivers"
                        ? handleRemove || defaultHandleRemove
                        : undefined
                    }
                    handleAssignFleet={
                      dataType === "drivers"
                        ? handleAssignFleet || defaultHandleAssignFleet
                        : undefined
                    }
                    handleBuyerInfo={
                      dataType === "new" ||
                      dataType === "parked" ||
                      dataType === "delivered"
                        ? handleBuyerInfo || defaultHandleBuyerInfo
                        : undefined
                    }
                    handleParked={
                      dataType === "new"
                        ? handleParked || defaultHandleParked
                        : undefined
                    }
                    handleDelivered={
                      dataType === "parked"
                        ? handleDelivered || defaultHandleDelivered
                        : undefined
                    }
                    handleCustomerCare={
                      dataType === "pending" || "received"
                        ? handleCustomerCare || defaultHandleCustomerCare
                        : undefined
                    }
                    handleCustomerInfo={
                      dataType === "customers"
                        ? handleCustomerInfo || defaultHandleCustomerInfo
                        : undefined
                    }
                    handleSupport={
                      dataType === "customers"
                        ? handleSupport || defaultHandleSupport
                        : undefined
                    }
                    handleReject={
                      dataType === "negotiations"
                        ? handleReject || defaultHandleReject
                        : undefined
                    }
                    handleAccept={
                      dataType === "negotiations"
                        ? handleAccept || defaultHandleAccept
                        : undefined
                    }
                  />
                )}
              </td>
            </motion.tr>
            ))
          ) : emptyState ? (
            emptyState
          ) : (
            <tr>
              <td
                colSpan={columns.length + (isCheckboxTable ? 2 : 1)}
                className="py-10 text-center font-montserrat text-sm text-[#808080]"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );
};
