"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TickIcon } from "../../produce-list/_components/table/ProductRow";
import { ActionMenuProps } from "../ActionMenuProps";
import "../../Table.css";

interface ColumnConfig<T> {
  header: string;
  key: keyof T;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

interface BaseData {
  id: string;
  checked?: boolean;
}

interface TableListProps<T extends BaseData> {
  dataType: string;
  columns: ColumnConfig<T>[];
  initialData?: T[];
  fetchData?: (dataType: string) => Promise<T[]>;
  ActionMenuComponent?: React.ComponentType<ActionMenuProps>;
  handleEdit?: (id: string) => void;
  handleReport?: (id: string) => void;
  handleView?: (id: string) => void;
  handleViewBidders?: (id: string) => void;
  handleCustomerInfo?: (id: string) => void;
  handleSupport?: (id: string) => void;
  handleBuyerInfo?: (id: string) => void;
  handleParked?: (id: string) => void;
  handleDelivered?: (id: string) => void;
  handleCustomerCare?: (id: string) => void;
  handleApprove?: (id: string) => void;
  isApproving?: boolean;
  handleCheckboxChange?: (id: string) => void;
  handleSelectAll?: () => void;
  allChecked?: boolean;
  handleDelete?: (id: string) => void;
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
  handleReport,
  handleView,
  handleViewBidders,
  handleBuyerInfo,
  handleParked,
  handleDelivered,
  handleCustomerCare,
  handleApprove,
  isApproving,
  handleCustomerInfo,
  handleSupport,
  handleCheckboxChange,
  handleSelectAll,
  allChecked,
  // handleDelete,
}: TableListProps<T>): React.ReactElement => {
  const [data, setData] = useState<T[]>(initialData);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isProductTable = ["new", "parked", "delivered"].includes(dataType);

  useEffect(() => {
    if (fetchData) {
      fetchData(dataType).then((fetchedData) => setData(fetchedData));
    } else {
      setData(initialData);
    }
  }, [dataType, fetchData, initialData]);

  // These are fallbacks for when a caller does not pass a handler. They just
  // close the menu, matching the other defaults below — never a native alert().
  const defaultHandleEdit = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleView = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleReport = (id: string) => {
    setActiveMenu(null);
  };

  const defaultHandleViewBidders = (id: string) => {
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

  // const defaultHandleDelete = (id: string) => {
  //   if (window.confirm(`Are you sure you want to delete this ${dataType}?`)) {
  //     alert(`Delete ${dataType} with ID: ${id}`);
  //     setActiveMenu(null);
  //   }
  // };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="Table_Container"
    >
      <table className="Table_Style">
        <thead>
          <tr className="text-left text-[12px] font-normal font-montserrat text-[#2b2b2b] md:text-sm">
            {isProductTable && (
              <th className="py-3 pl-4 w-[50px] min-w-[50px]">
                <div className="relative w-5 h-5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-[1px] border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53] touch:p-2"
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
            <th className="py-1.5 px-2.5 min-w-[50px]"></th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((item, index) => (
            <motion.tr
              key={item.id}
              className="border-gray-200 border-b-[1px] py-1.5 px-4 relative cursor-pointer hover:bg-gray-50 transition-colors"
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              onClick={() => handleView && handleView(item.id)}
            >
              {isProductTable && (
                <td
                  className="py-1.5 pl-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-5 h-5">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange?.(item.id)}
                      className="w-5 h-5 rounded border-[1px] border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53]"
                    />
                    {item.checked && <TickIcon />}
                  </div>
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key as string}
                  className="py-1.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b]"
                >
                  {col.render ? col.render(item) : String(item[col.key])}
                </td>
              ))}
              <td
                className="py-1.5 px-4 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {ActionMenuComponent && (
                  <ActionMenuComponent
                    productId={item.id}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    handleView={
                      dataType === "farmers"
                        ? handleView || defaultHandleView
                        : undefined
                    }
                    handleEdit={
                      dataType === "farmers"
                        ? handleEdit || defaultHandleEdit
                        : undefined
                    }
                    handleReport={
                      dataType === "farmers"
                        ? handleReport || defaultHandleReport
                        : undefined
                    }
                    // handleDelete={
                    //   dataType === "farmers"
                    //     ? handleDelete || defaultHandleDelete
                    //     : undefined
                    // }
                    handleViewBidders={
                      dataType === "bids"
                        ? handleViewBidders || defaultHandleViewBidders
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
                      dataType === "pending" || dataType === "received"
                        ? handleCustomerCare || defaultHandleCustomerCare
                        : undefined
                    }
                    handleApprove={
                      dataType === "pending" ? handleApprove : undefined
                    }
                    isApproving={isApproving}
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
