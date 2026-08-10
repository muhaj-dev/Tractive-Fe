import React, { useEffect, useMemo, useRef, useState } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { GalleryAddIcon, XModalIcon } from "./Icons/TransporterIcons";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons/Icons";
import { useAddFleet, useUpdateFleet } from "@/hooks/queries/useFleetQueries";
import { FleetPayload } from "@/services/fleetService";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { toast } from "sonner";
import { Fleet, fleetStatusToApi, fleetStatusToLabel } from "@/utils/Fleet";
import { nigerianStates as FALLBACK_STATES } from "@/utils/state&LGA";
import {
  useStates,
  useFleetStatuses,
} from "@/hooks/queries/useReferenceQueries";

// Fallback fleet-status labels — match the API enum (available/under_maintenance
// via fleetStatusToApi). "On Transit" is trip-driven, so it isn't offered here.
const FALLBACK_FLEET_STATUS_LABELS = ["Available", "Under Maintenance"];

// Props for AddFleet
interface AddFleetProps {
  isOpen: boolean;
  onClose: () => void;
  editFleetData?: Fleet | null;
}

export const AddFleet: React.FC<AddFleetProps> = ({ isOpen, onClose, editFleetData }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);
  const fleetStateDropdownRef = useRef<HTMLDivElement>(null);

  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [isFleetStateOpen, setIsFleetStateOpen] = useState(false);

  // Reference data (T11): states + fleet statuses. Both degrade to a local
  // fallback list when the endpoint is missing/errors, so the form still works.
  const { data: statesData } = useStates();
  const { data: fleetStatusData } = useFleetStatuses();

  const nigerianStates = useMemo(
    () =>
      statesData && statesData.length
        ? statesData.map((s) => s.name)
        : FALLBACK_STATES,
    [statesData],
  );

  // "On Transit" is trip-driven, not a user-selectable upload state — filter it
  // out of the API list to keep the form's existing behaviour.
  const fleetStatesOptions = useMemo(
    () =>
      fleetStatusData && fleetStatusData.length
        ? fleetStatusData
            .filter((s) => s.value !== "on_transit")
            // Map the raw enum (e.g. "available") to its canonical display
            // label (e.g. "Available") — the API returns lowercase values, and
            // this keeps the submit round-trip via fleetStatusToApi correct.
            .map((s) => fleetStatusToLabel(s.value))
        : FALLBACK_FLEET_STATUS_LABELS,
    [fleetStatusData],
  );

  const [formData, setFormData] = useState({
    fleetName: "",
    fleetNumber: "",
    iot: "",
    model: "",
    price: "",
    size: "",
    isNegotiable: false,
    description: "",
    fromState: "",
    toState: "",
    fleetStates: "Available", // default
    images: [] as string[],
  });

  const { mutate: addFleet, isPending: isAddPending } = useAddFleet();
  const { mutate: updateFleet, isPending: isUpdatePending } = useUpdateFleet();
  const isPending = isAddPending || isUpdatePending;
  const { uploadToCloudinary } = useCloudinaryUpload();
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keyboard/screen-reader behaviour: focus into the dialog, trap Tab, lock body scroll.
  useModalA11y(isOpen, modalRef);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editFleetData) {
      const [fromState, toState] = editFleetData.route.split(" - ");
      setFormData({
        fleetName: editFleetData.name,
        fleetNumber: editFleetData.fleetNumber || "",
        iot: editFleetData.IOT,
        model: editFleetData.model || "",
        price: editFleetData.price.toString(),
        size: editFleetData.size || "",
        isNegotiable: editFleetData.priceNegotiation || false,
        description: editFleetData.fleetDescription || "",
        fromState: fromState || "",
        toState: toState || "",
        fleetStates: fleetStatusToLabel(editFleetData.status),
        images: editFleetData.images || [],
      });
    } else {
      // Reset if not editing
      setFormData({
        fleetName: "",
        fleetNumber: "",
        iot: "",
        model: "",
        price: "",
        size: "",
        isNegotiable: false,
        description: "",
        fromState: "",
        toState: "",
        fleetStates: "Available",
        images: [],
      });
    }
  }, [editFleetData, isOpen]);

  // The backend accepts anything, which is how a fleet ended up advertising
  // "Full Load: 400,000,000,000 tons" at "Per Kg: ₦0". Bound both here.
  // MAX_CAPACITY_TONNES is deliberately generous — the largest road freight in
  // use is well under this — but it stops an obvious typo becoming a listing.
  const MAX_CAPACITY_TONNES = 100;

  const capacityTonnes = (() => {
    const match = formData.size.match(/-?[\d.]+/);
    return match ? Number(match[0]) : NaN;
  })();
  const capacityError =
    formData.size.trim() === ""
      ? ""
      : !Number.isFinite(capacityTonnes) || capacityTonnes <= 0
        ? "Enter a capacity greater than 0, e.g. 20 tons"
        : capacityTonnes > MAX_CAPACITY_TONNES
          ? `That is ${capacityTonnes.toLocaleString()} tons — the maximum is ${MAX_CAPACITY_TONNES}`
          : "";
  const priceError =
    formData.price === ""
      ? ""
      : !Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0
        ? "Enter a price greater than ₦0"
        : "";

  // Form Validation
  const isFormValid = editFleetData
    ? formData.model.trim() !== "" &&
      formData.size.trim() !== "" &&
      capacityError === ""
    : capacityError === "" &&
      priceError === "" &&
      formData.fleetName.trim() !== "" &&
      formData.fleetNumber.trim() !== "" &&
      formData.iot.trim() !== "" &&
      formData.model.trim() !== "" &&
      formData.price !== "" &&
      formData.size.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.images.filter(Boolean).length > 0 &&
      uploadingCount === 0;

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle negotiation toggle
  const handleNegotiableToggle = (value: boolean) => {
    setFormData((prev) => ({ ...prev, isNegotiable: value }));
  };

  // Dropdown Handlers
  const handleFromSelect = (state: string) => {
    setFormData((prev) => ({ ...prev, fromState: state }));
    setIsFromOpen(false);
  };

  const handleToSelect = (state: string) => {
    setFormData((prev) => ({ ...prev, toState: state }));
    setIsToOpen(false);
  };

  const handleFleetStateSelect = (state: string) => {
    setFormData((prev) => ({ ...prev, fleetStates: state }));
    setIsFleetStateOpen(false);
  };

  // Handle Image Upload (multiple files at once)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadingCount((prev) => prev + fileArray.length);

    const uploadPromises = fileArray.map(async (file) => {
      try {
        const url = await uploadToCloudinary(file);
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, url],
        }));
      } catch (error) {
        console.error("Image upload failed", error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingCount((prev) => prev - 1);
      }
    });

    await Promise.all(uploadPromises);

    // Reset file input so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(
        capacityError ||
          priceError ||
          (editFleetData
            ? "Please fill in Model and Size"
            : "Please fill in all required fields and upload at least one image."),
      );
      return;
    }

    try {
      const payload: Partial<FleetPayload> = editFleetData
        ? {
            model: formData.model,
            capacity: formData.size,
          }
        : {
            fleetName: formData.fleetName,
            fleetNumber: formData.fleetNumber,
            iot: formData.iot,
            model: formData.model,
            capacity: formData.size,
            price: Number(formData.price),
            priceNegotiation: formData.isNegotiable,
            images: formData.images.filter(Boolean), // remove undefined/null slots
            fleetDescription: formData.description,
            fleetStates: fleetStatusToApi(formData.fleetStates),
            route: {
              fromState: formData.fromState || "Kaduna",
              toState: formData.toState || "Lagos",
            },
          };

      if (editFleetData) {
        updateFleet({ id: editFleetData.id, data: payload }, {
          onSuccess: () => {
            onClose();
          },
          onError: () => {
            toast.error("Error updating fleet.");
          }
        });
      } else {
        addFleet(payload as FleetPayload, {
          onSuccess: () => {
            onClose();
            // Reset form will be handled by the useEffect
          },
          onError: () => {
            toast.error("Error creating fleet.");
          }
        });
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Close dropdowns relative click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setIsFromOpen(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setIsToOpen(false);
      }
      if (fleetStateDropdownRef.current && !fleetStateDropdownRef.current.contains(event.target as Node)) {
        setIsFleetStateOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#2b2b2bbc] flex items-center justify-center z-50 p-4"
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={editFleetData ? "Edit fleet" : "Add fleet"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-[#fefefe] rounded-lg w-full max-w-[500px] overflow-y-auto max-h-[90vh] p-4 sm:p-6"
          >
            <div
              onClick={onClose}
              className="absolute top-[1.2rem] right-[1.2rem] cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              <XModalIcon />
            </div>
            <h2 className="text-[16px] pt-2 font-medium text-center text-[#2b2b2b] font-montserrat mb-6">
              {editFleetData ? "Edit Fleet" : "Upload Fleet"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 pb-2">
              
              {/* Fleet Name and Fleet Number */}
              <div className="flex flex-col sm:flex-row gap-[15px] w-full max-w-[480px] mx-auto">
                <div className="w-full sm:w-1/2">
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Fleet Name
                  </label>
                  <input
                    type="text"
                    name="fleetName"
                    value={formData.fleetName}
                    onChange={handleInputChange}
                    disabled={!!editFleetData}
                    className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat focus:border-[#538e53] transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Enter fleet name"
                    required={!editFleetData}
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Fleet Number
                  </label>
                  <input
                    type="text"
                    name="fleetNumber"
                    value={formData.fleetNumber}
                    onChange={handleInputChange}
                    disabled={!!editFleetData}
                    className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat focus:border-[#538e53] transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="e.g., ABC-123"
                    required={!editFleetData}
                  />
                </div>
              </div>

              {/* IOT and Model */}
              <div className="flex flex-col sm:flex-row gap-[15px] w-full max-w-[480px] mx-auto">
                <div className="w-full sm:w-1/2">
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    IOT Tracking Code
                  </label>
                  <input
                    type="text"
                    name="iot"
                    value={formData.iot}
                    onChange={handleInputChange}
                    disabled={!!editFleetData}
                    className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat focus:border-[#538e53] transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="TRK-001"
                    required={!editFleetData}
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat focus:border-[#538e53] transition-colors"
                    placeholder="e.g., Volvo"
                    required
                  />
                </div>
              </div>

              {/* Route: From and To */}
              <div className="flex flex-col sm:flex-row gap-[15px] w-full max-w-[480px] mx-auto relative">
                <div className="relative w-full sm:w-1/2" ref={fromDropdownRef}>
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Route: From
                  </label>
                  <div
                    onClick={() => !editFleetData && setIsFromOpen(!isFromOpen)}
                    className={`flex items-center justify-between w-full border border-[#d9d9d9] rounded-[4px] px-3 py-2 ${editFleetData ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer focus-within:border-[#538e53]'} transition-colors`}
                  >
                    <span className={`text-[13px] font-montserrat ${formData.fromState ? 'text-[#2b2b2b]' : 'text-[#a0a0a0]'}`}>
                      {formData.fromState || "Select Origin"}
                    </span>
                    {isFromOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  {isFromOpen && (
                    <div className="absolute z-20 w-full bg-[#fefefe] border border-[#d9d9d9] rounded-[4px] mt-1 max-h-[150px] overflow-y-auto shadow-md">
                      {nigerianStates.map((state) => (
                        <div
                          key={`from-${state}`}
                          onClick={() => handleFromSelect(state)}
                          className="px-3 py-2 text-[12px] font-montserrat hover:bg-[#f1f1f1] cursor-pointer"
                        >
                          {state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative w-full sm:w-1/2" ref={toDropdownRef}>
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Route: To
                  </label>
                  <div
                    onClick={() => !editFleetData && setIsToOpen(!isToOpen)}
                    className={`flex items-center justify-between w-full border border-[#d9d9d9] rounded-[4px] px-3 py-2 ${editFleetData ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer focus-within:border-[#538e53]'} transition-colors`}
                  >
                    <span className={`text-[13px] font-montserrat ${formData.toState ? 'text-[#2b2b2b]' : 'text-[#a0a0a0]'}`}>
                      {formData.toState || "Select Destination"}
                    </span>
                    {isToOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  {isToOpen && (
                    <div className="absolute z-20 w-full bg-[#fefefe] border border-[#d9d9d9] rounded-[4px] mt-1 max-h-[150px] overflow-y-auto shadow-md">
                      {nigerianStates.map((state) => (
                        <div
                          key={`to-${state}`}
                          onClick={() => handleToSelect(state)}
                          className="px-3 py-2 text-[12px] font-montserrat hover:bg-[#f1f1f1] cursor-pointer"
                        >
                          {state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price and Size */}
              <div className="flex flex-col sm:flex-row gap-[15px] w-full max-w-[480px] mx-auto">
                <div className="w-full sm:w-1/2">
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={!!editFleetData}
                    className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat focus:border-[#538e53] transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Enter price"
                    aria-invalid={!!priceError}
                    min="1"
                    required={!editFleetData}
                  />
                  {priceError && (
                    <p className="text-red-500 text-[11px] font-montserrat mt-1">
                      {priceError}
                    </p>
                  )}
                </div>
                <div className="w-full sm:w-1/2">
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Capacity
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat focus:border-[#538e53] transition-colors"
                    placeholder="e.g., 20 tons"
                    aria-invalid={!!capacityError}
                    required
                  />
                  {capacityError && (
                    <p className="text-red-500 text-[11px] font-montserrat mt-1">
                      {capacityError}
                    </p>
                  )}
                </div>
              </div>

              {/* Fleet State and Negotiation Toggle */}
              <div className="flex flex-col sm:flex-row gap-[15px] w-full max-w-[480px] mx-auto relative items-start">
                <div className="relative w-full sm:w-1/2" ref={fleetStateDropdownRef}>
                  <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Fleet Status
                  </label>
                  <div
                    onClick={() => !editFleetData && setIsFleetStateOpen(!isFleetStateOpen)}
                    className={`flex items-center justify-between w-full border border-[#d9d9d9] rounded-[4px] px-3 py-2 transition-colors ${editFleetData ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer focus-within:border-[#538e53]'}`}
                  >
                    <span className="text-[13px] font-normal text-[#2b2b2b] font-montserrat">
                      {formData.fleetStates}
                    </span>
                    {isFleetStateOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  {isFleetStateOpen && (
                    <div className="absolute z-20 w-full bg-[#fefefe] border border-[#d9d9d9] rounded-[4px] mt-1 shadow-md">
                      {fleetStatesOptions.map((state) => (
                        <div
                          key={`status-${state}`}
                          onClick={() => handleFleetStateSelect(state)}
                          className="px-3 py-2 text-[12px] font-montserrat hover:bg-[#f1f1f1] cursor-pointer"
                        >
                          {state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-1/2">
                  <span className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                    Is this price negotiable?
                  </span>
                  <div className="flex gap-[10px]">
                    <button
                      type="button"
                      disabled={!!editFleetData}
                      onClick={() => handleNegotiableToggle(true)}
                      className={`flex-1 border border-[#538e53] rounded-[4px] py-2 text-[12px] font-montserrat font-medium transition-colors ${
                        formData.isNegotiable
                          ? "bg-[#538e53] text-[#fefefe]"
                          : "text-[#2b2b2b] hover:bg-[#ebf3eb]"
                      } ${editFleetData ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      disabled={!!editFleetData}
                      onClick={() => handleNegotiableToggle(false)}
                      className={`flex-1 border border-[#538e53] rounded-[4px] py-2 text-[12px] font-montserrat font-medium transition-colors ${
                        !formData.isNegotiable
                          ? "bg-[#538e53] text-[#fefefe]"
                          : "text-[#2b2b2b] hover:bg-[#ebf3eb]"
                      } ${editFleetData ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Image Section */}
              <div className="w-full max-w-[480px] mx-auto pt-2">
                <span className="text-[12px] font-medium text-[#2b2b2b] font-montserrat block mb-2">
                  Add Images
                </span>
                <div className="flex flex-wrap gap-[10px] items-center">
                  {formData.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative flex items-center justify-center bg-[#f9f9f9] border border-[#d9d9d9] rounded-[4px] w-[80px] h-[70px] sm:h-[80px] overflow-hidden group"
                    >
                      <Image
                        src={url}
                        alt={`Fleet uploaded ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {editFleetData ? (
                          <div className="text-white text-xs bg-gray-500 rounded px-2 py-1">Locked</div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-white text-xs bg-red-500 hover:bg-red-600 rounded px-2 py-1 transition-colors pointer-events-auto cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {uploadingCount > 0 && (
                    <div className="flex items-center justify-center bg-[#f9f9f9] border border-dashed border-[#a0a0a0] rounded-[4px] w-[80px] h-[70px] sm:h-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-5 border-2 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] text-[#a0a0a0] font-montserrat">{uploadingCount}</span>
                      </div>
                    </div>
                  )}
                  {!editFleetData && (
                    <label className="flex items-center justify-center bg-[#f9f9f9] border border-dashed border-[#a0a0a0] rounded-[4px] w-[80px] h-[70px] sm:h-[80px] hover:bg-[#f1f1f1] transition-colors cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <GalleryAddIcon />
                    </label>
                  )}
                </div>
              </div>

              {/* Fleet Description */}
              <div className="w-full max-w-[480px] mx-auto pt-2">
                <label className="text-[12px] font-medium text-[#2b2b2b] font-montserrat mb-1 block">
                  Fleet Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!!editFleetData}
                  className="w-full border border-[#d9d9d9] outline-none rounded-[4px] px-3 py-2 text-[13px] placeholder:text-[#a0a0a0] font-montserrat resize-none h-[80px] focus:border-[#538e53] transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Enter fleet description"
                  required={!editFleetData}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPending || !isFormValid}
                  className={`cursor-pointer flex items-center justify-center mx-auto w-full max-w-[480px] font-montserrat font-medium text-[15px] rounded-[4px] py-3 transition-colors ${
                    isPending || !isFormValid
                      ? "bg-[#a0a0a0] text-[#fefefe] cursor-not-allowed"
                      : "bg-[#538e53] hover:bg-[#467a46] text-[#fefefe]"
                  }`}
                >
                  {isPending ? "Processing..." : (editFleetData ? "Save Changes" : "Upload Fleet")}
                </button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddFleet;
