// components/table/ProductRow.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import { ActionMenu } from "./ActionMenu";
import Image from "next/image";
import { Product } from "@/services/productService";
import { formatQuantityWithUnit } from "@/utils/productUnits";
import { formatCurrency } from "@/lib/format";

// Animation variants for table rows
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface ProductRowProps {
  product: Product;
  index: number;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  copyToClipboard: (id: string) => void;
  handleCheckboxChange: (id: string) => void;
  handleEdit: (id: string) => void;
  handleView: (id: string) => void;
  handleOutOfStock: (id: string) => void;
  handleDelete: (id: string) => void;
  isOutOfStockPage: boolean;
}

export const TickIcon = () => {
  return (
    <svg
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
      viewBox="0 0 16 16"
      fill="#fefefe"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.4 11.2L3.2 8L2 9.2L6.4 13.6L14 6L12.8 4.8L6.4 11.2Z"
        stroke="#fefefe"
        strokeWidth="1"
      />
    </svg>
  );
};

export const IdCopyIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 18 18"
      fill="none"
      className="cursor-pointer"
    >
      <g clipPath="url(#clip0_10196_93765)">
        <path
          d="M12 0.75H3C2.175 0.75 1.5 1.425 1.5 2.25V12.75H3V2.25H12V0.75ZM11.25 3.75H6C5.175 3.75 4.5075 4.425 4.5075 5.25L4.5 15.75C4.5 16.575 5.1675 17.25 5.9925 17.25H14.25C15.075 17.25 15.75 16.575 15.75 15.75V8.25L11.25 3.75ZM6 15.75V5.25H10.5V9H14.25V15.75H6Z"
          fill="#2B2B2B"
        />
      </g>
      <defs>
        <clipPath id="clip0_10196_93765">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const StarStrokeIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
    >
      <rect width="20" height="20" fill="white" />
      <path
        d="M11.4421 2.9252L12.9087 5.85853C13.1087 6.26686 13.6421 6.65853 14.0921 6.73353L16.7504 7.1752C18.4504 7.45853 18.8504 8.69186 17.6254 9.90853L15.5587 11.9752C15.2087 12.3252 15.0171 13.0002 15.1254 13.4835L15.7171 16.0419C16.1837 18.0669 15.1087 18.8502 13.3171 17.7919L10.8254 16.3169C10.3754 16.0502 9.63375 16.0502 9.17541 16.3169L6.68375 17.7919C4.90041 18.8502 3.81708 18.0585 4.28375 16.0419L4.87541 13.4835C4.98375 13.0002 4.79208 12.3252 4.44208 11.9752L2.37541 9.90853C1.15875 8.69186 1.55041 7.45853 3.25041 7.1752L5.90875 6.73353C6.35041 6.65853 6.88375 6.26686 7.08375 5.85853L8.55041 2.9252C9.35041 1.33353 10.6504 1.33353 11.4421 2.9252Z"
        fill="#F4F400"
        stroke="#2B2B2B"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Helper function to slice description to three words
const sliceDescription = (description: string): string => {
  if (!description) return "-";
  const words = description.split(/\s+/).filter((word) => word.length > 0);
  return words.slice(0, 3).join(" ") + (words.length > 3 ? "..." : "");
};

// Helper function to truncate ID to 10 characters
const truncateId = (id: string): string => {
  if (!id) return "-";
  return id.length > 10 ? id.substring(0, 10) + "..." : id;
};

// Format price with proper currency
const formatPrice = (price: number): string =>
  formatCurrency(price, { decimals: 2 });

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  index,
  activeMenu,
  setActiveMenu,
  copyToClipboard,
  handleCheckboxChange,
  handleEdit,
  handleView,
  handleOutOfStock,
  handleDelete,
  isOutOfStockPage,
}) => {
  // Get first image or default
  const getSafeImage = (img?: string) => {
    if (!img || typeof img !== "string") return "/images/tomatoProduct.png";
    if (img.startsWith("http") || img.startsWith("/")) return img;
    return `/images/${img}`; // Fallback for relative paths without leading slash
  };

  const rawImage =
    product.images && product.images.length > 0 ? product.images[0] : null;
  const productImage = getSafeImage(rawImage || undefined);

  return (
    <motion.tr
      className="border-gray-200 border-b-[1px] py-1.5 px-4 relative hover:bg-gray-50 transition-colors cursor-pointer"
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
      onClick={() => handleView(product.id)}
    >
      {/* Checkbox */}
      <td
        className="py-1.5 pl-4 whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-5 h-5">
          <input
            type="checkbox"
            checked={product.checked}
            onChange={() => handleCheckboxChange(product.id)}
            className="w-5 h-5 rounded border-[1px] border-gray-300 text-[#538e53] focus:ring-[#538e53] focus:ring-[1px] appearance-none checked:bg-[#538e53] checked:border-[#538e53] cursor-pointer"
            aria-label={`Select ${product.name}`}
          />
          {product.checked && <TickIcon />}
        </div>
      </td>

      {/* Item (Image + Name + Description) */}
      <td className="py-1.5 pr-4">
        <div className="flex items-center gap-2">
          <div className="relative w-[53px] h-[30px] sm:w-[63px] sm:h-[35px] lg:w-[87px] lg:h-[47px] flex-shrink-0">
            <Image
              src={productImage}
              alt={product.name}
              fill
              className="object-cover rounded"
              sizes="(max-width: 640px) 53px, (max-width: 1024px) 63px, 87px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-normal truncate font-montserrat text-[#2b2b2b]">
              {product.name}
            </p>
            <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-normal truncate font-montserrat text-[#808080]">
              {sliceDescription(product.description || "")}
            </p>
          </div>
        </div>
      </td>

      {/* ID */}
      <td className="py-1.5 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 cursor-pointer">
          <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#2b2b2b]">
            {truncateId(product.id || "")}
          </span>
          <button
            onClick={() => copyToClipboard(product.id)}
            title="Copy Product ID"
            aria-label="Copy Product ID"
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <IdCopyIcon />
          </button>
        </div>
      </td>

      {/* Price */}
      <td className="py-1.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#2b2b2b]">
        {formatPrice(product.price)}
      </td>

      {/* Quantity / Stock */}
      <td className="py-1.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#2b2b2b]">
        {product.quantity
          ? formatQuantityWithUnit(product.quantity, product.unit)
          : "-"}
      </td>

      {/* Categories */}
      <td className="py-1.5 px-4 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-montserrat font-normal text-[#2b2b2b]">
        {product.categories && product.categories.length > 0
          ? product.categories.join(", ")
          : "-"}
      </td>

      {/* Action Menu */}
      <td className="py-1.5 px-4 relative" onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          productId={product.id}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          handleEdit={handleEdit}
          handleOutOfStock={handleOutOfStock}
          handleDelete={handleDelete}
          isOutOfStockPage={isOutOfStockPage}
        />
      </td>
    </motion.tr>
  );
};
