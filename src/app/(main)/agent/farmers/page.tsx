"use client";
import React, { useState, useEffect } from "react";
import { FarmerList } from "./_components/FarmerList";
import { FarmerFormModal, FarmerFormData } from "./_components/FarmerFormModal";
import { Farmer, FarmerFilters } from "@/services/FarmerService";
import {
  useFarmers,
  useCreateFarmer,
  useUpdateFarmer,
} from "@/hooks/queries/useFarmerQueries";
import { toast } from "sonner";

import { FarmerDetailModal } from "./_components/FarmerDetailModal";

const FarmersListPage: React.FC = () => {
  // Local state for modals and editing
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFarmer, setEditFarmer] = useState<Farmer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewFarmer, setViewFarmer] = useState<Farmer | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FarmerFilters>({
    page: 1,
    limit: 10,
    search: "",
    year: "",
    month: "",
  });

  // Debounced search state
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search update
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleYearChange = (year: string) => {
    setFilters((prev) => ({ ...prev, year, page: 1 }));
  };

  const handleMonthChange = (month: string) => {
    setFilters((prev) => ({ ...prev, month, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // React Query hooks
  const {
    data: farmersResponse,
    isLoading: farmersLoading,
    error: farmersError,
  } = useFarmers(filters);

  const createFarmerMutation = useCreateFarmer();
  const updateFarmerMutation = useUpdateFarmer();

  const farmersData = farmersResponse?.farmers || [];
  const pagination = {
    page: farmersResponse?.page || 1,
    limit: farmersResponse?.limit || 10,
    total: farmersResponse?.total || 0,
  };

  // Handlers
  const handleView = (id: string) => {
    const farmer = farmersData.find((f) => f.id === id);
    if (farmer) {
      setViewFarmer(farmer);
      setIsDetailModalOpen(true);
    } else {
      console.error(`❌ Farmer with ID ${id} not found in current list`);
      toast.error("Farmer not found");
    }
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setViewFarmer(null);
  };

  const handleEdit = (id: string) => {
    const farmer = farmersData.find((f) => f.id === id);
    if (farmer) {
      setEditFarmer(farmer);
      setIsEditModalOpen(true);
    } else {
      console.error(`❌ Farmer with ID ${id} not found in current list`);
      // If not in list, maybe fetch it? But usually expected in list.
      toast.error("Farmer not found");
    }
  };

  const handleOnboardSubmit = async (formData: FarmerFormData) => {
    try {
      await createFarmerMutation.mutateAsync(formData);
      setIsOnboardModalOpen(false);
    } catch (error) {
      console.error("❌ Error creating farmer:", error);
    }
  };

  const handleEditSubmit = async (formData: FarmerFormData) => {
    if (!editFarmer) {
      toast.error("No farmer selected for editing");
      return;
    }

    try {
      await updateFarmerMutation.mutateAsync({
        id: editFarmer.id,
        data: formData,
      });
      setIsEditModalOpen(false);
      setEditFarmer(null);
    } catch (error) {
      console.error("❌ Error updating farmer:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto mb-5 flex flex-col bg-[#fefefe] rounded-[10px] shadow-md">
        <h2 className="text-[17px] font-montserrat text-[#808080] px-6 pt-6 mb-4">
          Farmers{" "}
        </h2>

        {/* Error Message */}
        {farmersError && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-semibold mb-1">Error</p>
            <p className="text-red-600 text-sm">
              {(farmersError as Error)?.message || "Failed to load farmers"}
            </p>
          </div>
        )}

        {/* Modals */}
        <FarmerFormModal
          isOpen={isOnboardModalOpen}
          onClose={() => setIsOnboardModalOpen(false)}
          onSubmit={handleOnboardSubmit}
          isSubmitting={createFarmerMutation.isPending}
        />

        <FarmerFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditFarmer(null);
          }}
          onSubmit={handleEditSubmit}
          editFarmer={editFarmer}
          isSubmitting={updateFarmerMutation.isPending}
        />

        <FarmerDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          farmer={viewFarmer}
        />

        <div className="w-full h-[1px] bg-[#e2e2e2]"></div>

        {/* List Component */}
        <FarmerList
          farmers={farmersData}
          isLoading={farmersLoading}
          onEdit={handleEdit}
          onView={handleView}
          onAdd={() => setIsOnboardModalOpen(true)}
          filters={{ ...filters, search: searchTerm }} // Pass local search term for input value
          onSearchChange={setSearchTerm}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default FarmersListPage;
