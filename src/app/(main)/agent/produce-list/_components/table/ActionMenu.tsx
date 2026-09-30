"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { DeleteConfirmationModal } from "../../../farmers/_components/DeleteConfirmationModal";

// Animation variants for dropdown
const dropdownVariants = {
  hidden: { opacity: 0, scaleY: 0, transformOrigin: "top" },
  visible: { opacity: 1, scaleY: 1, transition: { duration: 0.2 } },
};

interface ActionMenuProps {
  productId: string;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  handleEdit: (id: string) => void;
  handleOutOfStock: (id: string) => void;
  handleDelete: (id: string) => void;
  isOutOfStockPage: boolean;
}

export const ThreeDotIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="7"
      height="18"
      viewBox="0 0 7 21"
      fill="none"
    >
      <path
        d="M1.5 17.5C1.5 18.6 2.4 19.5 3.5 19.5C4.6 19.5 5.5 18.6 5.5 17.5C5.5 16.4 4.6 15.5 3.5 15.5C2.4 15.5 1.5 16.4 1.5 17.5ZM1.5 3.5C1.5 4.6 2.4 5.5 3.5 5.5C4.6 5.5 5.5 4.6 5.5 3.5C5.5 2.4 4.6 1.5 3.5 1.5C2.4 1.5 1.5 2.4 1.5 3.5ZM1.5 10.5C1.5 11.6 2.4 12.5 3.5 12.5C4.6 12.5 5.5 11.6 5.5 10.5C5.5 9.4 4.6 8.5 3.5 8.5C2.4 8.5 1.5 9.4 1.5 10.5Z"
        stroke="#2B2B2B"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const ActionMenu: React.FC<ActionMenuProps> = ({
  productId,
  activeMenu,
  setActiveMenu,
  handleEdit,
  handleOutOfStock,
  handleDelete,
  isOutOfStockPage,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for portal content
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is inside the trigger button OR the dropdown content
      const isInsideMenu =
        menuRef.current && menuRef.current.contains(e.target as Node);
      const isInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(e.target as Node);

      if (!isInsideMenu && !isInsideDropdown) {
        setActiveMenu(null);
      }
    };

    if (activeMenu === productId) {
      document.addEventListener("mousedown", handleClickOutside, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }
  }, [activeMenu, productId, setActiveMenu]);

  const handleEditClick = () => {
    handleEdit(productId);
    setActiveMenu(null);
  };

  const handleStatusClick = () => {
    handleOutOfStock(productId);
    setActiveMenu(null);
  };

  const handleDeleteConfirm = () => {
    handleDelete(productId);
    setShowDeleteModal(false);
    setActiveMenu(null);
  };

  const getMenuPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 8,
      left: rect.right - 140,
    };
  };

  const menuPos =
    activeMenu === productId ? getMenuPosition() : { top: 0, left: 0 };

  return (
    <>
      <div id={`menu-${productId}`} ref={menuRef} className="relative">
        <button
          ref={buttonRef}
          title="Open action menu"
          aria-label="Open action menu"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(activeMenu === productId ? null : productId);
          }}
          className="bg-[#f1f1f1] rounded-[100px] cursor-pointer p-1.5 w-[30px] h-[30px] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors duration-200"
        >
          <ThreeDotIcon />
        </button>

        {mounted &&
          createPortal(
            <AnimatePresence>
              {activeMenu === productId && (
                <motion.div
                  ref={dropdownRef}
                  className="fixed z-999 w-[140px] px-1 bg-[#fefefe] rounded-[5px] shadow-xl border border-[#e0e0e0]"
                  style={{
                    top: menuPos.top - window.scrollY,
                    left: menuPos.left,
                  }}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-2 cursor-pointer w-full text-left px-3 py-2 text-[12px] font-montserrat text-[#2b2b2b] rounded-[4px] hover:bg-[#f0f0f0] transition-colors duration-150"
                    aria-label="Edit product"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>

                  <button
                    onClick={handleStatusClick}
                    className="flex items-center gap-2 cursor-pointer w-full text-left px-3 py-2 text-[12px] font-montserrat text-[#2b2b2b] rounded-[4px] hover:bg-[#f0f0f0] transition-colors duration-150"
                    aria-label={
                      isOutOfStockPage
                        ? "Mark as back in stock"
                        : "Mark as out of stock"
                    }
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                    {isOutOfStockPage ? "Back in Stock" : "Out of Stock"}
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 cursor-pointer w-full text-left px-3 py-2 text-[12px] font-montserrat text-[#d32f2f] rounded-[4px] hover:bg-[#ffebee] transition-colors duration-150"
                    aria-label="Delete product"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
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
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </>
  );
};
