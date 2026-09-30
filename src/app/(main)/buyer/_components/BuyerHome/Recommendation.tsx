"use client";

import BidingCard from "@/components/cards/BidingCard";
import React from "react";
import { useGetRecommendations } from "@/hooks/queries/useProductQueries";
import { RecommendationProduct } from "@/services/productService";
import { formatUnitAfterQuantity } from "@/utils/productUnits";
import { formatCurrency } from "@/lib/format";

export const Recommendation = () => {
  const { data: recommendationsResponse, isLoading } = useGetRecommendations();
  // Depending on what the backend exactly returns, it could be either array type
  const recommendations = recommendationsResponse?.data || [];

  return (
    <div className="w-[90%] mx-auto py-6">
      <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
        Recommendations
      </p>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[280px] sm:min-w-[320px] h-80 bg-gray-200 animate-pulse rounded-lg snap-start" />
          ))
        ) : recommendations.length > 0 ? (
          recommendations.map((product: RecommendationProduct) => (
            <div key={product.id || product._id} className="min-w-[280px] sm:min-w-[320px] snap-start">
              <BidingCard
              key={product.id || product._id}
              id={product.id || product._id}
              image={product.images?.[0] || "/images/tomatoes.png"}
              title={product.name}
              description={`${product.quantity} ${formatUnitAfterQuantity(product.unit, product.quantity) || 'units'} available from ${product.owner?.name || product.farmer?.name || 'Seller'}`}
              crownImage="/images/leadingcrown.png"
              leadingProfileImage={product.owner?.image || "/images/sellersProfiles.png"}
              quantity={`${product.quantity} ${formatUnitAfterQuantity(product.unit, product.quantity) || 'units'}`}
              amount={formatCurrency(product.price)}
              // The list price, not a bid. Labelled as the starting price.
              biddingPrice={formatCurrency(product.price)}
              bottomLabel="Starting price:"
              showLeadingImages={false}
              imageClass="h-[200px] object-cover"
              isWishlisted={product.isWishlisted ?? product.wishlisted}
            />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm font-montserrat col-span-full">
            No recommendations available at the moment.
          </p>
        )}
      </div>
    </div>
  );
};
