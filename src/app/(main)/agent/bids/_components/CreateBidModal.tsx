"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bidService } from "@/services/bidService";
import { productService, ApiProduct } from "@/services/productService";
import { toast } from "sonner";
import { SearchIcon } from "@/icons/Icons";
import { useModalA11y } from "@/hooks/useModalA11y";

interface CreateBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBidModal: React.FC<CreateBidModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, { onEscape: onClose });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { products } = await productService.getProducts({
          search: query,
          limit: 5,
        });
        setSearchResults(products);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectProduct = (selectedProduct: ApiProduct) => {
    setProduct(selectedProduct.id);
    setSearchQuery(selectedProduct.name);
    setPrice(selectedProduct.price);
    setQuantity(selectedProduct.quantity);
    setShowResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !price || !quantity) {
      toast.error("Please select a product and fill all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await bidService.createBid({
        productId: product,
        amount: Number(price),
        quantity: Number(quantity),
        message,
      });
      toast.success("Bid listing created successfully");

      // Reset form
      setProduct("");
      setSearchQuery("");
      setPrice("");
      setQuantity("");
      setMessage("");

      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to create bid listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] bg-opacity-50 flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-bid-title"
            className="bg-white rounded-[10px] w-full max-w-[500px] shadow-lg overflow-hidden flex flex-col min-h-[400px]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3
                id="create-bid-title"
                className="text-lg font-montserrat font-medium text-[#2b2b2b]"
              >
                Create Bid Listing
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
                <label className="text-sm font-medium text-gray-700">
                  Select Product
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search product by name..."
                    className="w-full p-2 pl-8 border border-gray-300 rounded focus:border-[#538e53] focus:outline-none"
                  />
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-[#538e53] border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>

                {/* Dropdown Results */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex flex-col border-b border-gray-50 last:border-none"
                      >
                        <span className="font-medium text-sm text-[#2b2b2b]">
                          {prod.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Qty: {prod?.quantity} • Price: ₦
                          {prod?.price?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {/* {product && (
                  <p className="text-xs text-green-600">
                    Selected ID: {product}
                  </p>
                )} */}
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/2">
                  <label className="text-sm font-medium text-gray-700">
                    Proposed Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#538e53] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2 w-1/2">
                  <label className="text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#538e53] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Enter a message about this listing..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#538e53] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !product}
                className="mt-4 w-full py-3 bg-[#538e53] text-white rounded font-medium hover:bg-[#476d47] disabled:bg-gray-400"
              >
                {isSubmitting ? "Creating..." : "Create Listing"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
