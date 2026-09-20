// components/table/ProductTable.tsx
"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import { ProductRow } from "./ProductRow";
import { TickIcon } from "./ProductRow";
import {
  Product,
  SearchFilters,
  ProductsResponse,
} from "@/services/productService";
import {
  useProducts,
  useDeleteProduct,
  useUpdateProductStatus,
} from "@/hooks/queries/useProductQueries";
import { EditProductModal } from "./EditProductModal";
import { toast } from "sonner";
import { ProductTableSkeleton } from "./ProductTableSkeleton";

interface ProductTableProps {
  filters: SearchFilters;
  onProductsUpdate: (counts: {
    active?: number;
    out_of_stock?: number;
  }) => void;
  onSelectionUpdate?: (selectedIds: string[]) => void;
  preFetchedData?: ProductsResponse;
  isLoadingProp?: boolean;
  onPageChange?: (page: number) => void;
  onRefetch?: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  filters,
  onProductsUpdate,
  onSelectionUpdate,
  preFetchedData,
  isLoadingProp,
  onRefetch,
  onPageChange,
}) => {
  // Use React Query hook for data fetching
  // We call it unconditionally to respect hooks rules, but we can utilize its data or the prop data
  const {
    data: queryData,
    isLoading: queryLoading,
    error,
    refetch: queryRefetch,
  } = useProducts(filters);
  const deleteProductMutation = useDeleteProduct();
  const updateStatusMutation = useUpdateProductStatus();

  // Determine which data to use (props usually take precedence if we are lifting state up)
  const data = preFetchedData || queryData;
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : queryLoading;
  const refetch = onRefetch || queryRefetch;

  const allProducts = useMemo(() => data?.products || [], [data?.products]);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  // When data changes, update the parent with total count for the current filter
  useEffect(() => {
    if (data?.total !== undefined) {
      if (filters.status === "available") {
        // Changed from 'active'
        onProductsUpdate({ active: data.total });
      } else if (filters.status === "out_of_stock") {
        onProductsUpdate({ out_of_stock: data.total });
      }
    }
  }, [data?.total, filters.status, onProductsUpdate]);

  // Derive products with checked state for rendering
  const products = useMemo(() => {
    return allProducts.map((p) => ({
      ...p,
      checked: selectedIds.has(p.id),
    }));
  }, [allProducts, selectedIds]);

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionUpdate) {
      onSelectionUpdate(Array.from(selectedIds));
    }
  }, [selectedIds, onSelectionUpdate]);

  // Function to handle copy ID to clipboard
  const copyToClipboard = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`Copied ID: ${id}`, {
      duration: 2000,
      position: "top-center",
    });
  }, []);

  // Function to handle checkbox toggle
  const handleCheckboxChange = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle select all checkbox
  const handleSelectAll = useCallback(() => {
    if (allProducts.length === 0) return;

    // Check if all are currently selected
    const allSelected = allProducts.every((p) => selectedIds.has(p.id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(allProducts.map((p) => p.id));
      setSelectedIds(newSet);
    }
  }, [allProducts, selectedIds]);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setModalMode("view"); // Reset mode
  }, []);

  // Function to handle edit - opens modal in EDIT mode
  const handleEdit = useCallback(
    (id: string) => {
      const productToEdit = allProducts.find((product) => product.id === id);
      if (productToEdit) {
        setSelectedProduct({
          ...productToEdit,
          checked: selectedIds.has(productToEdit.id),
        });
        setModalMode("edit");
        setIsEditModalOpen(true);
        setActiveMenu(null);
      }
    },
    [allProducts, selectedIds],
  );

  // Function to handle view - opens modal in VIEW mode
  const handleView = useCallback(
    (id: string) => {
      const productToView = allProducts.find((product) => product.id === id);
      if (productToView) {
        setSelectedProduct({
          ...productToView,
          checked: selectedIds.has(productToView.id),
        });
        setModalMode("view");
        setIsEditModalOpen(true);
        setActiveMenu(null);
      }
    },
    [allProducts, selectedIds],
  );

  // Handle product update from modal
  const handleProductUpdate = useCallback(() => {
    refetch(); // Refetch to update list
    handleCloseEditModal();
  }, [refetch, handleCloseEditModal]);

  // Function to handle delete single product

  // Function to handle delete single product
  // Confirmation is handled by the ActionMenu modal
  const handleDelete = useCallback(
    async (id: string) => {
      deleteProductMutation.mutate(id);
      setActiveMenu(null);
    },
    [deleteProductMutation],
  );

  // Function to handle status change (out of stock / back in stock)
  const handleOutOfStock = useCallback(
    async (id: string) => {
      const product = allProducts.find((p) => p.id === id);
      if (!product) return;

      const newStatus =
        product.status === "available" ? "out_of_stock" : "available";
      // Pass the row's product so the status change resends its other fields
      // instead of letting the API wipe the category (item 21).
      updateStatusMutation.mutate({ id, status: newStatus, existing: product });
      setActiveMenu(null);
    },
    [allProducts, updateStatusMutation],
  );

  // ... (edit handlers remain - uses service directly or we can add mutation for it later, but scope mainly focused on list actions)

  // Loading state
  // Loading state
  if (isLoading) {
    return <ProductTableSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-red-600">
        <p className="font-montserrat mb-3">
          {error.message || "An error occurred"}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-[#538e53] text-white rounded hover:bg-[#467846] font-montserrat transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12 text-gray-500">
        <p className="font-montserrat text-[16px] mb-2">No products found</p>
        <p className="font-montserrat text-[13px] text-gray-400">
          {filters.status === "available"
            ? "Add your first product to get started"
            : "No out of stock products"}
        </p>
      </div>
    );
  }

  // Calculate total pages
  const totalItems = data?.pagination?.total || data?.total || 0;
  const currentPage = data?.pagination?.page || filters.page || 1;
  const limit = data?.pagination?.limit || filters.limit || 10;
  const totalPages = Math.ceil(totalItems / limit);

  return (
    <>
      {/* Bulk Actions Bar */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="Table_Container"
      >
        <table className="Table_Style">
          <thead>
            <tr className="text-left text-[13px] font-normal font-montserrat text-[#2b2b2b] md:text-sm">
              <th className="py-3 pl-4 w-[50px] min-w-[50px]">
                <div className="relative w-5 h-5">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 && products.every((p) => p.checked)
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-[1px] border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53] touch:p-2 cursor-pointer"
                  />
                  {products.length > 0 && products.every((p) => p.checked) && (
                    <TickIcon />
                  )}
                </div>
              </th>
              <th className="py-1.5 px-4 min-w-[150px] font-montserrat font-normal">
                Item
              </th>
              <th className="py-1.5 px-4 min-w-[100px] sm:table-cell font-montserrat font-normal">
                ID
              </th>
              <th className="py-1.5 px-4 min-w-[100px] md:table-cell font-montserrat font-normal">
                Price
              </th>
              <th className="py-1.5 px-4 min-w-[100px] lg:table-cell font-montserrat font-normal">
                Stock
              </th>
              <th className="py-1.5 px-4 min-w-[100px] md:table-cell font-montserrat font-normal">
                Categories
              </th>
              <th className="py-1.5 px-4 min-w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <ProductRow
                key={product.id}
                product={product}
                index={index}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                copyToClipboard={copyToClipboard}
                handleCheckboxChange={handleCheckboxChange}
                handleEdit={handleEdit}
                handleView={handleView}
                handleOutOfStock={handleOutOfStock}
                handleDelete={handleDelete}
                isOutOfStockPage={filters.status === "out_of_stock"}
              />
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-500 font-montserrat">
            Showing {(currentPage - 1) * limit + 1} to{" "}
            {Math.min(currentPage * limit, totalItems)} of {totalItems} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show generic page window can be complex, for now simple wrapper or simple logic
                // If total pages is small, show all. If large, show window around current.
                // Keeping it simple: show current page + neighbours or just simplified
                let p = i + 1;
                if (totalPages > 5) {
                  // Center window around current
                  if (currentPage > 3) p = currentPage - 2 + i;
                  if (p > totalPages) p = i + (totalPages - 4); // Clamp to end
                }

                return (
                  <button
                    key={p}
                    onClick={() => onPageChange?.(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      currentPage === p
                        ? "bg-[#538e53] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() =>
                onPageChange?.(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        product={selectedProduct}
        onProductUpdate={handleProductUpdate}
        initialMode={modalMode}
      />
    </>
  );
};
