"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { SearchIcon } from "@/icons/Icons";
import AdminTable, {
  ColumnConfig,
} from "../../../_components/table/AdminTableList";
import { Transaction } from "@/utils/TransactionDataTypes";
import { TransactionActionMenu } from "../TransactionActionMenu";

const statusPill = (item: Transaction) => {
  const s = (item.status || "").toLowerCase();
  const styles =
    s === "approved"
      ? "bg-green-50 text-green-600 border-green-100"
      : s === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : s === "failed"
      ? "bg-red-50 text-red-600 border-red-100"
      : s === "refunded"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : "bg-gray-50 text-gray-600 border-gray-200";
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
  return (
    <span
      className={`inline-block text-[10px] font-medium font-montserrat px-2 py-0.5 rounded-full border ${styles}`}
    >
      {label}
    </span>
  );
};

const productCell = (item: Transaction) => {
  if (!item.productName && !item.productImage) {
    return (
      <span className="text-[11px] font-montserrat text-[#808080]">—</span>
    );
  }
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-gray-100">
        {item.productImage ? (
          <Image
            src={item.productImage}
            alt={item.productName || "Product"}
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[8px] text-gray-400 font-montserrat">
            N/A
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] md:text-[12px] font-montserrat font-medium text-[#2b2b2b] capitalize truncate">
          {item.productName || "—"}
        </span>
        {item.productCount && item.productCount > 1 ? (
          <span className="text-[9px] md:text-[10px] font-montserrat text-[#808080]">
            +{item.productCount - 1} more
          </span>
        ) : null}
      </div>
    </div>
  );
};

const columns: ColumnConfig<Transaction>[] = [
  {
    key: "productName",
    header: "Product",
    render: productCell,
    minWidth: "min-w-[180px]",
  },
  {
    key: "fullname",
    header: "Sender",
    render: (item: Transaction) => (
      <div className="flex flex-col">
        <span className="text-[10px] sm:text-[11px] md:text-[12px] font-montserrat font-normal text-[#2b2b2b]">
          {item.fullname}
        </span>
        <span className="text-[9px] sm:text-[10px] md:text-[11px] font-montserrat font-normal text-[#808080]">
          {item.email}
        </span>
      </div>
    ),
    minWidth: "min-w-[180px]",
  },
  { key: "paidTo", header: "Paid To", minWidth: "min-w-[120px]" },
  { key: "paymentMethod", header: "Method", minWidth: "min-w-[100px]" },
  { key: "Amount", header: "Amount", minWidth: "min-w-[100px]" },
  {
    key: "status",
    header: "Status",
    minWidth: "min-w-[100px]",
    render: statusPill,
  },
  { key: "date", header: "Date", minWidth: "min-w-[100px]" },
];

interface FailedProps {
  transactions: Transaction[];
  handleApprove: (id: string) => void;
  handleDecline: (id: string) => void;
  handleCheckboxChange: (id: string) => void;
  handleSelectAll: () => void;
  allChecked: boolean;
  onRowClick?: (id: string) => void;
}

export const Failed: React.FC<FailedProps> = ({
  transactions,
  handleApprove,
  handleDecline,
  handleCheckboxChange,
  handleSelectAll,
  allChecked,
  onRowClick,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status !== "Failed") return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        t.fullname.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [transactions, searchTerm]);

  return (
    <div className="w-full mx-auto">
      <div className="w-full bg-[#FAF7F7] mt-4 py-4 px-6">
        <div className="relative w-full sm:max-w-[320px]">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] placeholder:font-montserrat"
            aria-label="Search transactions"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <SearchIcon stroke="#808080" className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="mt-6 w-full">
        <AdminTable<Transaction>
          dataType="TransactionalData"
          columns={columns}
          initialData={filteredTransactions}
          ActionMenuComponent={TransactionActionMenu}
          handleApprove={handleApprove}
          handleDecline={handleDecline}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
          allChecked={allChecked}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
};
