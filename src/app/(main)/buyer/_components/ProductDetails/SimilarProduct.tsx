import BidingCard from "@/components/cards/BidingCard";
import React from "react";
import { useSimilarProducts } from "@/hooks/queries/useProductQueries";
import { ApiProduct } from "@/services/productService";
import { formatUnitAfterQuantity } from "@/utils/productUnits";

interface SimilarProductProps {
  productId: string;
}

export const SimilarProduct: React.FC<SimilarProductProps> = ({ productId }) => {
  const { data: similarProducts = [], isLoading } = useSimilarProducts(productId);

  if (isLoading) {
    return (
      <div className="py-6 min-h-[200px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (similarProducts.length === 0) {
    return (
      <div className="py-6">
        <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
          Similar Items
        </p>
        <p className="text-gray-500 text-sm font-montserrat">No similar items found.</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <p className="text-[15px] text-[#141414] font-normal font-montserrat mb-4">
        Similar Items
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {similarProducts.map((product: ApiProduct) => (
          <BidingCard
            id={product.id}
            key={product.id}
            image={product.images?.[0] || "/images/pp_onion.png"}
            title={product.name}
            description={product.description}
            crownImage="/images/leadingcrown.png"
            leadingProfileImage="/images/leadingProfileImage.png"
            quantity={product.quantity ? `${product.quantity} ${formatUnitAfterQuantity(product.unit, product.quantity) || 'Units'}` : 'N/A'}
            amount={`₦${product.price.toLocaleString()}`}
            // The list price, not a bid. Labelled as the starting price.
            biddingPrice={`₦${product.price.toLocaleString()}`}
            bottomLabel="Starting price:"
            showLeadingImages={false}
            isWishlisted={product.isWishlisted ?? product.wishlisted}
          />
        ))}
      </div>
    </div>
  );
};
