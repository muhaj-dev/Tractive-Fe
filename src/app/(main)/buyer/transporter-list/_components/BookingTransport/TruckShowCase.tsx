import { ArrowRightIcon } from "@/icons/Icons";
import Image from "next/image";
import React, { useRef } from "react";

interface TruckShowCaseProps {
  images: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export const TruckShowCase: React.FC<TruckShowCaseProps> = ({
  images,
  currentIndex,
  onSelect,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    onSelect(nextIndex);
    if (scrollContainerRef.current) {
      const child = scrollContainerRef.current.children[nextIndex] as HTMLElement;
      if (child) {
        scrollContainerRef.current.scrollTo({
          left: child.offsetLeft,
          behavior: "smooth",
        });
      }
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto py-4 flex items-center gap-4">
        <div
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-3 md:gap-4 scrollbar-thin scrollbar-thumb-[#538e53] scrollbar-track-[#f5f5f5]"
          ref={scrollContainerRef}
        >
          {images.map((src, index) => (
            <button
              type="button"
              aria-label={`Show truck image ${index + 1}`}
              aria-pressed={index === currentIndex}
              key={index}
              className={`relative flex-shrink-0 w-[150px] sm:w-[200px] md:w-[220px] lg:w-[241px] h-[100px] sm:h-[120px] md:h-[140px] snap-start transition-all duration-200 cursor-pointer rounded-md overflow-hidden ${
                index === currentIndex
                  ? "border-2 border-[#538e53] opacity-100"
                  : "border-2 border-transparent opacity-70 hover:opacity-100"
              }`}
              onClick={() => onSelect(index)}
            >
              <Image
                src={src}
                alt={`Truck image ${index + 1}`}
                fill
                className="rounded-md object-cover"
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <button
            type="button"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#fefefe] rounded-full cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            onClick={handleNext}
            aria-label="Next truck image"
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
