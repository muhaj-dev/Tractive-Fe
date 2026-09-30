"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import { XModalIcon } from "../../_components/Icons/TransporterIcons";
import { useModalA11y } from "@/hooks/useModalA11y";
import { Driver } from "@/utils/DriverData";
import { useGetFleets } from "@/hooks/queries/useFleetQueries";

interface AssignFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (truckId: string) => void;
  editDriver?: Driver | null;
}

export const AssignFleetModal: React.FC<AssignFleetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editDriver,
}) => {
  const [formData, setFormData] = useState({
    truckId: "",
    image: "",
  });
  const [errors, setErrors] = useState({
    truckId: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: fleets = [], isLoading: isFetchingFleets } = useGetFleets();

  useEffect(() => {
    if (isOpen && editDriver) {
        setFormData({
            truckId: editDriver.fleet || "",
            image: editDriver.image || "",
        });
    } else {
        setFormData({ truckId: "", image: "" });
    }
    setErrors({ truckId: "" });
  }, [isOpen, editDriver]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, dialogRef, { onEscape: onClose });

  if (!isOpen) return null;

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      truckId: "",
    };

    if (!formData.truckId.trim()) {
      newErrors.truckId = "Truck ID is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData.truckId);
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
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-fleet-title"
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
        <h2 id="assign-fleet-title" className="text-lg font-montserrat text-[#2b2b2b] mb-4">
          Assign Fleet to {editDriver?.name || "Driver"}
        </h2>
        <div className="flex justify-center mb-2">
          <div className="relative w-20 h-20 group">
            <UserAvatar
              src={formData.image}
              name={editDriver?.name || "Driver"}
              size={80}
              className="border-2 border-gray-300"
            />
            {/* Image upload seems unrelated to assign fleet, but keeping it for consistency if needed. */}
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
            <div>
              <label
                htmlFor="truckId"
                className="block text-sm font-montserrat text-[#2b2b2b]"
              >
                Assign to Fleet
              </label>
              <select
                id="truckId"
                name="truckId"
                value={formData.truckId}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => handleChange(e as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#538e53] bg-white appearance-none"
                aria-required="true"
                disabled={isFetchingFleets}
              >
                <option value="" disabled>
                  {isFetchingFleets ? "Loading fleets..." : "Select a fleet"}
                </option>
                {fleets.map((fleet) => (
                  <option key={fleet._id} value={fleet._id}>
                    {fleet.fleetName || fleet.fleetNumber || fleet._id}
                  </option>
                ))}
              </select>
              {errors.truckId && (
                <p className="text-red-500 text-xs mt-1">{errors.truckId}</p>
              )}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <button
                type="submit"
                className="px-6 py-2 w-full bg-[#538e53] text-[#f9f9f9] rounded-[4px] hover:bg-[#467a46]"
              >
                Done
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
