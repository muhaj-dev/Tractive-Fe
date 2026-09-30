"use client";
import React, { useState } from "react";
import { SellerCard } from "./SellerCard";
import { useGetSellers } from "@/hooks/queries/useSellerQueries";
import { SellerListSkeleton } from "./SellerListSkeleton";
interface SellerListProps {
  selectedRatings: number[];
  selectedLocations: string[];
  selectedYears: string[];
}

export const SellerList: React.FC<SellerListProps> = ({
  selectedRatings,
  selectedLocations,
  selectedYears,
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 12;

  // Add debounce effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Extract primary filters to pass to API
  const rating = selectedRatings.length > 0 ? selectedRatings[0] : undefined;
  const state = selectedLocations.length > 0 ? selectedLocations[0] : undefined;
  let year: number | undefined = undefined;
  if (selectedYears.length > 0) {
    if (selectedYears[0] === "1-5 Years") year = 5;
    else if (selectedYears[0] === "6-10 Years") year = 10;
    else {
      const parsed = parseInt(selectedYears[0], 10);
      if (!isNaN(parsed)) year = parsed;
    }
  }

  // Reset page and accumulated list when filters or search change
  React.useEffect(() => {
    setPage(1);
    setAccumulatedSellers([]);
  }, [rating, state, year, debouncedSearch]);

  const { data: sellersResponse, isLoading, isError, isFetching } = useGetSellers({
    page,
    limit,
    search: debouncedSearch || undefined,
    state,
    rating,
    year,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [accumulatedSellers, setAccumulatedSellers] = useState<any[]>([]);

  React.useEffect(() => {
    const currentBatch = sellersResponse?.data || [];
    if (page === 1) {
      setAccumulatedSellers(currentBatch);
    } else if (currentBatch.length > 0) {
      setAccumulatedSellers((prev) => {
        const existingIds = new Set(prev.map((s) => s.sellerId));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newItems = currentBatch.filter((s: any) => !existingIds.has(s.sellerId));
        return [...prev, ...newItems];
      });
    }
  }, [sellersResponse, page]);

  if (isError && page === 1) {
    return (
      <div className="w-full text-center py-10 text-red-500">
        Failed to load sellers. Please try again later.
      </div>
    );
  }

  const pagination = sellersResponse?.pagination;
  const hasMore = pagination ? pagination.page * pagination.limit < pagination.total : (sellersResponse?.data || []).length === limit;

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedSellers = accumulatedSellers.map((seller: any) => ({
    id: seller.sellerId,
    image: seller.image || "",
    sellerName: seller.name,
    rating: seller.rating || 0,
    rateStatus: seller.rateStatus || "Not rated",
    sellerYear: seller.sellerYear || 0,
    productsCount: seller.productsCount || 0,
    sellerBio: seller.bio || "No bio available",
    location: seller.location || "Lagos",
  }));

  return (
    <div className="flex flex-col w-full sm:w-2/3 lg:w-[95%] gap-4 bg-[#fefefe] h-auto rounded-lg">
      <div className="flex flex-col justify-center gap-4 w-full px-4   pt-6 bg-[#fefefe]">
        <input
          type="text"
          placeholder="Search for sellers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-none sm:max-w-[400px] p-2 border border-[#808080] rounded-md text-[#2b2b2b] placeholder-[#808080] focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:border-transparent text-[12px] sm:text-[14px]"
        />
        <p className="mt-2 text-[14px] sm:text-[17px] font-normal font-montserrat text-[#808080]">
          Connect with Sellers
        </p>
      </div>
      <div className="Seller_Card">
        {isLoading && page === 1 ? (
          <SellerListSkeleton />
        ) : formattedSellers.length > 0 ? (
            formattedSellers.map((seller) => (
            <SellerCard
                key={seller.id}
                id={seller.id}
                image={seller.image}
                sellerName={seller.sellerName}
                rating={seller.rating}
                rateStatus={seller.rateStatus}
                sellerYear={seller.sellerYear}
                productsCount={seller.productsCount}
                sellerBio={seller.sellerBio}
            />
            ))
        ) : (
            <div className="w-full text-center py-10 text-gray-500">
                No sellers found.
            </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className={`px-8 py-3 rounded-full text-white font-medium transition-all ${
              isFetching 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg active:scale-95"
            }`}
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};
