"use client";

import BidingCard from "@/components/cards/BidingCard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { productService, ApiProduct } from "@/services/productService";
import { toast } from "sonner";
import { formatUnitAfterQuantity } from "@/utils/productUnits";

// productCode1001

export const Biding = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Use a ref to prevent race conditions or duplicate fetches for the same page
  const loadingRef = useRef(false);

  // Changed to fetch 20 items per page and remove infinite scrolling.

  const fetchProducts = useCallback(async (pageToFetch: number) => {
    // Prevent duplicate requests
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await productService.getProducts({
        page: pageToFetch,
        limit: 20,
        status: "available",
      });

      const newProducts = response.products;
      const total = response.total || 0;

      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts((prev) => {
          // Deduplicate products based on ID to be safe
          const existingIds = new Set(prev.map((p) => p.id));
          const distinctNew = newProducts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...distinctNew];
        });

        // If we fetched fewer items than limit, or reached total, stop.
        if (
          newProducts.length < 20 ||
          (response.pagination &&
            response.pagination.page * response.pagination.limit >= total)
        ) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      setInitialLoadDone(true);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  const handleSeeMore = () => {
    if (hasMore && !isLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <div className="w-[90%] mx-auto py-6">
      <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
        All Products
      </p>

      {initialLoadDone && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-lg font-montserrat font-medium text-gray-700">
            No products found
          </p>
          <p className="text-sm font-montserrat mt-2 text-center max-w-sm">
            Check back later! New products are added frequently by our sellers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product, index) => {
            // Format price
            const formattedPrice = new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(product.price);

            // Use static assets for visual consistency with the design provided in BiddingDatas
            // These should eventually come from the backend or be conditional
            return (
              <div
                key={`${product.id}-${index}`}
                className="w-full"
              >
                <BidingCard
                  id={product.id}
                  image={product.images[0] || "/images/pp_onion.png"}
                  title={product.name}
                  time="Available" // Static for now as per "Product Listing" context
                  description={product.description}
                  timeImage="/images/redclock.png"
                  crownImage="/images/leadingcrown.png"
                  quantity={`${product.quantity} ${formatUnitAfterQuantity(product.unit, product.quantity) || "Units"}`}
                  amount={formattedPrice}
                  biddingPrice="" // Hide price beside view button
                  bottomLabel=""
                  showLeadingImages={false}
                  isWishlisted={product.isWishlisted}
                />
              </div>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center p-8 w-full">
          <div className="w-8 h-8 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {hasMore && initialLoadDone && products.length > 0 && !isLoading && (
        <div className="flex justify-center mt-8 w-full">
          <button
            onClick={handleSeeMore}
            className="border-2 border-[#538e53] text-[#538e53] hover:bg-[#538e53] hover:text-white px-8 py-2.5 rounded-md font-montserrat font-medium transition-colors"
          >
            See more
          </button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 text-gray-400 font-montserrat text-sm w-full">
          You&apos;ve reached the end of the list
        </div>
      )}
    </div>
  );
};





