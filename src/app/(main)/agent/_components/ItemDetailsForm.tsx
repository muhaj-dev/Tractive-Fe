"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "./Icons/AgentIcons";
import { toast } from "sonner";
import { useCreateProduct } from "@/hooks/queries/useProductQueries";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import {
  CREATABLE_PRODUCT_UNITS,
  getProductUnit,
  requiresUnitWeight,
} from "@/utils/productUnits";

interface ItemDetailsFormProps {
  onBack: () => void;
  onClose: () => void;
  selectedCategory: string | null;
  subcategory: string;
  productName: string;
  selectedFarmerId: string | null;
  imageFiles: File[];
  videoFiles?: File[];
}

export const ItemDetailsForm: React.FC<ItemDetailsFormProps> = ({
  onBack,
  onClose,
  selectedCategory,
  subcategory,
  productName,
  selectedFarmerId,
  imageFiles,
  videoFiles = [],
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [unitWeightKg, setUnitWeightKg] = useState<string>("");
  const [localTransportRequired, setLocalTransportRequired] = useState<boolean>(false);
  const [localTransportFee, setLocalTransportFee] = useState<string>("");
  const [localTransportFrom, setLocalTransportFrom] = useState<string>("");
  const [localTransportTo, setLocalTransportTo] = useState<string>("");
  const [localTransportNote, setLocalTransportNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // Inline required-field validation: an entry turns the field's border red and
  // renders a message below it (cleared as soon as the field changes).
  const [errors, setErrors] = useState<{
    quantity?: string;
    unit?: string;
    description?: string;
    price?: string;
    unitWeightKg?: string;
  }>({});

  const selectedUnit = getProductUnit(unit);
  const unitLabel = selectedUnit?.label ?? unit;
  // The option labels carry their own parenthetical ("Kilogram (kg)"), which read as
  // "Weight of one kilogram (kg) (kg)" once this field appended its own unit.
  const unitNoun = unitLabel.replace(/\s*\([^)]*\)\s*$/, "");
  const unitWeightRequired = requiresUnitWeight(unit);

  const { uploadToCloudinary } = useCloudinaryUpload();

  // Handle form submission
  const { mutateAsync: createProduct } =
    useCreateProduct();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setUploadProgress(10);

    try {
      console.log("🚀 Step 1: Starting product upload...");

      // Guard: farmer / product name / category are chosen in step 1, so if
      // they're missing the user needs to go back rather than fix a field here.
      if (!selectedFarmerId || !productName.trim() || !selectedCategory) {
        toast.error(
          "Missing product details. Please go back and complete the previous step.",
        );
        setIsLoading(false);
        return;
      }

      // Inline validation for the fields on this step.
      const nextErrors: typeof errors = {};
      if (!description.trim())
        nextErrors.description = "Description is required";
      if (!unit.trim()) nextErrors.unit = "Please select a unit";
      if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
        nextErrors.price = "Enter a valid price";
      if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0)
        nextErrors.quantity = "Enter a valid quantity";
      // Without a unit weight, transport treats the quantity as kilograms — so
      // it is required for any unit whose weight is not fixed by its name.
      if (
        requiresUnitWeight(unit) &&
        (!unitWeightKg.trim() ||
          isNaN(Number(unitWeightKg)) ||
          Number(unitWeightKg) <= 0)
      )
        nextErrors.unitWeightKg = `Enter how many kg one ${unitNoun.toLowerCase()} weighs`;

      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        setIsLoading(false);
        return;
      }

      console.log("✅ Step 2: All fields validated");

      // Upload media to Cloudinary. Failures here are reported separately from
      // failures creating the product — "Failed to create product" is the wrong
      // thing to say when the product was never attempted because an image upload
      // died, and `useCreateProduct` already surfaces the API's own message.
      let imageUrls: string[] = [];
      let videoUrls: string[] = [];

      try {
        if (imageFiles.length > 0) {
          setUploadProgress(20);
          console.log(
            `🔄 Step 3a: Uploading ${imageFiles.length} images to Cloudinary...`,
          );

          const uploadPromises = imageFiles.map((file) =>
            uploadToCloudinary(file),
          );
          imageUrls = await Promise.all(uploadPromises);

          console.log("✅ Images uploaded:", imageUrls);
        }

        // Upload videos to Cloudinary
        if (videoFiles.length > 0) {
          setUploadProgress(40);
          console.log(
            `🔄 Step 3b: Uploading ${videoFiles.length} videos to Cloudinary...`,
          );

          const uploadPromises = videoFiles.map((file) =>
            uploadToCloudinary(file),
          );
          videoUrls = await Promise.all(uploadPromises);

          console.log("✅ Videos uploaded:", videoUrls);
        }
      } catch (uploadError) {
        console.error("❌ Media upload failed:", uploadError);
        const isFileReader =
          uploadError instanceof Error &&
          uploadError.message.includes("FileReader");
        toast.error(
          isFileReader
            ? "Failed to process your files. Please try again with smaller files."
            : "Your images could not be uploaded, so the product was not created. Please check your connection and try again.",
          { duration: 5000, position: "top-center" },
        );
        setIsLoading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(70);

      // Prepare API payload matching the spec
      const categories = [selectedCategory!];
      if (subcategory.trim()) {
        categories.push(subcategory.trim());
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiPayload: any = {
        name: productName.trim(),
        description: description.trim(),
        price: parseInt(price, 10),
        quantity: Number(quantity),
        discount: discount ? Number(discount) : 0,
        unit: unit.trim(),
        unitWeightKg: unitWeightKg ? Number(unitWeightKg) : null,
        category: selectedCategory,
        subcategory: subcategory.trim() || selectedCategory,
        categories,
        images: imageUrls,
        videos: videoUrls,
        farmer: selectedFarmerId,
      };

      if (localTransportRequired) {
        apiPayload.localTransport = {
          required: true,
          fee: Number(localTransportFee) || 0,
          from: localTransportFrom.trim(),
          to: localTransportTo.trim(),
          note: localTransportNote.trim() || undefined,
        };
      }

      console.log("✅ Step 5: Payload prepared", apiPayload);
      setUploadProgress(80);

      // Make API call using the hook
      console.log("🚀 Step 6: sending mutation...");

      await createProduct(apiPayload);

      setUploadProgress(100);

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      // Media failures are handled above. Anything reaching here came from
      // `createProduct`, and `useCreateProduct.onError` has already shown the
      // API's own message (e.g. "Unit must be one of kg, tonne, 50kg_bag, or
      // 100kg_bag") — a second generic toast only buries it.
      console.error("❌ Error creating product:", error);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Calculate total file size
  const getTotalFileSize = (): number => {
    let totalSize = 0;
    imageFiles.forEach((file) => (totalSize += file.size));
    if (videoFiles) {
      videoFiles.forEach((file) => (totalSize += file.size));
    }
    return totalSize;
  };

  const totalFileSizeMB = (getTotalFileSize() / 1024 / 1024).toFixed(2);

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
          className="flex items-center justify-center rounded-[100px] py-[4px] px-[8px] w-[35px] h-[35px] bg-[#f1f1f1] cursor-pointer hover:bg-[#e1e1e1]"
          role="button"
          tabIndex={0}
        >
          <ArrowLeftIcon />
        </div>
      </div>

      <h2 className="text-[15px] font-normal text-center text-[#808080] font-montserrat mb-4">
        Item Details
      </h2>



      {/* Upload Progress */}
      {isLoading && (
        <div className="mb-4 p-3 bg-[#f0f8f0] rounded">
          <p className="text-sm text-[#538e53] font-montserrat mb-2">
            {uploadProgress < 30
              ? "Preparing upload..."
              : uploadProgress < 60
                ? "Converting files to base64..."
                : uploadProgress < 80
                  ? "Finalizing..."
                  : uploadProgress < 100
                    ? "Sending to server..."
                    : "Upload complete!"}
          </p>
          <div className="w-full bg-[#e0e0e0] rounded-full h-2">
            <div
              className="bg-[#538e53] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-[694px] mx-auto"
      >
        {/* Quantity */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="quantity"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Available Quantity *
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQuantity(e.target.value);
              if (errors.quantity)
                setErrors((prev) => ({ ...prev, quantity: undefined }));
            }}
            aria-invalid={!!errors.quantity}
            className={`w-full border-[1px] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] ${
              errors.quantity
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-[#2b2b2b] focus:ring-[#538e53] focus:border-[#538e53]"
            }`}
            placeholder="Enter quantity available"
            min="1"
            disabled={isLoading}
          />
          {errors.quantity && (
            <p className="text-red-500 text-[12px] font-montserrat">
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="unit"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Unit *
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const next = e.target.value;
              setUnit(next);
              // kg, 100kg_bag and tonne have a weight fixed by definition —
              // fill it in rather than making the agent restate it.
              const fixed = getProductUnit(next)?.fixedWeightKg;
              if (fixed != null) setUnitWeightKg(String(fixed));
              else setUnitWeightKg("");
              setErrors((prev) => ({
                ...prev,
                unit: undefined,
                unitWeightKg: undefined,
              }));
            }}
            aria-invalid={!!errors.unit}
            className={`w-full border-[1px] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] cursor-pointer ${
              errors.unit
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-[#2b2b2b] focus:ring-[#538e53] focus:border-[#538e53]"
            }`}
            disabled={isLoading}
          >
            <option value="">Select unit</option>
            {CREATABLE_PRODUCT_UNITS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.unit && (
            <p className="text-red-500 text-[12px] font-montserrat">
              {errors.unit}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="description"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setDescription(e.target.value);
              if (errors.description)
                setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            aria-invalid={!!errors.description}
            className={`w-full border-[1px] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat h-[100px] resize-none focus:outline-none focus:ring-[0.1px] ${
              errors.description
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-[#2b2b2b] focus:ring-[#538e53] focus:border-[#538e53]"
            }`}
            placeholder="Enter product description"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-red-500 text-[12px] font-montserrat">
              {errors.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="price"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Price (₦) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            id="price"
            value={price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // Only allow digits
              const val = e.target.value.replace(/[^0-9]/g, "");
              setPrice(val);
              if (errors.price)
                setErrors((prev) => ({ ...prev, price: undefined }));
            }}
            aria-invalid={!!errors.price}
            className={`w-full border-[1px] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] ${
              errors.price
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-[#2b2b2b] focus:ring-[#538e53] focus:border-[#538e53]"
            }`}
            placeholder="Enter price in Naira"
            disabled={isLoading}
          />
          {errors.price && (
            <p className="text-red-500 text-[12px] font-montserrat">
              {errors.price}
            </p>
          )}
        </div>

        {/* Discount */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="discount"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Discount (%)
          </label>
          <input
            type="number"
            id="discount"
            value={discount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDiscount(e.target.value)
            }
            className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
            placeholder="Enter discount percentage (optional)"
            min="0"
            max="100"
            disabled={isLoading}
          />
        </div>

        {/* Unit Weight — kilograms in ONE unit, not a weight in that unit. */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="unitWeightKg"
            className="text-[14px] font-normal text-[#2b2b2b] font-montserrat"
          >
            Weight of one {unit ? unitNoun.toLowerCase() : "unit"} (kg)
            {unitWeightRequired ? " *" : ""}
          </label>
          <input
            type="number"
            id="unitWeightKg"
            value={unitWeightKg}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUnitWeightKg(e.target.value);
              if (errors.unitWeightKg)
                setErrors((prev) => ({ ...prev, unitWeightKg: undefined }));
            }}
            aria-invalid={!!errors.unitWeightKg}
            className={`w-full border-[1px] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] ${
              errors.unitWeightKg
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-[#2b2b2b] focus:ring-[#538e53] focus:border-[#538e53]"
            }`}
            placeholder={
              unit
                ? `How many kg is one ${unitNoun.toLowerCase()}?`
                : "Select a unit first"
            }
            min="0"
            step="0.1"
            disabled={isLoading || !unit}
          />
          {unitWeightRequired && !errors.unitWeightKg && (
            <p className="text-[12px] font-montserrat text-[#808080]">
              Transport is priced by weight — without this, {quantity || "50"}{" "}
              {unitNoun.toLowerCase()}
              {Number(quantity) === 1 ? "" : "s"} would be shipped as if they
              weighed {quantity || "50"} kg.
            </p>
          )}
          {errors.unitWeightKg && (
            <p className="text-red-500 text-[12px] font-montserrat">
              {errors.unitWeightKg}
            </p>
          )}
        </div>

        {/* Local Transport */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-normal text-[#2b2b2b] font-montserrat">
            Local Transport
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="localTransportRequired"
              checked={localTransportRequired}
              onChange={(e) => setLocalTransportRequired(e.target.checked)}
              className="w-4 h-4 accent-[#538e53] cursor-pointer"
              disabled={isLoading}
            />
            <label
              htmlFor="localTransportRequired"
              className="text-sm text-[#2b2b2b] font-montserrat cursor-pointer"
            >
              Requires local transport (farm-to-pickup)
            </label>
          </div>

          {localTransportRequired && (
            <div className="space-y-3 mt-2 p-3 border border-[#e0e0e0] rounded-[4px] bg-[#f9f9f9]">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="localTransportFee"
                  className="text-[13px] text-[#2b2b2b] font-montserrat"
                >
                  Transport Fee (₦) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="localTransportFee"
                  value={localTransportFee}
                  onChange={(e) =>
                    setLocalTransportFee(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                  placeholder="Enter transport fee"
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label
                    htmlFor="localTransportFrom"
                    className="text-[13px] text-[#2b2b2b] font-montserrat"
                  >
                    From *
                  </label>
                  <input
                    type="text"
                    id="localTransportFrom"
                    value={localTransportFrom}
                    onChange={(e) => setLocalTransportFrom(e.target.value)}
                    className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                    placeholder="e.g., Kachia Farm"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label
                    htmlFor="localTransportTo"
                    className="text-[13px] text-[#2b2b2b] font-montserrat"
                  >
                    To *
                  </label>
                  <input
                    type="text"
                    id="localTransportTo"
                    value={localTransportTo}
                    onChange={(e) => setLocalTransportTo(e.target.value)}
                    className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                    placeholder="e.g., Kaduna Aggregation Point"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="localTransportNote"
                  className="text-[13px] text-[#2b2b2b] font-montserrat"
                >
                  Note
                </label>
                <input
                  type="text"
                  id="localTransportNote"
                  value={localTransportNote}
                  onChange={(e) => setLocalTransportNote(e.target.value)}
                  className="w-full border-[1px] border-[#2b2b2b] rounded-[4px] px-3 py-2 text-[14px] font-normal text-[#2b2b2b] font-montserrat focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                  placeholder="e.g., Farm gate pickup to interstate loading point"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* File Upload Summary */}
        {(imageFiles.length > 0 || videoFiles.length > 0) && (
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-normal text-[#2b2b2b] font-montserrat">
              Files to Upload
            </label>
            <div className="border border-[#e0e0e0] rounded-[4px] p-3 bg-[#f9f9f9]">
              {imageFiles.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-[#2b2b2b] font-montserrat font-semibold">
                    Images ({imageFiles.length}):
                  </p>
                  <ul className="text-xs text-[#666] font-montserrat ml-4">
                    {imageFiles.map((file, index) => (
                      <li key={`img-${index}`}>
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                        MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {videoFiles.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-[#2b2b2b] font-montserrat font-semibold">
                    Videos ({videoFiles.length}):
                  </p>
                  <ul className="text-xs text-[#666] font-montserrat ml-4">
                    {videoFiles.map((file, index) => (
                      <li key={`vid-${index}`}>
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                        MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mx-auto flex justify-center bg-[#538e53] text-[#fefefe] font-montserrat font-normal text-[16px] rounded-[4px] py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#467a46] transition-colors"
        >
          {isLoading
            ? uploadProgress > 0
              ? `Uploading... ${Math.round(uploadProgress)}%`
              : "Processing..."
            : "Upload Product"}
        </button>

        {/* Warning for large files */}
        {parseFloat(totalFileSizeMB) > 20 && !isLoading && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 font-montserrat">
              ⚠️ <strong>Large files detected:</strong> The total file size is{" "}
              {totalFileSizeMB} MB. This may take longer to upload and could
              timeout if the files are too large. Consider reducing file sizes
              for better performance.
            </p>
          </div>
        )}
      </form>
    </motion.div>
  );
};
