"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { useCreateBanner, useUpdateBanner } from "@/hooks/queries/useBannerQueries";
import type { AdminBanner, BannerPayload } from "@/services/bannerService";
import { useModalA11y } from "@/hooks/useModalA11y";

interface BannerFormModalProps {
  /** null = create a new banner; a banner = edit it. */
  banner: AdminBanner | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** `2026-07-31T23:59:59.000Z` → `2026-07-31`, for a date input. */
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

/** A date input's `2026-07-31` → an ISO instant the backend accepts. */
const toIso = (date: string, endOfDay: boolean) =>
  date
    ? new Date(`${date}T${endOfDay ? "23:59:59" : "00:00:00"}Z`).toISOString()
    : undefined;

export const BannerFormModal: React.FC<BannerFormModalProps> = ({
  banner,
  isOpen,
  onClose,
}) => {
  const isEdit = !!banner;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [alt, setAlt] = useState("");
  const [position, setPosition] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { uploadToCloudinary, isUploading } = useCloudinaryUpload();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const isSaving = createBanner.isPending || updateBanner.isPending;
  // Only a save locks the form. An in-flight image upload must not block typing
  // — the admin should be able to fill in the details while it finishes.
  const isBusy = isSaving;

  // Load the banner being edited (or reset to blanks) each time we open.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(banner?.title ?? "");
    setImageUrl(banner?.imageUrl ?? "");
    setLink(banner?.link ?? "");
    setAlt(banner?.alt ?? "");
    setPosition(banner?.position != null ? String(banner.position) : "");
    setIsActive(banner?.isActive ?? true);
    setStartDate(toDateInput(banner?.startDate));
    setEndDate(toDateInput(banner?.endDate));
    setError(null);
  }, [isOpen, banner]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, {
    onEscape: () => {
      if (!isBusy) onClose();
    },
  });

  const handlePickImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }
    setError(null);
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
      toast.success("Image uploaded");
    } catch {
      // useCloudinaryUpload already surfaced the reason
      setError("Image upload failed. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!imageUrl) {
      setError("Please upload a banner image");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be on or after the start date");
      return;
    }

    const payload: BannerPayload = {
      title: title.trim(),
      imageUrl,
      link: link.trim() || undefined,
      alt: alt.trim() || undefined,
      position: position.trim() ? Number(position) : undefined,
      isActive,
      startDate: toIso(startDate, false),
      endDate: toIso(endDate, true),
    };

    try {
      if (isEdit && banner) {
        await updateBanner.mutateAsync({ id: banner.id, payload });
      } else {
        await createBanner.mutateAsync(payload);
      }
      onClose();
    } catch {
      // the mutation's onError already toasted; keep the modal open so the
      // admin doesn't lose what they typed
    }
  };

  if (!isOpen) return null;

  const fieldClass =
    "w-full px-3 py-2.5 border border-gray-300 rounded-[6px] text-[13px] font-montserrat text-[#2b2b2b] focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:border-[#538e53] disabled:bg-gray-100 disabled:cursor-not-allowed";
  const labelClass =
    "text-[12px] font-montserrat font-medium text-[#2b2b2b] mb-1 block";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-[200] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isBusy && onClose()}
      >
        <motion.div
          ref={dialogRef}
          className="bg-[#fefefe] rounded-[10px] shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-6"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-form-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5">
            <h2
              id="banner-form-title"
              className="text-[16px] font-montserrat font-semibold text-[#2b2b2b]"
            >
              {isEdit ? "Edit banner" : "New banner"}
            </h2>
            <button
              onClick={onClose}
              disabled={isBusy}
              aria-label="Close"
              className="cursor-pointer text-[#808080] hover:text-[#2b2b2b] text-[16px] disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-[6px] text-[12px] font-montserrat">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Image — uploaded to Cloudinary, only the hosted URL is sent on */}
            <div>
              <label className={labelClass}>
                Banner image <span className="text-red-500">*</span>
              </label>
              <div
                className="relative w-full h-[160px] rounded-[8px] border border-dashed border-gray-300 bg-[#f9f9f9] overflow-hidden flex items-center justify-center"
                aria-busy={isUploading}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={alt || title || "Banner preview"}
                    fill
                    sizes="560px"
                    className="object-cover"
                  />
                ) : (
                  <p className="text-[12px] font-montserrat text-[#808080]">
                    No image yet
                  </p>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-[#fefefec9] flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#538e53] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-montserrat text-[#2b2b2b]">
                      Uploading...
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  handlePickImage(e.target.files?.[0]);
                  // let the same file be re-picked after a failure
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy || isUploading}
                className="cursor-pointer mt-2 px-3 py-1.5 text-[12px] font-montserrat text-[#538e53] border border-[#538e53] rounded-[6px] hover:bg-[#538e53]/5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {imageUrl ? "Replace image" : "Upload image"}
              </button>
            </div>

            <div>
              <label className={labelClass} htmlFor="banner-title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="banner-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Fresh Harvest Week"
                maxLength={100}
                disabled={isBusy}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="banner-link">
                  Link
                </label>
                <input
                  id="banner-link"
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/buyers/products"
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="banner-position">
                  Position
                </label>
                <input
                  id="banner-position"
                  type="number"
                  min={1}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="1"
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="banner-alt">
                Alt text
              </label>
              <input
                id="banner-alt"
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describes the image for screen readers"
                maxLength={120}
                disabled={isBusy}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="banner-start">
                  Start date
                </label>
                <input
                  id="banner-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setError(null);
                  }}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="banner-end">
                  End date
                </label>
                <input
                  id="banner-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setError(null);
                  }}
                  disabled={isBusy}
                  className={fieldClass}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isBusy}
                className="w-4 h-4 accent-[#538e53] cursor-pointer"
              />
              <span className="text-[13px] font-montserrat text-[#2b2b2b]">
                Active — show this banner to buyers
              </span>
            </label>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="cursor-pointer px-4 py-2 text-[13px] font-montserrat font-medium text-[#2b2b2b] border border-gray-300 rounded-[6px] hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isBusy || isUploading}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-[13px] font-montserrat font-medium text-[#fefefe] bg-[#538e53] rounded-[6px] hover:bg-[#467746] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSaving
                  ? "Saving..."
                  : isUploading
                    ? "Uploading image..."
                    : isEdit
                      ? "Save changes"
                      : "Create banner"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
