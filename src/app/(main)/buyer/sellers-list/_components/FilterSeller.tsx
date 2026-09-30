"use client";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FilterIcon,
  YellowStarIcon,
} from "@/icons/Icons";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/Button";

// Interface for icon props
interface IconProps {
  onClick?: () => void;
  isSelected?: boolean;
}

// Interface for FilterSeller props
interface FilterSellerProps {
  selectedRatings: number[];
  setSelectedRatings: React.Dispatch<React.SetStateAction<number[]>>;
  selectedLocations: string[];
  setSelectedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  selectedYears: string[];
  setSelectedYears: React.Dispatch<React.SetStateAction<string[]>>;
}

// CheckCircleIcon component
export const CheckCircleIcon: React.FC<IconProps> = ({
  onClick,
  isSelected = false,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 25 24"
      fill={isSelected ? "#fefefe" : "none"}
      onClick={onClick}
      className="cursor-pointer"
    >
      <path
        d="M12.5 22C18 22 22.5 17.5 22.5 12C22.5 6.5 18 2 12.5 2C7 2 2.5 6.5 2.5 12C2.5 17.5 7 22 12.5 22Z"
        stroke={isSelected ? "#fefefe" : "#2B2B2B"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 11.9999L11.08 14.8299L16.75 9.16992"
        stroke="#2B2B2B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// FilterSeller component
export const FilterSeller: React.FC<FilterSellerProps> = ({
  selectedRatings,
  setSelectedRatings,
  selectedLocations,
  setSelectedLocations,
  selectedYears,
  setSelectedYears,
}) => {
  const [pendingRatings, setPendingRatings] = useState<number[]>(selectedRatings);
  const [pendingLocations, setPendingLocations] = useState<string[]>(selectedLocations);
  const [pendingYears, setPendingYears] = useState<string[]>(selectedYears);
  const [openRating, setOpenRating] = useState<boolean>(true);
  const [openLocation, setOpenLocation] = useState<boolean>(true);
  const [openYears, setOpenYears] = useState<boolean>(true);

  // Handle rating click
  const handleRatingClick = (rating: number): void => {
    setPendingRatings((prev: number[]) =>
      prev.includes(rating)
        ? prev.filter((r) => r !== rating)
        : [...prev, rating]
    );
  };

  // Handle rating toggle
  const handleRatingToggle = (): void => {
    setOpenRating((prev: boolean) => !prev);
  };

  // Handle location click
  const handleLocationClick = (location: string): void => {
    setPendingLocations((prev: string[]) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  // Handle location toggle
  const handleLocationToggle = (): void => {
    setOpenLocation((prev: boolean) => !prev);
  };

  // Handle years input change
  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setPendingYears(val ? [val] : []);
  };

  // Handle years toggle
  const handleYearsToggle = (): void => {
    setOpenYears((prev: boolean) => !prev);
  };

  // Apply filters
  const handleApplyFilters = (): void => {
    setSelectedRatings(pendingRatings);
    setSelectedLocations(pendingLocations);
    setSelectedYears(pendingYears);
  };

  // Reset filters
  const handleResetFilters = (): void => {
    setPendingRatings([]);
    setPendingLocations([]);
    setPendingYears([]);
    setSelectedRatings([]);
    setSelectedLocations([]);
    setSelectedYears([]);
  };

  // Data arrays
  const ratings: number[] = [5.0, 4.0, 3.0, 2.0, 1.0];
  const locations: string[] = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
    "FCT",
  ];
  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 0.5rem;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #538e53;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4a7a4a;
          }
          .custom-scrollbar {
            scrollbar-color: #538e53 #f1f1f1;
            scrollbar-width: thin;
          }
        `}
      </style>
      <div className="hidden sm:flex bg-[#fefefe] w-full sm:w-1/3 lg:w-1/4 rounded-lg">
        <div className="w-full flex flex-col gap-6 p-4">
          <div className="flex items-center gap-1">
            <p className="font-montserrat text-[14px] sm:text-[16px] font-normal text-[#2b2b2b]">
              Filter
            </p>
            <FilterIcon />
          </div>
          {/* ===== Filter by Rating ====== */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="font-montserrat text-[12px] sm:text-[14px] font-normal text-[#2b2b2b]">
                Filter by Rating
              </span>
              {openRating ? (
                <button
                  type="button"
                  onClick={handleRatingToggle}
                  aria-label="Filter by rating"
                  aria-expanded={true}
                  className="flex cursor-pointer"
                >
                  <ArrowUpIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRatingToggle}
                  aria-label="Filter by rating"
                  aria-expanded={false}
                  className="flex cursor-pointer"
                >
                  <ArrowDownIcon />
                </button>
              )}
            </div>
            <AnimatePresence>
              {openRating && (
                <motion.div
                  className="grid grid-cols-2 gap-2 w-[85%]"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {ratings.map((rating) => (
                    <button
                      type="button"
                      aria-pressed={pendingRatings.includes(rating)}
                      key={rating}
                      className={`flex items-center justify-center gap-1 border-[1.5px] border-[#808080] py-2 rounded-[4px] cursor-pointer ${
                        pendingRatings.includes(rating)
                          ? "bg-[#538e53] text-[#fefefe]"
                          : "text-[#2b2b2b]"
                      }`}
                      onClick={() => handleRatingClick(rating)}
                    >
                      <YellowStarIcon />
                      <span className="font-montserrat text-[10.5px] font-normal">
                        {rating.toFixed(1)}
                      </span>
                      <span className="font-montserrat text-[10.5px] font-normal">
                        Rating
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <hr className="text-[#f1f1f1]" />
          {/* ===== Filter by Location ====== */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="font-montserrat text-[12px] sm:text-[14px] font-normal text-[#2b2b2b]">
                Filter by Location
              </span>
              {openLocation ? (
                <button
                  type="button"
                  onClick={handleLocationToggle}
                  aria-label="Filter by location"
                  aria-expanded={true}
                  className="flex cursor-pointer"
                >
                  <ArrowUpIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLocationToggle}
                  aria-label="Filter by location"
                  aria-expanded={false}
                  className="flex cursor-pointer"
                >
                  <ArrowDownIcon />
                </button>
              )}
            </div>
            <AnimatePresence>
              {openLocation && (
                <motion.div
                  className="flex flex-col gap-1 w-[85%] max-h-[160px] overflow-y-scroll custom-scrollbar"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {locations.map((location) => (
                    <button
                      type="button"
                      aria-pressed={pendingLocations.includes(location)}
                      key={location}
                      className={`flex items-center gap-1 py-2 pl-1.5 rounded-[4px] w-[90%] cursor-pointer ${
                        pendingLocations.includes(location)
                          ? "bg-[#538e53] text-[#fefefe]"
                          : "text-[#2b2b2b]"
                      }`}
                      onClick={() => handleLocationClick(location)}
                    >
                      <span className="font-montserrat text-[10px] sm:text-[10.5px] font-normal">
                        {location}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <hr className="text-[#f1f1f1]" />
          {/* ===== Filter by Years ====== */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="font-montserrat text-[12px] sm:text-[14px] font-normal text-[#2b2b2b]">
                Filter by Years
              </span>
              {openYears ? (
                <button
                  type="button"
                  onClick={handleYearsToggle}
                  aria-label="Filter by years"
                  aria-expanded={true}
                  className="flex cursor-pointer"
                >
                  <ArrowUpIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleYearsToggle}
                  aria-label="Filter by years"
                  aria-expanded={false}
                  className="flex cursor-pointer"
                >
                  <ArrowDownIcon />
                </button>
              )}
            </div>
            <AnimatePresence>
              {openYears && (
                <motion.div
                  className="flex items-center gap-2 w-[85%]"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter max years"
                    value={pendingYears[0] || ""}
                    onChange={handleYearsChange}
                    className="w-full p-2 border-[1.5px] border-[#808080] rounded-[4px] text-[12px] sm:text-[14px] text-[#2b2b2b] focus:outline-none focus:border-[#538e53]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <hr className="text-[#e1e1e1]" />
          {/* ===== Filter Buttons ====== */}
          <div className="flex flex-col w-full gap-2 justify-center">
            <Button
              text="Apply Filter"
              onClick={handleApplyFilters}
              className="w-[100%] bg-[#538e53] justify-center text-[#fefefe] py-2 !rounded-[4px]"
              textClass="font-montserrat text-[12px] sm:text-[14px] font-normal"
            />
            <Button
              text="Reset Filter"
              onClick={handleResetFilters}
              className="w-[100%] bg-transparent !border-[1px] !border-[#538e53] justify-center hover:!text-[#fefefe] !text-[#2b2b2b] py-2 !rounded-[4px]"
              textClass="font-montserrat text-[12px] sm:text-[14px] font-normal"
            />
          </div>
        </div>
      </div>
    </>
  );
};
