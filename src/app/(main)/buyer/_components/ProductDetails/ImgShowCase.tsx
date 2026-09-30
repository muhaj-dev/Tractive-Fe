import { ArrowRightIcon, PlayIcon } from "@/icons/Icons";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { VideoPreview } from "./productHeader/VideoPreview";

interface ImgShowCaseProps {
  images?: string[];
  videoSrc?: string;
}

const PLACEHOLDER_IMAGE = "/images/placeholder.png";

type MediaItem =
  | { type: "video"; src: string }
  | { type: "image"; src: string };

export const ImgShowCase: React.FC<ImgShowCaseProps> = ({
  images: propImages,
  videoSrc,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // A product with no images shows one neutral placeholder, not demo produce
  // photos that read as this product's own.
  const displayImages =
    propImages && propImages.length > 0 ? propImages : [PLACEHOLDER_IMAGE];

  // Image URLs that failed to load. They render the placeholder instead of a
  // broken image.
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());
  const markFailed = (src: string) =>
    setFailedSrcs((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  const imageSrc = (src: string) =>
    !src || failedSrcs.has(src) ? PLACEHOLDER_IMAGE : src;

  const mediaItems: MediaItem[] = [];

  if (videoSrc) {
    mediaItems.push({ type: "video", src: videoSrc });
  } else if (!videoSrc && (!propImages || propImages.length === 0)) {
     // If no video provided but we are using defaults, maybe the first "default image" was meant to be a video placeholder? 
     // For now, let's treat the videoSrc input as the source of truth for video existence.
     // But wait, the original code had "/images/videoImg.png" as the first default image.
     // Let's stick to the prompt: "video should be the first to display".
  }
  
  // If we have a video, it is index 0.
  // Images follow.
  displayImages.forEach((img) => {
      mediaItems.push({ type: "image", src: img });
  });


  // Handle next and previous button clicks - Logic adapted for combined list
  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % mediaItems.length;
      if (scrollContainerRef.current) {
        const child = scrollContainerRef.current.children[
          nextIndex
        ] as HTMLElement;
        if (child) {
          const scrollAmount = child.offsetLeft;
          scrollContainerRef.current.scrollTo({
            left: scrollAmount,
            behavior: "smooth",
          });
        }
      }
      return nextIndex;
    });
  };

  const selectedMedia = mediaItems[currentIndex];

  return (
    <div className="w-full overflow-x-hidden flex flex-col gap-4">
      {/* Main Big Screen Display */}
      <div className="w-full">
         {selectedMedia?.type === "video" ? (
             <VideoPreview videoSrc={selectedMedia.src} />
         ) : (
             <div className="w-full aspect-[16/9] relative rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                 {/*  Using aspect ratio to match video approximately, or strictly controlling height? 
                      Original Image had: width={241} height={142} className="w-[100%] h-auto sm:w-56 sm:h-32 object-cover" in the list.
                      But we need a BIG display now.
                      Existing code didn't have a "big" image display in ImgShowCase, it just had a list.
                      Wait, previous code:
                      ImgShowCase was ONLY the list?
                      "i want both the video and the images should be in the listed section below. the video should be the first to display and when clicked on any other list below it , it should show on the big screen"
                      
                      Previously `ProductDetail` text: 
                      <VideoPreview ... /> (Big Video)
                      <ImgShowCase ... /> (List of images below)
                      
                      The user wants to MERGE them.
                      So ImgShowCase should now contain the Big Display AND the List.
                 */}
                  <Image
                    src={imageSrc(selectedMedia?.src || "")}
                    alt="Selected Product"
                    fill
                    className="object-contain"
                    onError={() => selectedMedia && markFailed(selectedMedia.src)}
                  />
             </div>
         )}
      </div>

      {/* Carousel List */}
      <div className="mx-auto py-4 flex items-center gap-4 w-full justify-center">
        <div
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-3 md:gap-4 scrollbar-thin scrollbar-thumb-[#538e53] scrollbar-track-[#f5f5f5] max-w-full"
          ref={scrollContainerRef}
        >
          {mediaItems.map((item, index) => (
            <button
              type="button"
              aria-label={`Show ${item.type === "video" ? "video" : "image"} ${index + 1}`}
              aria-pressed={index === currentIndex}
              key={index}
              className={`flex-shrink-0 w-[100px] sm:w-[150px] md:w-[180px] snap-start transition-all duration-200 cursor-pointer ${
                index === currentIndex
                  ? "border-2 border-[#538e53] opacity-100"
                  : "border-2 border-transparent opacity-70 hover:opacity-100"
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {item.type === 'video' ? (
                  <div className="relative w-full h-[60px] sm:h-[100px] bg-black flex items-center justify-center">
                      <video src={item.src} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <PlayIcon className="w-6 h-6 text-white" />
                      </div>
                  </div>
              ) : (
                  <Image
                    src={imageSrc(item.src)}
                    onError={() => markFailed(item.src)}
                    alt={`Product content ${index + 1}`}
                    width={180}
                    height={100}
                    className="w-full h-[60px] sm:h-[100px] object-cover"
                  />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#fefefe] rounded-full cursor-pointer hover:bg-gray-200 transition-colors duration-200 shadow-md"
          onClick={handleNext}
          aria-label="Next content"
        >
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
