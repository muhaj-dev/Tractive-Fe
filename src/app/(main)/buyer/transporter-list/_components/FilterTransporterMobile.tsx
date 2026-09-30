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
import { LocationIcon } from "@/icons/Icon1";

// Interface for icon props
interface IconProps {
  onClick?: () => void;
  isSelected?: boolean;
}

// Interface for FilterTransporterMobile props
interface FilterTransporterMobileProps {
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
      style={{ cursor: "pointer" }}
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

// FilterTransporterMobile component
export const FilterTransporterMobile: React.FC<
  FilterTransporterMobileProps
> = ({
  selectedRatings,
  setSelectedRatings,
  selectedLocations,
  setSelectedLocations,
  selectedYears,
  setSelectedYears,
}) => {
  const [pendingRatings, setPendingRatings] =
    useState<number[]>(selectedRatings);
  const [pendingLocations, setPendingLocations] =
    useState<string[]>(selectedLocations);
  const [pendingYears, setPendingYears] = useState<string[]>(selectedYears);
  const [openRating, setOpenRating] = useState<boolean>(false);
  const [openLocation, setOpenLocation] = useState<boolean>(false);
  const [openYears, setOpenYears] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Handle filter header toggle
  const handleFilterToggle = (): void => {
    setIsFilterOpen((prev) => !prev);
  };

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

  // Handle years click
  const handleYearsClick = (year: string): void => {
    setPendingYears((prev: string[]) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
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
  const years: string[] = ["Less than a year", "1-5 Years", "6-10 Years"];

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 0.4rem;
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
      <div className="flex sm:hidden w-full sm:w-2/3 lg:w-[95%] gap-4">
        <div className="flex flex-col gap-4 w-full">
          {/* Filter Header */}
          <button
            type="button"
            aria-expanded={isFilterOpen}
            className="flex justify-start w-[25%] items-center gap-2 cursor-pointer py-2"
            onClick={handleFilterToggle}
          >
            <FilterIcon />
            <p className="font-montserrat text-[14px] font-medium text-[#2b2b2b]">
              Filter
            </p>
          </button>

          {/* Filter Content */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{
                  scale: 0.1,
                  opacity: 0,
                  x: 0,
                  y: 0,
                  transformOrigin: "left top",
                }}
                animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                exit={{
                  scale: 0.1,
                  opacity: 0,
                  x: 0,
                  y: 0,
                  transformOrigin: "left top",
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  mass: 0.5,
                }}
                className="flex flex-col gap-4 rounded-lg shadow-lg p-4 bg-[#fefefe]"
              >
                {/* Rating Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <YellowStarIcon />
                      <span className="font-montserrat text-[14px] font-normal text-[#2b2b2b]">
                        Rating
                      </span>
                    </div>
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
                        className="flex flex-wrap gap-2"
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
                            className={`flex items-center gap-1 border-[1.5px] border-[#808080] py-1.5 px-3 rounded-full cursor-pointer ${
                              pendingRatings.includes(rating)
                                ? "bg-[#538e53] text-[#fefefe]"
                                : "text-[#2b2b2b]"
                            }`}
                            onClick={() => handleRatingClick(rating)}
                          >
                            <YellowStarIcon />
                            <span className="font-montserrat text-[12px] font-medium">
                              {rating.toFixed(1)}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Location Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <LocationIcon />
                      <span className="font-montserrat text-[14px] font-normal text-[#2b2b2b]">
                        Locations
                      </span>
                    </div>
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
                        className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar"
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
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer ${
                              pendingLocations.includes(location)
                                ? "bg-[#538e53] text-[#fefefe]"
                                : "text-[#2b2b2b]"
                            }`}
                            onClick={() => handleLocationClick(location)}
                          >
                            <CheckCircleIcon
                              isSelected={pendingLocations.includes(location)}
                            />
                            <span className="font-montserrat text-[12px] font-medium">
                              {location}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Years Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2b2b2b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2h12v6H6z" />
                        <path d="M4 4h16v16H4z" />
                      </svg>
                      <span className="font-montserrat text-[14px] font-normal text-[#2b2b2b]">
                        Years
                      </span>
                    </div>
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
                        className="flex flex-wrap gap-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        {years.map((year) => (
                          <button
                            type="button"
                            aria-pressed={pendingYears.includes(year)}
                            key={year}
                            className={`flex items-center gap-2 border-[1.5px] border-[#808080] py-1.5 px-3 rounded-full cursor-pointer ${
                              pendingYears.includes(year)
                                ? "bg-[#538e53] text-[#fefefe]"
                                : "text-[#2b2b2b]"
                            }`}
                            onClick={() => handleYearsClick(year)}
                          >
                            <CheckCircleIcon
                              isSelected={pendingYears.includes(year)}
                            />
                            <span className="font-montserrat text-[12px] font-medium">
                              {year}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
