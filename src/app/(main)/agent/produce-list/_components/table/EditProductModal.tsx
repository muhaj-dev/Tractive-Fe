// components/modals/EditProductModal.tsx
"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/services/productService";
import {
  useProduct,
  useUpdateProduct,
  useUpdateProductStatus,
  useDeleteProduct,
} from "@/hooks/queries/useProductQueries";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { toast } from "sonner";
import Image from "next/image";
import { MediaUpload } from "../../../_components/MediaUpload";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdate?: (updatedProduct: Product) => void;
  initialMode?: "view" | "edit";
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
  onProductUpdate,
  initialMode = "view",
}) => {
  // Fetch fresh product details
  const { data: fetchedProduct, isLoading: isFetching } = useProduct(
    initialProduct?.id || null,
  );

  // Memoize the effective product to prevent unstable references
  const product = useMemo(
    () =>
      fetchedProduct
        ? { ...fetchedProduct, checked: initialProduct?.checked || false }
        : initialProduct,
    [fetchedProduct, initialProduct],
  );

  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  const [formData, setFormData] = useState<{
    price: number;
    quantity: number | string;
    name: string;
    description: string;
    discount: number | string;
    images: string[];
    videos: string[];
  }>({
    price: 0,
    quantity: "",
    name: "",
    description: "",
    discount: 0,
    images: [],
    videos: [],
    // Add missing fields to state type if needed or keep loose
  });

  const { uploadToCloudinary, isUploading } = useCloudinaryUpload();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const videoInputRef = useRef<HTMLInputElement>(null);

  // State for delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Combine images and videos for gallery view
  const mediaItems = useMemo(() => {
    if (!product) return [];
    const imgs =
      product.images?.map((src) => ({ type: "image" as const, src })) || [];
    const vids =
      product.videos?.map((src) => ({ type: "video" as const, src })) || [];
    return [...imgs, ...vids];
  }, [product]);

  // Reset media index when product or mode changes
  useEffect(() => {
    setSelectedMediaIndex(0);
  }, [product?.id, mode]);

  // Mutations
  const updateProductMutation = useUpdateProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Initialize form data when product ID changes or fetched data arrives
  // Using JSON.stringify for deep comparison on product data to avoid loop if product ref changes but data is same
  useEffect(() => {
    if (product) {
      setFormData({
        price: product.price || 0,
        quantity: product.quantity || "",
        name: product.name || "",
        description: product.description || "",
        discount: product.discount || 0,
        images: product.images || [],
        videos: product.videos || [],
      });
      setIsDeleteConfirmOpen(false);
    }
  }, [product]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "discount"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleImagesSelect = async (files: File[]) => {
    if (files.length > 0) {
      // Filter valid images
      const validFiles = files.filter((file) => file.type.startsWith("image/"));

      if (validFiles.length === 0) {
        toast.error("Please select valid image files");
        return;
      }

      // Upload concurrently
      const uploadPromises = validFiles.map((file) => uploadToCloudinary(file));

      try {
        toast.info(`Uploading ${validFiles.length} images...`);
        const urls = await Promise.all(uploadPromises);

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...urls],
        }));
        toast.success("Images uploaded successfully");
      } catch {
        toast.error("Failed to upload some images");
      }
    }
  };

  const handleVideoSelect = async (file: File) => {
    if (file) {
      // Check limit
      if (formData.videos.length >= 1) {
        toast.error("Only one video is allowed");
        return;
      }

      const validTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/avi",
      ];
      if (!file.type.startsWith("video/") && !validTypes.includes(file.type)) {
        toast.error("Invalid video format");
        return;
      }

      try {
        toast.info("Uploading video...");
        const url = await uploadToCloudinary(file);
        setFormData((prev) => ({
          ...prev,
          videos: [...prev.videos, url],
        }));
        toast.success("Video uploaded successfully");
      } catch {
        toast.error("Failed to upload video");
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!formData.price || formData.price <= 0) {
      toast.error("Valid price is required");
      return;
    }

    if (!formData.quantity) {
      toast.error("Quantity is required");
      return;
    }

    updateProductMutation.mutate(
      {
        id: product.id,
        data: {
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          quantity: Number(formData.quantity), // Ensure number
          images: formData.images,
          videos: formData.videos,
          // Include other fields if required by strict PUT
        },
      },
      {
        onSuccess: (updated) => {
          if (onProductUpdate) {
            onProductUpdate({
              ...product,
              ...updated,
              checked: product.checked || false,
            });
          }
          // Optimistically update local product state to reflect changes in View mode
          setMode("view");
          toast.success("Product updated successfully");
        },
      },
    );
  };

  const handleStatusChange = (
    newStatus: "available" | "out_of_stock" | "discontinued",
  ) => {
    if (!product) return;

    updateStatusMutation.mutate(
      { id: product.id, status: newStatus },
      {
        onSuccess: () => {
          onClose(); // Status change usually effectively removes it from current list context
        },
      },
    );
  };

  const handleDelete = () => {
    if (!product) return;

    deleteProductMutation.mutate(product.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleClose = () => {
    setMode("view"); // Reset to default
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  // Helper for safe image source
  const getSafeImage = (img?: string) => {
    if (!img || typeof img !== "string") return "/images/tomatoProduct.png"; // Fallback
    if (img.startsWith("http") || img.startsWith("/")) return img;
    return `/images/${img}`;
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-50 p-2 sm:p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold font-montserrat text-[#2b2b2b]">
                {mode === "view" ? "Product Details" : "Edit Product"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isFetching && !fetchedProduct ? (
                <div className="text-center py-4 text-gray-500 font-montserrat">
                  Loading latest details...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Common: Images & Details (Read-only in both modes, but styled differently if needed) */}
                  {/* Media Gallery is now integrated into View Mode */}

                  {/* View Mode UI */}
                  {mode === "view" && (
                    <div className="flex flex-col gap-6">
                      {/* Media Gallery - Full Width on Top */}
                      <div className="w-full flex flex-col gap-3">
                        {/* Featured Media Viewer */}
                        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          {mediaItems.length > 0 ? (
                            mediaItems[selectedMediaIndex]?.type === "video" ? (
                              <video
                                src={getSafeImage(
                                  mediaItems[selectedMediaIndex].src,
                                )}
                                className="w-full h-full object-contain bg-black"
                                controls
                                autoPlay={false}
                              />
                            ) : (
                              <Image
                                src={getSafeImage(
                                  mediaItems[selectedMediaIndex]?.src,
                                )}
                                alt="Product view"
                                fill
                                className="object-contain"
                                priority
                              />
                            )
                          ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                              <span className="text-4xl mb-2">📷</span>
                              <span className="text-sm font-montserrat">
                                No media available
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Thumbnails Strip */}
                        {mediaItems.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {mediaItems.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedMediaIndex(idx)}
                                className={`relative w-20 h-20 flex-shrink-0 border-2 rounded-md overflow-hidden transition-all ${
                                  selectedMediaIndex === idx
                                    ? "border-[#538e53] ring-1 ring-[#538e53]"
                                    : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                              >
                                {item.type === "video" ? (
                                  <div className="w-full h-full bg-black flex items-center justify-center relative">
                                    <video
                                      src={getSafeImage(item.src)}
                                      className="w-full h-full object-cover opacity-60"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">
                                        ▶
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <Image
                                    src={getSafeImage(item.src)}
                                    alt={`Thumbnail ${idx}`}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product Details - Below Media */}
                      <div className="w-full flex flex-col">
                        <div className="flex-1 space-y-5">
                          {/* Header Info */}
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="text-2xl font-bold font-montserrat text-[#2b2b2b] leading-tight mb-2">
                                {product.name}
                              </h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  product.status === "available"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : product.status === "out_of_stock"
                                      ? "bg-orange-50 text-orange-700 border-orange-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {product.status === "available"
                                  ? "Active"
                                  : product.status === "out_of_stock"
                                    ? "Out of Stock"
                                    : "Discontinued"}
                              </span>
                            </div>
                            {product.subcategory && (
                              <p className="text-xs text-gray-400 font-montserrat">
                                {product.category} &bull; {product.subcategory}
                              </p>
                            )}
                          </div>

                          {/* Price & Stock Card */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat mb-1 block">
                                Price
                              </label>
                              <p className="text-xl font-bold text-[#2b2b2b] font-montserrat">
                                ₦{product.price?.toLocaleString()}
                              </p>
                              {product.discount > 0 && (
                                <span className="text-xs text-red-500 font-medium">
                                  {product.discount}% Off
                                </span>
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat mb-1 block">
                                Stock Level
                              </label>
                              <p className="text-xl font-medium text-[#2b2b2b] font-montserrat">
                                {product.quantity}{" "}
                                <span className="text-sm text-gray-500">
                                  {product.unit}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <h4 className="text-sm font-semibold text-[#2b2b2b] font-montserrat mb-2">
                              Description
                            </h4>
                            <p className="text-sm text-gray-600 font-montserrat leading-relaxed whitespace-pre-wrap">
                              {product.description ||
                                "No description provided."}
                            </p>
                          </div>

                          {/* Context Details */}
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat">
                                Category
                              </label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.categories?.length ? (
                                  product.categories.map((c, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700"
                                    >
                                      {c}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    -
                                  </span>
                                )}
                              </div>
                            </div>
                            {product.unitWeightKg != null && (
                              <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat">
                                  Unit Weight
                                </label>
                                <p className="text-sm text-gray-700 font-montserrat font-medium mt-1">
                                  {product.unitWeightKg} kg
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Farmer Info */}
                          {product.farmer && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat mb-2 block">
                                Farmer
                              </label>
                              <p className="text-sm font-medium text-[#2b2b2b] font-montserrat">
                                {product.farmer.name}
                              </p>
                              {product.farmer.businessName && (
                                <p className="text-xs text-gray-500 font-montserrat">
                                  {product.farmer.businessName}
                                </p>
                              )}
                              {product.farmer.phone && (
                                <p className="text-xs text-gray-500 font-montserrat">
                                  {product.farmer.phone}
                                </p>
                              )}
                              {(product.farmer.state || product.farmer.country) && (
                                <p className="text-xs text-gray-500 font-montserrat">
                                  {[product.farmer.address, product.farmer.state, product.farmer.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Local Transport */}
                          {product.localTransport?.required && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat mb-2 block">
                                Local Transport
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500 font-montserrat">From</p>
                                  <p className="text-sm font-medium text-[#2b2b2b] font-montserrat">
                                    {product.localTransport.from}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-montserrat">To</p>
                                  <p className="text-sm font-medium text-[#2b2b2b] font-montserrat">
                                    {product.localTransport.to}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-montserrat">Fee</p>
                                  <p className="text-sm font-medium text-[#2b2b2b] font-montserrat">
                                    ₦{product.localTransport.fee?.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {product.localTransport.note && (
                                <p className="text-xs text-gray-500 font-montserrat mt-2 italic">
                                  {product.localTransport.note}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => setMode("edit")}
                            className="flex-1 py-2.5 bg-[#538e53] text-white rounded-md hover:bg-[#467846] transition-colors font-montserrat font-medium text-sm shadow-sm"
                          >
                            Edit Product
                          </button>
                          <button
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            className="px-6 py-2.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors font-montserrat font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Mode UI */}
                  {mode === "edit" && (
                    <div className="space-y-6">
                      {/* Read Only Context Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 opacity-75">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat">
                            Product Name
                          </label>
                          <p className="text-sm font-medium text-gray-700 font-montserrat">
                            {product.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-montserrat">
                            Category
                          </label>
                          <p className="text-sm text-gray-600 font-montserrat">
                            {product.categories?.join(", ") || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Editable Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="block text-sm font-medium text-[#2b2b2b] mb-1 font-montserrat">
                            Product Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="block text-sm font-medium text-[#2b2b2b] mb-1 font-montserrat">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#538e53] focus:border-[#538e53] font-montserrat text-sm"
                          />
                        </div>

                        {/* Media Upload Section */}
                        <div className="space-y-2">
                          <MediaUpload
                            imagePreviews={formData.images.map((img) =>
                              img.startsWith("http") ? img : `/images/${img}`,
                            )}
                            videoPreviews={formData.videos}
                            onImagesSelect={handleImagesSelect}
                            onVideoSelect={handleVideoSelect}
                            onRemoveImage={removeImage}
                            onRemoveVideo={removeVideo}
                            isUploading={isUploading}
                          />
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-[#2b2b2b] mb-1 font-montserrat">
                              Price (₦)
                            </label>
                            <input
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleInputChange}
                              required
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#538e53] focus:border-[#538e53] font-montserrat text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-[#2b2b2b] mb-1 font-montserrat">
                              Quantity
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              value={formData.quantity}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#538e53] focus:border-[#538e53] font-montserrat text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="block text-sm font-medium text-[#2b2b2b] mb-1 font-montserrat">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            name="discount"
                            value={formData.discount}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#538e53] focus:border-[#538e53] font-montserrat text-sm"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <span className="text-sm font-medium text-[#2b2b2b] font-montserrat">
                              Status
                            </span>
                            <p className="text-xs text-gray-500 font-montserrat">
                              Manage product availability
                            </p>
                          </div>
                          <select
                            value={product.status}
                            onChange={(e) =>
                              handleStatusChange(
                                e.target.value as
                                  | "available"
                                  | "out_of_stock"
                                  | "discontinued",
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#538e53] transition-colors"
                          >
                            <option value="available">Active</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="discontinued">Discontinued</option>
                          </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setMode("view")}
                            className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-montserrat font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              updateProductMutation.isPending || isUploading
                            }
                            className="flex-1 py-2 bg-[#538e53] text-white rounded-md hover:bg-[#467846] transition-colors font-montserrat font-medium disabled:opacity-70"
                          >
                            {updateProductMutation.isPending
                              ? "Saving..."
                              : isUploading
                                ? "Uploading..."
                                : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Delete Confirmation (Global for modal) */}
                  {isDeleteConfirmOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4"
                    >
                      <p className="font-montserrat font-medium text-sm text-red-800 mb-2">
                        Are you really sure?
                      </p>
                      <p className="font-montserrat text-xs text-red-600 mb-4">
                        This will permanently delete &quot;{product.name}&quot;.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsDeleteConfirmOpen(false)}
                          className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm font-montserrat hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleteProductMutation.isPending}
                          className="flex-1 py-1.5 bg-red-600 text-white rounded text-sm font-montserrat font-medium hover:bg-red-700 transition-colors disabled:opacity-70"
                        >
                          {deleteProductMutation.isPending
                            ? "Deleting..."
                            : "Confirm Delete"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
