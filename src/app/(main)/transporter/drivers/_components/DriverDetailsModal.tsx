"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { XModalIcon } from "../../_components/Icons/TransporterIcons";
import { Driver } from "@/utils/DriverData";
import UserAvatar from "@/components/UserAvatar";

interface DriverDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

export const DriverDetailsModal: React.FC<DriverDetailsModalProps> = ({
  isOpen,
  onClose,
  driver,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  if (!isOpen || !driver) return null;

  const DetailItem = ({ label, value }: { label: string; value?: string | number }) => (
// ... (rest of helper components)
    <div className="flex flex-col gap-1">
      <span className="text-[10px] sm:text-[11px] font-montserrat text-[#808080] uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm sm:text-base font-montserrat text-[#2b2b2b] font-medium">
        {value || "N/A"}
      </span>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold font-montserrat text-[#538e53] mb-3 border-b border-[#e2e2e2] pb-1">
      {title}
    </h3>
  );

  const truck = driver.assignedTruck;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-110"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-details-title"
      >
        <motion.div
          className="bg-[#fefefe] p-6 sm:p-8 rounded-[12px] w-[95%] max-w-[650px] relative max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#2b2b2b] hover:text-[#538e53] transition-colors"
            aria-label="Close modal"
          >
            <XModalIcon />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <UserAvatar
              src={driver.image}
              name={driver.name}
              size={112}
              className="border-4 border-[#faf7f7] shadow-sm"
            />
            <div className="text-center sm:text-left">
              <h2 id="driver-details-title" className="text-xl sm:text-2xl font-montserrat font-bold text-[#2b2b2b]">
                {driver.name}
              </h2>
              <p className="text-[#538e53] font-montserrat text-sm font-medium">Professional Driver</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#538e5315] text-[#538e53]">
                {truck ? "Active - On Transit" : "Available"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col gap-4">
              <SectionTitle title="Personal Information" />
              <DetailItem label="Phone Number" value={driver.phone} />
              <DetailItem label="License Number" value={driver.licenseNumber} />
              <DetailItem label="Registration Date" value={driver.date} />
            </div>

            <div className="flex flex-col gap-4">
              <SectionTitle title="Vehicle Assignment" />
              {truck ? (
                <>
                  <DetailItem label="Fleet Name" value={truck.fleetName} />
                  <DetailItem label="Plate Number" value={truck.plateNumber} />
                  <DetailItem label="IoT Device ID" value={truck.iot} />
                  <DetailItem
                    label="Active Route"
                    value={`${truck.route.fromState} → ${truck.route.toState}`}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-[#faf7f7] rounded-[8px] border border-dashed border-[#e2e2e2]">
                  <p className="text-sm font-montserrat text-[#808080]">No truck assigned yet</p>
                </div>
              )}
            </div>
          </div>

          {truck && truck.images && truck.images.length > 0 && (
            <div className="mt-4">
              <SectionTitle title="Fleet Images" />
              <div className="flex flex-col gap-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#e2e2e2] bg-[#f5f5f5]">
                  <Image
                    src={truck.images[selectedImageIndex]}
                    alt={`Fleet ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
                {truck.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {truck.images.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx ? "border-[#538e53] scale-95" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={img} alt={`Fleet thumb ${idx + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-[#538e53] text-[#fefefe] text-sm font-montserrat font-medium rounded-[6px] hover:bg-[#467a46] transition-all shadow-md active:scale-95"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
