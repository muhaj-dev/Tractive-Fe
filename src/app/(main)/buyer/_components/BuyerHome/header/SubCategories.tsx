"use client";

import React from "react";

interface SubCategoriesProps {
  subCategories: string[];
  category: string;
  onSubCategoryClick: (subCat: string, category: string) => void;
  variant: "hover" | "clicked";
  setSelectedSubCategory: React.Dispatch<React.SetStateAction<string | null>>;
}

export const SubCategories: React.FC<SubCategoriesProps> = ({
  subCategories,
  category,
  onSubCategoryClick,
  variant,
  setSelectedSubCategory,
}) => {
  const handleSubCatClick = (subCat: string) => {
    onSubCategoryClick(subCat, category);
    setSelectedSubCategory(subCat);
  };

  return (
    <div className="relative w-full">
      <ul
        className={
          variant === "hover"
            ? "absolute left-1/2 -translate-x-1/2 w-48 bg-[#FEFEFE] border border-gray-200 rounded-[4px] p-2 mt-[-2px] z-10 lg:left-full md:translate-x-0"
            : "space-y-2 w-full mx-auto mt-2 px-2 md:max-w-full md:mx-0 md:pl-1.5 md:pr-2"
        }
      >
        {subCategories.map((subCat, subIndex) => (
          <li key={subIndex} className="py-1">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-[#2B2B2B] text-[0.89rem] font-normal hover:text-[#538E53] transition cursor-pointer"
              onClick={() => handleSubCatClick(subCat)}
            >
              <span className="text-[#2B2B2B] text-[0.6rem] sm:text-[0.7rem] mdtext-[0.89rem] font-normal hover:text-[#538E53] transition cursor-pointer">
                {subCat}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2B2B2B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
