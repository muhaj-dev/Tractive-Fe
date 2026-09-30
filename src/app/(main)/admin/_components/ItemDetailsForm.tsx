"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
// Adjust import path
import { ArrowDownIcon, ArrowUpIcon } from "../../../../icons/Icons";
import { ArrowLeftIcon } from "../../agent/_components/Icons/AgentIcons";
// import { ArrowLeftIcon } from "../../../agents/_components/Icons/AgentIcons";

// Props for ItemDetailsForm
interface ItemDetailsFormProps {
  onBack: () => void;
  onClose: () => void;
  selectedCategory: string | null;
  selectedProduce: string | null;
  selectedProfiles: number[];
}

// Unit type
type Unit = "Kilogram" | "Metric Ton" | "Megagram";

// Weight options type (alternative: explicit keys instead of mapped type)
interface WeightOptions {
  Kilogram: string[];
  "Metric Ton": string[];
  Megagram: string[];
}

export const ItemDetailsForm: React.FC<ItemDetailsFormProps> = ({
  onBack,
  onClose,
  selectedCategory,
  selectedProduce,
  selectedProfiles,
}) => {
  const formRef = useRef<HTMLFormElement>(null); // Explicitly type as HTMLFormElement
  const weightDropdownRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [totalWeight, setTotalWeight] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");
  const [isWeightOpen, setIsWeightOpen] = useState<boolean>(false);

  // Weight options
  const weightOptions: WeightOptions = {
    Kilogram: ["1", "5", "10", "25", "50", "100"],
    "Metric Ton": ["0.001", "0.005", "0.01", "0.025", "0.05", "0.1"],
    Megagram: ["0.001", "0.005", "0.01", "0.025", "0.05", "0.1"],
  };

  // Handle unit change
  const handleUnitChange = (selectedUnit: Unit): void => {
    setUnit(selectedUnit);
    setTotalWeight(null); // Reset weight when unit changes
  };

  // Handle weight selection
  const handleWeightSelect = (weight: string): void => {
    setTotalWeight(weight);
    setIsWeightOpen(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Implement upload logic here
    onClose();
  };

  // Close weight dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        weightDropdownRef.current &&
        !weightDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWeightOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsWeightOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="py-4 px-4 sm:px-12"
    >
      <div className="flex items-center mb-4">
        <div
          onClick={onBack}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              onBack();
            }
          }}
          className="flex items-center justify-center rounded-[100px] py-[4px] px-[8px] w-[35px] h-[35px] bg-[#f1f1f1] cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <ArrowLeftIcon />
        </div>
      </div>
      <h2 className="text-[15px] font-normal text-center text-[#808080] font-montserrat mb-4">
        Item Details
      </h2>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-[694px] mx-auto"
      >
        {/* Available */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="available"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Available
          </label>
          <input
            type="text"
            id="available"
            value={available}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAvailable(e.target.value)
            }
            className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat"
            placeholder="Enter availability"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="description"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat h-[100px] resize-none"
            placeholder="Enter description"
          />
        </div>

        {/* Unit Checkboxes */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-normal text-[#2b2b2b] font-montserrat">
            Unit
          </label>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar">
            {(["Kilogram", "Metric Ton", "Megagram"] as const).map((u) => (
              <label
                key={u}
                className="flex items-center gap-2 text-[11px] sm:text-[14px] font-normal text-[#2b2b2b] font-montserrat"
              >
                <input
                  type="checkbox"
                  name="unit"
                  value={u}
                  checked={unit === u}
                  onChange={() => handleUnitChange(u)}
                  className="accent-[#538e53]"
                />
                {u}
              </label>
            ))}
          </div>
        </div>

        {/* Total Weight and Price */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Total Weight Dropdown */}
          <div
            ref={weightDropdownRef}
            className="relative w-full md:w-1/2 flex flex-col gap-2"
          >
            <label className="text-[14px] font-normal text-[#2b2b2b] font-montserrat">
              Total Weight
            </label>
            <div
              onClick={() => unit && setIsWeightOpen((prev) => !prev)}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (unit && (e.key === "Enter" || e.key === " ")) {
                  setIsWeightOpen((prev) => !prev);
                }
              }}
              className={`flex items-center justify-between w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 cursor-pointer ${
                !unit ? "opacity-50 cursor-not-allowed" : ""
              }`}
              role="button"
              tabIndex={0}
            >
              <span className="text-[14px] font-normal text-[#2b2b2b] font-montserrat">
                {totalWeight && unit
                  ? `${totalWeight} ${unit}`
                  : "Select Weight"}
              </span>
              {isWeightOpen && unit ? <ArrowUpIcon /> : <ArrowDownIcon />}
            </div>
            {isWeightOpen && unit && (
              <div className="absolute z-10 w-full bg-[#fefefe] border-[1px] border-[#2b2b2b] rounded-[4px] mt-1 max-h-[200px] overflow-y-auto top-full">
                {weightOptions[unit].map((weight) => (
                  <div
                    key={weight}
                    onClick={() => handleWeightSelect(weight)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleWeightSelect(weight);
                      }
                    }}
                    className="px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat hover:bg-[#f1f1f1] cursor-pointer"
                    role="option"
                    aria-selected
                    tabIndex={0}
                  >
                    {weight} {unit}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Input */}
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <label
              htmlFor="price"
              className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
            >
              Price
            </label>
            <input
              type="text"
              id="price"
              value={price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPrice(e.target.value)
              }
              className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat"
              placeholder="Enter price"
            />
          </div>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          className="flex items-center justify-center bg-[#538e53] text-[#fefefe] mx-auto w-full font-montserrat font-normal text-[16px] rounded-[4px] p-[0.7rem]"
        >
          Upload
        </button>
      </form>
    </motion.div>
  );
};
