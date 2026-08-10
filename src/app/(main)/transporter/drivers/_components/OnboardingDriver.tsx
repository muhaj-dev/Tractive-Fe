"use client";
import React, { useState, useEffect, useRef } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { XModalIcon } from "../../_components/Icons/TransporterIcons";
import { Driver } from "@/utils/DriverData";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import UserAvatar from "@/components/UserAvatar";

interface AddDriverProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  editDriver?: Driver | null;
}

export const OnboardingDriver: React.FC<AddDriverProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editDriver,
}) => {
  const isEdit = !!editDriver;
  
  const [formData, setFormData] = useState({
    fullName: "",
    licenseNumber: "",
    phoneNumber: "",
    phone: "",
    trackingNumber: "",
    fleetId: "",
    iot: "",
    image: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    licenseNumber: "",
    phoneNumber: "",
    phone: "",
    trackingNumber: "",
    fleetId: "",
    iot: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keyboard/screen-reader behaviour: focus into the dialog, trap Tab, lock body scroll.
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, panelRef);
  const { uploadToCloudinary, isUploading } = useCloudinaryUpload();

  useEffect(() => {
    if (isOpen) {
      if (editDriver) {
        setFormData({
            fullName: editDriver.name || "",
            licenseNumber: editDriver.licenseNumber || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            phone: editDriver.phone || (editDriver as any).mobile || "",
            phoneNumber: "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            trackingNumber: (editDriver as any).trackingNumber || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fleetId: (editDriver as any).fleetId || editDriver.assignedTruck?._id || "",
            iot: editDriver.iot || "",
            image: editDriver.image || "",
        });
      } else {
        setFormData({
            fullName: "",
            licenseNumber: "",
            phone: "",
            phoneNumber: "",
            trackingNumber: "",
            fleetId: "",
            iot: "",
            image: "",
        });
      }
      setErrors({ fullName: "", licenseNumber: "", phoneNumber: "", phone: "", trackingNumber: "", fleetId: "", iot: "" });
    }
  }, [isOpen, editDriver]);

  if (!isOpen) return null;

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: "",
      licenseNumber: "",
      phoneNumber: "",
      phone: "",
      trackingNumber: "",
      fleetId: "",
      iot: "",
    };

    if (!isEdit) {
        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
            isValid = false;
        }
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
            isValid = false;
        } else if (!/^(\+?234|0)\d{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Invalid phone number format";
            isValid = false;
        }
        if (!formData.licenseNumber.trim()) {
            newErrors.licenseNumber = "License Number is required";
            isValid = false;
        }
    } else {
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
            isValid = false;
        } else if (!/^\d{10,11}$/.test(formData.phone)) {
            newErrors.phone = "Phone number must be 10-11 digits";
            isValid = false;
        }
    }

    setErrors(newErrors);
    return isValid;
  };

  /** Upload straight to Cloudinary — the API stores a URL, so a base64 preview
   * alone would never persist. */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, image: url }));
    } catch {
      toast.error("Couldn't upload the photo. Please try again.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      toast.error("Please wait for the photo to finish uploading.");
      return;
    }
    if (validateForm()) {
        if (isEdit) {
            const payload: Record<string, string> = {};
            if (formData.fullName.trim()) payload.name = formData.fullName;
            if (formData.phone.trim()) payload.phone = formData.phone;
            if (formData.licenseNumber.trim()) payload.licenseNumber = formData.licenseNumber;
            if (formData.trackingNumber.trim()) payload.trackingNumber = formData.trackingNumber;
            if (formData.fleetId.trim()) payload.fleetId = formData.fleetId;
            if (formData.iot.trim()) payload.iot = formData.iot;
            if (formData.image.trim() !== (editDriver?.image || "")) {
              payload.image = formData.image;
            }
            onSubmit(payload);
        } else {
            onSubmit({
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                licenseNumber: formData.licenseNumber,
                ...(formData.image.trim() ? { image: formData.image } : {}),
            });
        }
      onClose();
    }
  };

  const formVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-driver-title"
    >
      <motion.div
        ref={panelRef}
        className="bg-[#fefefe] p-8 rounded-[8px] w-full max-w-[500px] relative"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-4 right-4 text-[#2b2b2b] hover:text-[#538e53]"
          aria-label="Close modal"
          title="Close"
        >
          <XModalIcon />
        </button>
        <h2
          id="onboard-driver-title"
          className="text-lg font-montserrat text-[#2b2b2b] mb-4"
        >
          {editDriver ? "Edit Driver" : "Onboard Driver"}
        </h2>
        
        {/* Photo is uploaded to Cloudinary and sent as `image` on create/update. */}
        <div className="flex justify-center mb-2">
          <div className="relative w-20 h-20 group">
            <UserAvatar
              src={formData.image}
              name={formData.fullName || editDriver?.name}
              size={80}
              className="border-2 border-gray-300"
            />
            <div className="absolute inset-0 bg-[#2b2b2b]/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[#fefefe] text-[9px] text-center font-montserrat">
                {formData.image ? "Change Image" : "Add Image"}
              </span>
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#2b2b2b]/60">
                <span className="text-[#fefefe] text-[9px] font-montserrat">
                  Uploading…
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Upload profile image"
            />
          </div>
        </div>
        
        <AnimatePresence>
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            {!isEdit && (
                <>
                    <div>
                    <label
                        htmlFor="fullName"
                        className="block text-sm font-montserrat text-[#2b2b2b]"
                    >
                        Full Name
                    </label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                        aria-required="true"
                    />
                    {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                    )}
                    </div>
                    <div>
                    <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-montserrat text-[#2b2b2b]"
                    >
                        Phone Number
                    </label>
                    <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                        aria-required="true"
                    />
                    {errors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                    )}
                    </div>
                    <div>
                    <label
                        htmlFor="licenseNumber"
                        className="block text-sm font-montserrat text-[#2b2b2b]"
                    >
                        License Number
                    </label>
                    <input
                        id="licenseNumber"
                        name="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                        aria-required="true"
                    />
                    {errors.licenseNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>
                    )}
                    </div>
                </>
            )}

            {isEdit && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-montserrat text-[#2b2b2b]">
                      Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-montserrat text-[#2b2b2b]">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-montserrat text-[#2b2b2b]">
                      License Number
                    </label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                    />
                  </div>
                  <div>
                    <label htmlFor="trackingNumber" className="block text-sm font-montserrat text-[#2b2b2b]">
                      Tracking Number
                    </label>
                    <input
                      id="trackingNumber"
                      name="trackingNumber"
                      type="text"
                      value={formData.trackingNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                    />
                  </div>
                  <div>
                    <label htmlFor="fleetId" className="block text-sm font-montserrat text-[#2b2b2b]">
                      Fleet ID
                    </label>
                    <input
                      id="fleetId"
                      name="fleetId"
                      type="text"
                      value={formData.fleetId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                    />
                  </div>
                  <div>
                    <label htmlFor="iot" className="block text-sm font-montserrat text-[#2b2b2b]">
                      IoT
                    </label>
                    <input
                      id="iot"
                      name="iot"
                      type="text"
                      value={formData.iot}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53]"
                    />
                  </div>
                </>
            )}
            
            <div className="flex justify-center gap-2 mt-6">
              <button
                type="submit"
                className="px-6 py-2 w-full bg-[#538e53] text-[#f9f9f9] rounded-[4px] hover:bg-[#467a46]"
              >
                Submit
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
