// components/ProductOutOfStock.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, SearchIcon } from "@/icons/Icons";
import { ProductTable } from "./table/ProductTable";
import { AddToStore } from "../../_components/AddToStore";
import { SearchFilters } from "@/services/productService";
import {
  useBulkDeleteProducts,
  useBulkUpdateStatus,
} from "@/hooks/queries/useProductQueries";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  ConfirmActionModal,
  ConfirmActionTone,
} from "../../../admin/_components/ConfirmActionModal";

interface ProductOutOfStockProps {
  onProductsUpdate: (counts: { active: number; out_of_stock: number }) => void;
}

type BulkActionKind = "delete" | "back_in_stock";

// Copy + tone for the bulk confirmation modal. `n` is the number selected.
const BULK_COPY: Record<
  BulkActionKind,
  {
    title: string;
    description: (n: number) => string;
    confirmLabel: (n: number) => string;
    tone: ConfirmActionTone;
  }
> = {
  delete: {
    title: "Delete these products?",
    description: (n) =>
      `${n} product${n === 1 ? "" : "s"} will be permanently deleted. This cannot be undone.`,
    confirmLabel: (n) => `Yes, delete ${n}`,
    tone: "danger",
  },
  back_in_stock: {
    title: "Mark as back in stock?",
    description: (n) =>
      `${n} product${n === 1 ? "" : "s"} will be moved back to the Active tab and made visible to buyers again.`,
    confirmLabel: (n) => `Yes, restock ${n}`,
    tone: "success",
  },
};

