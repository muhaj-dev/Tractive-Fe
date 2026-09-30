"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActionMenuProps } from "../../_components/ActionMenuProps";
import { ThreeDotIcon } from "../../produce-list/_components/table/ActionMenu";
import { useDeleteFarmer } from "@/hooks/queries/useFarmerQueries";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { createPortal } from "react-dom";
import { anchoredMenuStyle } from "@/utils/menuPosition";

export interface FarmerActionMenuProps extends ActionMenuProps {
  handleView?: (id: string) => void;
}

export const FarmerActionMenu: React.FC<FarmerActionMenuProps> = ({
  productId,
  activeMenu,
  setActiveMenu,
  handleEdit,
  handleView,
}) => {
  const isActive = activeMenu === productId;
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const deleteFarmerMutation = useDeleteFarmer();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveMenu]);

  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteFarmerMutation.mutateAsync(productId);
      setShowDeleteModal(false);
      setActiveMenu(null);
    } catch (error) {
      console.error("Failed to delete farmer:", error);
    }
  };

  const menuStyle =
    isActive && buttonRef.current
      ? anchoredMenuStyle(buttonRef.current, { width: 140, estHeight: 140 })
      : { top: 0, left: 0 };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          ref={buttonRef}
          title="Open action menu"
          aria-label="Open action menu"
          onClick={() => setActiveMenu(isActive ? null : productId)}
          className="bg-[#f1f1f1] rounded-full cursor-pointer p-1.5 w-[30px] h-[30px] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors duration-200"
        >
          <ThreeDotIcon />
        </button>
        {mounted &&
          createPortal(
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="fixed w-[140px] py-1 px-1 bg-[#fefefe] rounded-[5px] shadow-lg pointer-events-auto z-[999]"
                  style={menuStyle}
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.2 }}
                >
                  {handleView && (
                    <button
                      onClick={() => {
                        handleView(productId);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-montserrat text-[#2b2b2b] hover:bg-gray-100 rounded transition-colors"
                    >
                      View Details
                    </button>
                  )}
                  {handleEdit && (
                    <button
                      onClick={() => {
                        handleEdit(productId);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-montserrat text-[#2b2b2b] hover:bg-gray-100 rounded transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleteFarmerMutation.isPending}
                    className="w-full text-left px-4 py-2 text-sm font-montserrat text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteFarmerMutation.isPending}
      />
    </>
  );
};
