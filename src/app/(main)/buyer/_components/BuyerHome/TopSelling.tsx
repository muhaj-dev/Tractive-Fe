"use client"

import React from "react";
import { useGetTopSellingProducts } from "@/hooks/queries/useProductQueries";
import Link from "next/link";
import { TopSellingProduct } from "@/services/productService";
import Image from "next/image";

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
  const lowerName = name.toLowerCase();
  for (const [key, src] of Object.entries(productImageMap)) {
    if (lowerName.includes(key)) return src;
  }
  return fallbackImages[index % fallbackImages.length];
};


export const TopSelling: React.FC = () => {
  const { data: topSellingResponse, isLoading } = useGetTopSellingProducts();
  const topSelling = topSellingResponse?.data || [];

  return (
    <div className="w-[90%] mx-auto rounded-lg mt-4">
      <div className="flex flex-col justify-between gap-3 mb-4 w-full">
        <p className="text-[15px] text-[#141414] font-normal font-montserrat">
          Top Selling (this month)
        </p>
        <div className="w-full grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full rounded-lg bg-gray-200 animate-pulse aspect-[2/1.4]" />
            ))
          ) : topSelling.length > 0 ? (
            topSelling.slice(0, 6).map((product: TopSellingProduct, index: number) => (
              <Link
                key={product.productId}
                href={`/buyer/product/${product.productId}`}
                className="block cursor-pointer transition-transform hover:scale-105 rounded-lg overflow-hidden"
              >
                <div
                  className="w-full aspect-[2/1] bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${product.image || (product.images && product.images.length > 0 ? product.images[0] : getProductImage(product.name, index))})` }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-2xl font-medium font-montserrat drop-shadow-md">
                    {product.name}
                  </span>
                </div>
              </Link>
              
            ))
          ) : (
            <>
              {fallbackImages.map((src, i) => (
                <div key={i}>
                  <Image
                    src={src}
                    alt="Product"
                    width={400}
                    height={200}
                    className="w-full h-auto rounded-md aspect-[2/1] object-cover"
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