export const ProductOutOfStock: React.FC<ProductOutOfStockProps> = ({
  onProductsUpdate,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    status: "out_of_stock",
    year: "",
    month: "",
    category: "",
    minPrice: undefined,
    maxPrice: undefined,
    from: "",
    to: "",
    page: 1,
    limit: 10,
  });

  /* Removed legacy year/month states and refs */
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {},
  );

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Hardcoded categories for now (should fetch from API ideally or shared constant)

  // Hardcoded categories for now (should fetch from API ideally or shared constant)
  const categories = [
    "Grains",
    "Fish",
    "Tubers",
    "Legumes",
    "LiveStocks",
    "Vegetables",
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update filters when inputs change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        category: selectedCategory,
        minPrice: priceRange.min ? Number(priceRange.min) : undefined,
        maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
        from: dateRange.from,
        to: dateRange.to,
        // status: preserve existing (don't overwrite)
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, priceRange, dateRange]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({ ...prev, [name]: value }));
  };

  // React Query Mutations for Bulk Actions
  const bulkDeleteMutation = useBulkDeleteProducts();
  const bulkUpdateStatusMutation = useBulkUpdateStatus();

  // Handle bulk back in stock operation
  // Bulk actions are destructive, so they open the themed ConfirmActionModal
  // instead of a native browser confirm(). The handlers below only stage the
  // action; `runPendingBulkAction` performs it once the user confirms.
  const [pendingBulk, setPendingBulk] = useState<BulkActionKind | null>(null);

  const handleBulkBackInStock = () => {
    if (selectedProductIds.length === 0) {
      toast.warning("Please select products to mark as back in stock", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }
    setPendingBulk("back_in_stock");
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) {
      toast.warning("Please select products to delete", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }
    setPendingBulk("delete");
  };

  const clearSelectionAndClose = () => {
    setSelectedProductIds([]);
    setPendingBulk(null);
  };

  const runPendingBulkAction = () => {
    if (pendingBulk === "delete") {
      bulkDeleteMutation.mutate(selectedProductIds, {
        onSuccess: clearSelectionAndClose,
      });
    } else if (pendingBulk === "back_in_stock") {
      bulkUpdateStatusMutation.mutate(
        { ids: selectedProductIds, status: "available" },
        { onSuccess: clearSelectionAndClose },
      );
    }
  };

  const isBulkSubmitting =
    bulkDeleteMutation.isPending || bulkUpdateStatusMutation.isPending;

  // Handle product selection updates from ProductTable
  const handleProductSelectionUpdate = useCallback((selectedIds: string[]) => {
    setSelectedProductIds(selectedIds);
  }, []);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dropdownVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full mx-auto">
      <AddToStore isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="w-full bg-[#FAF7F7] mt-4 py-4">
        {/* Top Row: Search & Buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-6 mb-4">
          {/* Search Input */}
          <div className="relative w-full md:w-[40%]">
            <input
              type="text"
              placeholder="Search"
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-8 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-[#538e53] placeholder:text-[#808080] font-montserrat"
              aria-label="Search out of stock products"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon stroke="#808080" className="w-4 h-4" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 justify-start md:justify-end overflow-x-auto w-full md:w-auto">
            <button
              onClick={handleBulkDelete}
              disabled={selectedProductIds.length === 0}
              className={`whitespace-nowrap px-4 py-2 opacity-[0.9] text-[#f9f9f9] text-[13px] font-normal rounded-[4px] transition-colors ${
                selectedProductIds.length === 0
                  ? "bg-[#b28362]/50 cursor-not-allowed"
                  : "bg-[#b28362] hover:bg-[#9f6f50]"
              }`}
            >
              Delete{" "}
              {selectedProductIds.length > 0
                ? `(${selectedProductIds.length})`
                : ""}
            </button>
            <button
              onClick={handleBulkBackInStock}
              disabled={selectedProductIds.length === 0}
              className={`whitespace-nowrap px-4 py-2 opacity-[0.9] text-[#f9f9f9] text-[13px] font-normal rounded-[4px] transition-colors ${
                selectedProductIds.length === 0
                  ? "bg-[#8B4513]/50 cursor-not-allowed"
                  : "bg-[#8B4513] hover:bg-[#7a3a10]"
              }`}
            >
              Back in Stock{" "}
              {selectedProductIds.length > 0
                ? `(${selectedProductIds.length})`
                : ""}
            </button>
            {/* <button
              onClick={() => setIsModalOpen(true)}
              className="whitespace-nowrap flex items-center gap-[7px] px-4 py-2 opacity-[0.9] bg-[#538e53] text-[#f9f9f9] text-[13px] font-normal rounded-[4px] transition-colors hover:bg-[#467a46]"
            >
              <AddToStoreIcon stroke="#fefefe" />
              Add Item
            </button> */}
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 px-6">
          {/* Category Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full px-3 py-2 border-[1px] bg-white border-[#808080] rounded-[4px] text-sm text-left flex justify-between items-center focus:outline-none focus:ring-[1px] focus:ring-[#538e53]"
            >
              <span className="truncate">{selectedCategory || "Category"}</span>
              <ArrowDownIcon className="w-4 h-4 text-gray-400" />
            </button>
            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-[4px] shadow-md max-h-48 overflow-y-auto"
                  variants={dropdownVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <div
                    onClick={() => {
                      setSelectedCategory("");
                      setIsCategoryOpen(false);
                    }}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-500"
                  >
                    All Categories
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryOpen(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selectedCategory === cat ? "bg-gray-100 font-medium" : ""}`}
                    >
                      {cat}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as
                  | "out_of_stock"
                  | "discontinued"
                  | "available",
                page: 1,
              }))
            }
            className="w-full px-3 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-[#538e53] bg-white font-montserrat"
          >
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>

          {/* Price Range */}
          <input
            type="number"
            name="min"
            placeholder="Min Price (₦)"
            value={priceRange.min}
            onChange={handlePriceChange}
            className="w-full px-3 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-[#538e53] font-montserrat"
          />
          <input
            type="number"
            name="max"
            placeholder="Max Price (₦)"
            value={priceRange.max}
            onChange={handlePriceChange}
            className="w-full px-3 py-2 border-[1px] border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-[#538e53] font-montserrat"
          />

          {/* Date Range */}
          {/* Date Range Picker */}
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={(range) => setDateRange(range)}
            className="sm:col-span-2"
          />
        </div>

        {/* Selection Info */}
        {selectedProductIds.length > 0 && (
          <div className="px-6 mt-3">
            <p className="text-sm text-[#8B4513] font-medium">
              {selectedProductIds.length} product(s) selected
            </p>
          </div>
        )}
      </div>
      <div className="mt-6">
        <ProductTable
          filters={filters}
          onProductsUpdate={onProductsUpdate}
          onSelectionUpdate={handleProductSelectionUpdate}
          onPageChange={handlePageChange}
        />
      </div>

      <ConfirmActionModal
        isOpen={pendingBulk !== null}
        title={pendingBulk ? BULK_COPY[pendingBulk].title : ""}
        description={
          pendingBulk
            ? BULK_COPY[pendingBulk].description(selectedProductIds.length)
            : undefined
        }
        confirmLabel={
          pendingBulk
            ? BULK_COPY[pendingBulk].confirmLabel(selectedProductIds.length)
            : ""
        }
        tone={pendingBulk ? BULK_COPY[pendingBulk].tone : "danger"}
        isSubmitting={isBulkSubmitting}
        onCancel={() => {
          if (!isBulkSubmitting) setPendingBulk(null);
        }}
        onConfirm={runPendingBulkAction}
      />
    </div>
  );
};
