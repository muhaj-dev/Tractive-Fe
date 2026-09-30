"use client";

import React from "react";
import Link from "next/link";
import { RecommendationProduct } from "@/services/productService";

// Map product names to local fallback images
const productImageMap: Record<string, string> = {
  tomatoes: "/images/tomatoes.png",
  tomato: "/images/tomatoes.png",
  maize: "/images/maize.png",
  corn: "/images/maize.png",
  beans: "/images/Beans.png",
  bean: "/images/Beans.png",
  goat: "/images/goat.png",
  chicken: "/images/chicken.png",
  fish: "/images/fish.png",
};

const fallbackImages = [
  "/images/tomatoes.png",
  "/images/maize.png",
  "/images/Beans.png",
  "/images/goat.png",
  "/images/chicken.png",
  "/images/fish.png",
];

const getProductImage = (name: string, index: number): string => {
  if (!name) return fallbackImages[index % fallbackImages.length];
  const lowerName = name.toLowerCase();
  for (const [key, src] of Object.entries(productImageMap)) {
    if (lowerName.includes(key)) return src;
  }
  return fallbackImages[index % fallbackImages.length];
};

export const StoreRecommendation = ({ recommendations = [], isLoading = false }: { recommendations?: RecommendationProduct[], isLoading?: boolean }) => {

  return (
    <div className="flex flex-col w-full rounded-lg mt-4">
      <div className="w-[90%] flex flex-col justify-between mx-auto gap-3 mb-4">
        <p className="text-[13px] sm:text-[14px] md:text-[15px] text-[#141414] font-normal font-montserrat">
          Recommendations
        </p>
        <div className="w-full grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full rounded-lg bg-gray-200 animate-pulse aspect-[2/1]" />
            ))
          ) : recommendations.length > 0 ? (
            recommendations.slice(0, 6).map((product: RecommendationProduct, index: number) => (
              <Link
                key={product.id || product._id}
                href={`/buyer/product/${product.id || product._id}`}
                className="block cursor-pointer transition-transform hover:scale-105 rounded-lg overflow-hidden"
              >
                <div
                  className="w-full aspect-[2/1] bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${product.images?.[0] || getProductImage(product.name, index)})` }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-medium font-montserrat drop-shadow-md">
                    {product.name}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm font-montserrat col-span-full py-4 text-center">
              No recommendations available for this seller yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};