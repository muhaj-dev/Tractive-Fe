"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "../../../Buyer.css"

interface ImageSliderProps {
  sliderImages: string[];
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  sliderImages,
  currentSlide,
  setCurrentSlide,
}) => {
  // Auto-slide functionality
  useEffect(() => {
    // With no images, `% 0` is NaN and the index never recovers.
    if (!sliderImages.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 3000); // Auto-slide every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [sliderImages.length, setCurrentSlide]);

  // The list can shrink under a stale index, which would render <Image> with no src.
  const activeImage = sliderImages[currentSlide] ?? sliderImages[0];

  // Slider navigation
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="w-full lg:w-[75%] relative">
      <div className="relative w-full h-[150px] image-slider-content  rounded-[4px] overflow-hidden">
        <AnimatePresence>
          {activeImage && (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage}
                alt={`Slider Image ${currentSlide + 1}`}
                width={800}
                height={350}
                className="rounded-[4px] h-full w-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Slider Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition ${
              currentSlide === index ? "bg-[#2B2B2B]" : "bg-[#F1F1F1]"
            }`}
            title={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      <Link
        href="/buyer/sellers-list"
        className="text-[#2B2B2B] flex items-center justify-center absolute bottom-[0] left-[0] bg-[#FEFEFE] px-[1.4rem] py-[0.6rem] md:py-[0.9rem] text-[0.6rem] md:text-[0.79rem] w-[6rem] md:w-[8rem] font-normal"
      >
        Bid Now
      </Link>
    </div>
  );
};
