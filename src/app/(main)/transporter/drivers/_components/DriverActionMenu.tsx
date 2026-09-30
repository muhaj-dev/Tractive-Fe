"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { anchoredMenuStyle } from "@/utils/menuPosition";
import { motion, AnimatePresence } from "framer-motion";
import { ThreeDotIcon } from "../../fleet-list/_components/table/ActionMenu";
import { TransportActionMenuProps } from "../../_components/TransportActionMenuProps";

export const DriverActionMenu: React.FC<TransportActionMenuProps> = ({
  driverId,
  activeMenu,
  setActiveMenu,
  handleEdit,
  handleRemove,
  handleAssignFleet,
}) => {
  const isActive = activeMenu === driverId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    // Update position if window resizes or scrolls (optional, but good for fixed pos)
    const handleScroll = () => {
      if (isActive) setActiveMenu(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isActive, setActiveMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // We need to check if click is on the button
      if (
        buttonRef.current &&
        buttonRef.current.contains(event.target as Node)
      ) {
        return; 
      }
      // If click is anywhere else (portal or outside), close. 
      // Actually, if click is IN portal, we might want to keep it? 
      // But the buttons inside close it anyway. 
      // So generic Close on any click outside button is fine for now, 
      // EXCEPT if we click the menu itself?
      // Since buttons in menu call setActiveMenu(null), it's fine.
      // But if we click empty space in menu?
      // Let's rely on the fact that existing logic closed it.
      // The previous logic checked `menuRef.current.contains`.
      // Since it's a portal properly, we can just attach listener to document.
      setActiveMenu(null);
    };
    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActive, setActiveMenu]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      setActiveMenu(null);
    } else {
      if (buttonRef.current) {
        setMenuStyle(
          anchoredMenuStyle(buttonRef.current, { width: 130, estHeight: 150, gap: 5 }),
        );
      }
      setActiveMenu(driverId);
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <>
      <button
        ref={buttonRef}
        title="Open action menu"
        aria-label="Open action menu"
        onClick={toggleMenu}
        className="bg-[#f1f1f1] rounded-full cursor-pointer p-1.5 w-[30px] h-[30px] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors duration-200"
      >
        <ThreeDotIcon />
      </button>
      {isActive &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={menuStyle}
            onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
          >
            <AnimatePresence>
              <motion.div
                className="min-w-[120px] py-1 px-1 bg-[#fefefe] rounded-[5px] shadow-lg border border-gray-100"
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
              >
                {handleEdit && (
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                      handleEdit(driverId);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 text-[12px] font-montserrat text-[#2b2b2b] hover:bg-gray-100 rounded-[3px] transition-colors"
                  >
                    Edit
                  </button>
                )}
                {handleRemove && (
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                      handleRemove(driverId);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 text-[12px] font-montserrat text-[#2b2b2b] hover:bg-gray-100 rounded-[3px] transition-colors"
                  >
                    Remove
                  </button>
                )}
                {handleAssignFleet && (
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                      handleAssignFleet(driverId);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 text-[12px] font-montserrat text-[#2b2b2b] hover:bg-gray-100 rounded-[3px] transition-colors"
                  >
                    Assign Fleet
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
    </>
  );
};
