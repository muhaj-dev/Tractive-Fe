"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  useAdminBanners,
  useDeleteBanner,
  useUpdateBanner,
} from "@/hooks/queries/useBannerQueries";
import type { AdminBanner } from "@/services/bannerService";
import { TableSkeleton } from "../../_components/TableSkeleton";
import { ConfirmActionModal } from "../../_components/ConfirmActionModal";
import { BannerFormModal } from "./BannerFormModal";
import { BannerDetailsModal } from "./BannerDetailsModal";

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

const scheduleLabel = (banner: AdminBanner) => {
  if (!banner.startDate && !banner.endDate) return "Always";
  return `${formatDate(banner.startDate)} – ${formatDate(banner.endDate)}`;
};

export const BannerSettings = () => {
  const { data: banners, isLoading, isError, refetch } = useAdminBanners();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminBanner | null>(null);
  const [viewing, setViewing] = useState<AdminBanner | null>(null);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (banner: AdminBanner) => {
    setViewing(null);
    setEditing(banner);
    setIsFormOpen(true);
  };

  const toggleActive = (banner: AdminBanner) => {
    updateBanner.mutate({
      id: banner.id,
      payload: { isActive: !banner.isActive },
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteBanner.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // the mutation's onError already toasted
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[15px] font-montserrat font-medium text-[#2b2b2b]">
            Buyer homepage banners
          </h2>
          <p className="text-[12px] font-montserrat text-[#808080] mt-0.5">
            Active banners in date range show in the buyer header slider.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer shrink-0 px-4 py-2 text-[12px] font-montserrat font-medium text-[#fefefe] bg-[#538e53] rounded-[6px] hover:bg-[#467746] transition-colors"
        >
          + New banner
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={4} />
      ) : isError ? (
        <div className="text-center py-10">
          <p className="text-[13px] font-montserrat text-gray-500 mb-3">
            Could not load banners.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="cursor-pointer px-4 py-2 text-[12px] font-montserrat text-[#538e53] border border-[#538e53] rounded-[6px] hover:bg-[#538e53]/5"
          >
            Try again
          </button>
        </div>
      ) : !banners?.length ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-[8px]">
          <p className="text-[13px] font-montserrat text-gray-400">
            No banners yet. Create one to show it on the buyer homepage.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {["Banner", "Position", "Schedule", "Status", ""].map(
                  (header) => (
                    <th
                      key={header}
                      className="text-left py-2.5 px-3 text-[12px] font-montserrat font-medium text-[#808080]"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr
                  key={banner.id}
                  onClick={() => setViewing(banner)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    // Only when the row itself has focus, so Enter on a control inside the
                    // row does not also open it.
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewing(banner);
                    }
                  }}
                  className="cursor-pointer border-b border-gray-100 hover:bg-[#f9f9f9] transition-colors"
                >
                  <td className="py-3 px-3 max-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="relative w-[72px] h-[44px] shrink-0 rounded-[4px] overflow-hidden bg-[#f1f1f1]">
                        {banner.imageUrl ? (
                          <Image
                            src={banner.imageUrl}
                            alt={banner.alt || banner.title}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center border border-dashed border-gray-300 rounded-[4px] text-[9px] font-montserrat text-[#a0a0a0]">
                            No image
                          </span>
                        )}
                      </div>
                      <p className="min-w-0 text-[13px] font-montserrat text-[#2b2b2b] truncate">
                        {banner.title || "Untitled"}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[13px] font-montserrat text-[#2b2b2b]">
                    {banner.position ?? "—"}
                  </td>
                  <td className="py-3 px-3 text-[12px] font-montserrat text-[#2b2b2b] whitespace-nowrap">
                    {scheduleLabel(banner)}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(banner);
                      }}
                      disabled={updateBanner.isPending}
                      aria-pressed={banner.isActive}
                      className={`cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-montserrat font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        banner.isActive
                          ? "bg-[#538e53]/10 text-[#538e53] hover:bg-[#538e53]/20"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(banner);
                        }}
                        className="cursor-pointer px-3 py-1.5 text-[12px] font-montserrat text-[#2b2b2b] border border-gray-300 rounded-[6px] hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(banner);
                        }}
                        className="cursor-pointer px-3 py-1.5 text-[12px] font-montserrat text-[#D32F2F] border border-[#D32F2F]/30 rounded-[6px] hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BannerDetailsModal
        banner={viewing}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
      />

      <BannerFormModal
        banner={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!pendingDelete}
        title={`Delete "${pendingDelete?.title || "this banner"}"?`}
        description="The banner will be removed from the buyer homepage. This cannot be undone."
        confirmLabel="Delete banner"
        tone="danger"
        isSubmitting={deleteBanner.isPending}
        onCancel={() => !deleteBanner.isPending && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};
