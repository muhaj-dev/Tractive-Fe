"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons/Icons";
import {
  XModalIcon,
} from "./Icons/AgentIcons";
import { ItemDetailsForm } from "./ItemDetailsForm";
import { MediaUpload } from "./MediaUpload";
import { useFarmers } from "@/hooks/queries/useFarmerQueries";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { toast } from "sonner";

interface AddToStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const AddToStore: React.FC<AddToStoreProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const farmerDropdownRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch farmers using the query hook
  const { data: farmersData, isLoading: isLoadingFarmers } = useFarmers();
  const farmers = farmersData?.farmers || [];

  // Category reference data (shared endpoint). While the backend endpoint is
  // still being wired we fall back to the previous hardcoded names so the
  // modal keeps working; once it returns data, the picker and dependent
  // subcategory dropdown are driven entirely by the API.
  const { data: categoriesData } = useCategories();

  const [farmerSearchQuery, setFarmerSearchQuery] = useState<string>("");
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  // Inline required-field validation: an entry here turns the field's border
  // red and renders a message below it (cleared as soon as the field changes).
  const [errors, setErrors] = useState<{
    farmer?: string;
    productName?: string;
    category?: string;
    images?: string;
  }>({});
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [isFarmerOpen, setIsFarmerOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [isConfirmingDiscard, setIsConfirmingDiscard] =
    useState<boolean>(false);

  // Filter farmers
  const filteredFarmers = farmers.filter((farmer) =>
    farmer.name.toLowerCase().includes(farmerSearchQuery.toLowerCase()),
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const videoInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const FALLBACK_CATEGORIES = [
    "Grains",
    "Fish",
    "Tubers",
    "Legumes",
    "LiveStocks",
    "Vegetables",
  ];

  // Prefer API categories; fall back to the static names until the endpoint
  // returns data.
  const apiCategories = categoriesData ?? [];
  const categories: string[] =
    apiCategories.length > 0
      ? apiCategories.map((c) => c.name)
      : FALLBACK_CATEGORIES;

  // Subcategories for the currently selected category (empty ⇒ show the
  // free-text input instead of a dropdown).
  const selectedCategorySubcategories =
    apiCategories.find((c) => c.name === selectedCategory)?.subcategories ?? [];

  const handleFarmerSelect = (farmerId: string): void => {
    const farmer = farmers.find((f) => f.id === farmerId);
    if (farmer) {
      setFarmerSearchQuery(farmer.name);
    }
    setSelectedFarmerId(farmerId);
    setIsFarmerOpen(false);
    setErrors((prev) => ({ ...prev, farmer: undefined }));
  };

  const handleCategorySelect = (category: string): void => {
    setSelectedCategory(category);
    // Reset the subcategory — it's scoped to the previously selected category.
    setSubcategory("");
    setIsCategoryOpen(false);
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const handleImagesSelect = (files: File[]): void => {
    if (files.length > 0) {
      const newFiles: File[] = [];
      const newPreviews: string[] = [];

      files.forEach((file) => {
        if (!file.type.startsWith("image/")) {
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} is too large (>5MB)`);
          return;
        }
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });

      setImageFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      if (newFiles.length > 0)
        setErrors((prev) => ({ ...prev, images: undefined }));
    }
  };

  const handleVideoSelect = (file: File): void => {
    if (file) {
      if (videoFiles.length >= 1) {
        toast.error("Only one video is allowed.");
        return;
      }

      const validTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/avi",
      ];
      if (!file.type.startsWith("video/") && !validTypes.includes(file.type)) {
        toast.error("Please select a valid video file (mp4, mov, avi)");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video size should be less than 50MB");
        return;
      }

      setVideoFiles([file]); // Replace or set
      setVideoPreviews([URL.createObjectURL(file)]);
    }
  };

  const removeImage = (indexToRemove: number): void => {
    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      // Revoke object URL for the removed image to avoid memory leak
      if (prev[indexToRemove]) URL.revokeObjectURL(prev[indexToRemove]);
      return newPreviews;
    });
  };

  const removeVideo = (indexToRemove: number): void => {
    setVideoFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setVideoPreviews((prev) => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      // Revoke object URL for the removed video to avoid memory leak
      if (prev[indexToRemove]) URL.revokeObjectURL(prev[indexToRemove]);
      return newPreviews;
    });
  };

  const handleNext = (): void => {
    const nextErrors: typeof errors = {};
    if (!selectedFarmerId) nextErrors.farmer = "Please select a farmer";
    if (!productName.trim())
      nextErrors.productName = "Please enter a product name";
    if (!selectedCategory) nextErrors.category = "Please select a category";
    // A listing with no photograph is not usable in the marketplace — buyer cards
    // fall back to a generic placeholder, so the product looks broken rather than
    // absent. Enforced here because this is the step that owns the media picker.
    if (imageFiles.length === 0)
      nextErrors.images = "Please add at least one image of the product";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setCurrentStep(2);
  };

  const handleBack = (): void => {
    setCurrentStep(1);
  };

  // Anything the agent has actually typed, picked or attached. Reaching step 2
  // counts on its own — step 1 cannot be passed without a farmer, a name and a
  // category, and step 2 holds further input this component cannot see.
  const hasUnsavedInput =
    currentStep === 2 ||
    Boolean(selectedFarmerId) ||
    farmerSearchQuery.trim() !== "" ||
    productName.trim() !== "" ||
    Boolean(selectedCategory) ||
    subcategory.trim() !== "" ||
    imageFiles.length > 0 ||
    videoFiles.length > 0;

  const resetForm = (): void => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    videoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setFarmerSearchQuery("");
    setSelectedFarmerId(null);
    setSelectedCategory(null);
    setSubcategory("");
    setProductName("");
    setErrors({});
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFiles([]);
    setVideoPreviews([]);
    setCurrentStep(1);
  };

  // A stray click on the backdrop used to throw away a part-filled form with no
  // warning. Ask first whenever there is something to lose.
  const requestClose = (): void => {
    if (hasUnsavedInput) {
      setIsConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  const confirmDiscard = (): void => {
    setIsConfirmingDiscard(false);
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent): void => {
      // While the discard prompt is up it owns the interaction — a click on the
      // backdrop must not close anything behind it.
      if (isConfirmingDiscard) return;
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        requestClose();
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        farmerDropdownRef.current &&
        !farmerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFarmerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Keep Tab inside the dialog. Without this, focus walks the whole obscured page
      // behind the modal — measured at 57 tab stops before reaching the close button.
      if (event.key === "Tab") {
        const root = modalRef.current;
        if (!root) return;
        const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
          (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!root.contains(active)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (event.key !== "Escape") return;
      if (isConfirmingDiscard) {
        setIsConfirmingDiscard(false);
        return;
      }
      setIsCategoryOpen(false);
      setIsFarmerOpen(false);
      requestClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // `requestClose` is recreated each render; the effect re-registers with the
    // current one whenever the inputs it reads change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, isOpen, isConfirmingDiscard, hasUnsavedInput]);

  // Move focus into the dialog when it opens, lock the page behind it, and hand focus
  // back to whatever opened it on close — otherwise a keyboard user is left where they
  // started, with a dialog on screen they have to tab across the page to reach.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#2b2b2bbc] flex items-center justify-center z-50 p-4"
        >
          {/* A static aria-label rather than aria-labelledby: step 1 is headed "Item
              upload" and step 2 "Item Details", so any single heading id would dangle
              on the other step. */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Add item to store"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-[#fefefe] rounded-lg w-full max-w-[600px] md:max-w-[721px] overflow-y-auto max-h-[90vh] hide-scrollbar"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={requestClose}
              aria-label="Close item upload"
              className="absolute top-4 right-4 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#538e53]"
            >
              <XModalIcon className="w-5 h-5" />
            </button>

            {isConfirmingDiscard && (
              <div className="absolute inset-0 z-20 bg-[#2b2b2bbc] flex items-center justify-center p-4 rounded-lg">
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="discard-item-title"
                  className="bg-[#fefefe] rounded-lg w-full max-w-[360px] p-5 flex flex-col gap-3 shadow-lg"
                >
                  <h3
                    id="discard-item-title"
                    className="font-montserrat text-[15px] font-semibold text-[#2b2b2b]"
                  >
                    Discard this item?
                  </h3>
                  <p className="font-montserrat text-[12px] text-[#808080]">
                    You have details filled in. Closing now will lose them.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDiscard(false)}
                      className="font-montserrat text-[13px] text-[#2b2b2b] px-4 py-2 rounded-[4px] border border-[#e2e2e2] hover:bg-[#f5f5f5] cursor-pointer"
                    >
                      Keep editing
                    </button>
                    <button
                      type="button"
                      onClick={confirmDiscard}
                      className="font-montserrat text-[13px] text-[#fefefe] bg-[#c0392b] hover:bg-[#a93226] px-4 py-2 rounded-[4px] cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="p-4 md:p-6 space-y-4">
                <h2 className="text-sm md:text-[15px] pt-2 font-normal text-center text-[#808080] font-montserrat">
                  Item upload
                </h2>

                {/* Farmer Selection (Replaces Profile Section) */}
                <div className="w-[88%] mx-auto">
                  <label className="text-[14px] font-normal text-[#2b2b2b] font-montserrat mb-1 block">
                    Select Farmer
                  </label>
                  {/* A product cannot be listed without a farmer, and a brand new
                      agent has none — previously the picker just sat there empty
                      with no explanation of why nothing could be listed. */}
                  {!isLoadingFarmers && farmers.length === 0 && (
                    <div className="mb-2 px-3 py-2.5 rounded-[5px] bg-[#fff8e6] border border-[#f0dca8]">
                      <p className="font-montserrat text-[12px] text-[#2b2b2b]">
                        You need to add a farmer before you can list a product —
                        every product is tied to the farmer who grew it.
                      </p>
                      <Link
                        href="/agent/farmers"
                        onClick={onClose}
                        className="inline-block mt-1.5 font-montserrat text-[12px] font-medium text-[#538e53] underline underline-offset-2 hover:text-[#3a6b3a] cursor-pointer"
                      >
                        Add your first farmer →
                      </Link>
                    </div>
                  )}
                  <div ref={farmerDropdownRef} className="relative w-full">
                    {/* Search Input Trigger */}
                    <div className="relative">
                      <input
                        type="text"
                        value={farmerSearchQuery}
                        onChange={(e) => {
                          setFarmerSearchQuery(e.target.value);
                          setIsFarmerOpen(true);
                          setSelectedFarmerId(null); // Clear selection on type? Or keep? clearing is safer for strict select
                        }}
                        onClick={() => setIsFarmerOpen(true)}
                        placeholder="Search farmer by name..."
                        aria-invalid={!!errors.farmer}
                        className={`w-full border rounded px-3 py-2 text-sm font-normal text-[#2b2b2b] font-montserrat bg-white focus:outline-none pr-8 ${
                          errors.farmer
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#2b2b2b] focus:border-[#538e53]"
                        }`}
                      />
                      <div
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setIsFarmerOpen(!isFarmerOpen)}
                      >
                        {isFarmerOpen ? (
                          <ArrowUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {isFarmerOpen && (
                      <div className="absolute z-10 w-full bg-[#fefefe] border border-[#2b2b2b] rounded mt-1 max-h-[200px] overflow-y-auto shadow-lg">
                        {isLoadingFarmers ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Loading farmers...
                          </div>
                        ) : farmers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            You have no farmers yet — add one first.
                          </div>
                        ) : filteredFarmers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No farmers found matching &quot;{farmerSearchQuery}&quot;
                          </div>
                        ) : (
                          filteredFarmers.map((farmer) => (
                            <div
                              key={farmer.id}
                              onClick={() => handleFarmerSelect(farmer.id)}
                              className={`px-3 py-2 text-sm font-normal font-montserrat hover:bg-[#f1f1f1] cursor-pointer ${selectedFarmerId === farmer.id ? "bg-[#f1f1f1]" : ""}`}
                            >
                              {farmer.name} ({farmer.mobile})
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.farmer && (
                    <p className="text-red-500 text-[12px] font-montserrat mt-1">
                      {errors.farmer}
                    </p>
                  )}
                </div>

                {/* Product section */}
                <div className="flex flex-col sm:flex-row w-[88%] mx-auto items-start justify-center gap-4">
                  <div className="w-full md:w-1/2">
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        if (errors.productName)
                          setErrors((prev) => ({
                            ...prev,
                            productName: undefined,
                          }));
                      }}
                      aria-invalid={!!errors.productName}
                      className={`w-full border rounded px-3 py-2 text-sm font-normal text-[#2b2b2b] font-montserrat focus:outline-none ${
                        errors.productName
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#2b2b2b] focus:border-[#538e53]"
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.productName && (
                      <p className="text-red-500 text-[12px] font-montserrat mt-1">
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  <div
                    ref={categoryDropdownRef}
                    className="relative w-full md:w-1/2"
                  >
                    <div
                      onClick={() => setIsCategoryOpen((prev) => !prev)}
                      className={`flex items-center justify-between w-full border rounded px-3 py-2 cursor-pointer bg-white ${
                        errors.category ? "border-red-500" : "border-[#2b2b2b]"
                      }`}
                    >
                      <span className="text-sm font-normal text-[#2b2b2b] font-montserrat">
                        {selectedCategory || "Select Category"}
                      </span>
                      {isCategoryOpen ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    {isCategoryOpen && (
                      <div className="absolute z-10 w-full bg-[#fefefe] border border-[#2b2b2b] rounded mt-1 max-h-[200px] overflow-y-auto shadow-lg">
                        {categories.map((category) => (
                          <div
                            key={category}
                            onClick={() => handleCategorySelect(category)}
                            className="px-3 py-2 text-sm font-normal text-[#2b2b2b] font-montserrat hover:bg-[#f1f1f1] cursor-pointer"
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.category && (
                      <p className="text-red-500 text-[12px] font-montserrat mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subcategory — dependent dropdown when the selected category
                    has subcategories from the API, otherwise free text. */}
                <div className="w-[88%] mx-auto">
                  {selectedCategorySubcategories.length > 0 ? (
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full border border-[#2b2b2b] rounded px-3 py-2 text-sm font-normal text-[#2b2b2b] font-montserrat bg-white cursor-pointer"
                    >
                      <option value="">Select subcategory</option>
                      {selectedCategorySubcategories.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full border border-[#2b2b2b] rounded px-3 py-2 text-sm font-normal text-[#2b2b2b] font-montserrat"
                      placeholder="Enter subcategory (e.g., Maize)"
                    />
                  )}
                </div>

                {/* Media Upload Section */}
                <div className="w-[88%] mx-auto">
                  <MediaUpload
                    imagePreviews={imagePreviews}
                    videoPreviews={videoPreviews}
                    onImagesSelect={handleImagesSelect}
                    onVideoSelect={handleVideoSelect}
                    onRemoveImage={removeImage}
                    onRemoveVideo={removeVideo}
                    imagesRequired
                  />
                  {errors.images && (
                    <p
                      role="alert"
                      className="text-red-500 text-[12px] font-montserrat mt-1"
                    >
                      {errors.images}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-[88%] mx-auto flex justify-center bg-[#538e53] text-[#fefefe] font-montserrat font-normal text-sm md:text-base rounded py-3"
                >
                  Next
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <ItemDetailsForm
                onBack={handleBack}
                // Only fired after the product is actually created — clear the
                // draft so the next open starts blank and closing it doesn't
                // prompt to discard an item that was already saved.
                onClose={() => {
                  resetForm();
                  onClose();
                }}
                selectedCategory={selectedCategory}
                subcategory={subcategory}
                productName={productName}
                selectedFarmerId={selectedFarmerId}
                imageFiles={imageFiles}
                videoFiles={videoFiles}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddToStore;
