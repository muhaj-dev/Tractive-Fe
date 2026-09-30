"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { XModalIcon } from "../../_components/Icons/AgentIcons";
import { FarmerFormFields } from "./FarmerFormFields";
import { useModalA11y } from "@/hooks/useModalA11y";

interface OnboardingFarmersProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (farmer: FarmerFormData) => void | Promise<void>;
  editFarmer?: Partial<FarmerFormData> | null;
}

export interface FarmerFormData {
  name: string;
  mobile: string;
  businessName: string;
  address: string;
  country: string;
  state: string;
  lga: string;
  localMarket: string;
  image?: string;
  // Optional fields for UI
  altMobile?: string;
  ninOrCac?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export const OnboardingFarmers: React.FC<OnboardingFarmersProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editFarmer,
}) => {
  const [formData, setFormData] = useState<FarmerFormData>({
    name: "",
    mobile: "",
    businessName: "",
    address: "",
    country: "Nigeria",
    state: "",
    lga: "",
    localMarket: "",
    image: "/images/farmer_modal_profile.png",
  });

  const [image, setImage] = useState<string>(
    "/images/farmer_modal_profile.png",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with edit data
  useEffect(() => {
    if (editFarmer && isOpen) {
      setFormData({
        name: editFarmer.name || "",
        mobile: editFarmer.mobile || "",
        businessName: editFarmer.businessName || "",
        address: editFarmer.address || "",
        country: editFarmer.country || "Nigeria",
        state: editFarmer.state || "",
        lga: editFarmer.lga || "",
        localMarket: editFarmer.localMarket || "",
        image: editFarmer.image || "/images/farmer_modal_profile.png",
      });
      setImage(editFarmer.image || "/images/farmer_modal_profile.png");
    } else if (isOpen && !editFarmer) {
      // Reset for new farmer
      resetForm();
    }
  }, [editFarmer, isOpen]);

  const dialogRef = useRef<HTMLDivElement>(null);
  // Escape does what the X does: close and clear the form.
  useModalA11y(isOpen, dialogRef, {
    onEscape: () => {
      onClose();
      resetForm();
    },
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      businessName: "",
      address: "",
      country: "Nigeria",
      state: "",
      lga: "",
      localMarket: "",
      image: "/images/farmer_modal_profile.png",
    });
    setImage("/images/farmer_modal_profile.png");
    setErrors({});
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    // Required fields according to API spec
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
      isValid = false;
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
      isValid = false;
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Phone number is required";
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(formData.mobile.replace(/\s/g, ""))) {
      newErrors.mobile = "Invalid phone number format";
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
      isValid = false;
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
      isValid = false;
    }

    if (!formData.lga.trim()) {
      newErrors.lga = "LGA is required";
      isValid = false;
    }

    if (!formData.localMarket.trim()) {
      newErrors.localMarket = "Village or local market is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    setErrors({ ...errors, [name]: "" });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, image });
      onClose();
      resetForm();
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is handled by parent component's mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-[100] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-farmer-title"
        className="bg-[#fefefe] p-4 md:p-6 rounded-lg w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <button
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute top-2 right-2 md:top-4 md:right-4 text-[#2b2b2b] hover:text-[#538e53] cursor-pointer"
          aria-label="Close modal"
          title="Close"
        >
          <XModalIcon className="w-5 h-5" />
        </button>

        <h2
          id="onboard-farmer-title"
          className="text-[14px] sm:text-[16px] font-montserrat font-semibold text-[#2b2b2b] mb-4 text-center"
        >
          {editFarmer ? "Edit Farmer" : "Onboard Farmer"}
        </h2>

        {/* Profile Image */}
        <div className="flex justify-center mb-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 group">
            <Image
              src={image}
              alt="Farmer profile"
              width={80}
              height={80}
              className="w-full h-full rounded-full object-cover border-2 border-gray-300"
            />
            <>
              <div className="absolute inset-0 bg-[#2b2b2b] bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[#fefefe] text-[12px] sm:text-[14px] text-center font-montserrat">
                  Change Image
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload profile image"
              />
            </>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <FarmerFormFields
            formData={formData}
            errors={errors}
            onChange={handleChange}
          />

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-[#538e53] text-white rounded hover:bg-[#467a46] transition-colors text-[12px] sm:text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting..."
                : editFarmer
                  ? "Update"
                  : "Submit"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
