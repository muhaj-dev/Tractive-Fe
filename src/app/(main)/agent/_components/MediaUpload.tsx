import React, { useRef } from "react";
import Image from "next/image";
// import { GalleryAddIcon } from "./Icons/AgentIcons"; // Unused
// If icons aren't available globally, I'll fallback to simple text/svg

interface MediaUploadProps {
  imagePreviews: string[];
  videoPreviews: string[];
  onImagesSelect: (files: File[]) => void;
  onVideoSelect: (file: File) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  isUploading?: boolean;
  /**
   * Mark the images section as required. True when listing a new product (a listing
   * needs a photograph); false when editing, where the product already has images.
   */
  imagesRequired?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  imagePreviews,
  videoPreviews,
  onImagesSelect,
  onVideoSelect,
  onRemoveImage,
  onRemoveVideo,
  isUploading = false,
  imagesRequired = false,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onImagesSelect(Array.from(e.target.files));
      // Reset input value to allow re-selecting same file if needed (though usually we append)
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onVideoSelect(e.target.files[0]);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Upload Images Section */}
      <div className="w-full">
        <label className="text-[14px] font-medium text-[#2b2b2b] font-montserrat mb-3 block">
          Upload Images (Unlimited){imagesRequired ? " *" : ""}
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {imagePreviews.map((src, index) => (
            <div
              key={`img-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
            >
              <Image
                src={src}
                alt={`Preview ${index}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1">
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Add Image Button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center aspect-square bg-[#f8f8f8] border-2 border-dashed border-[#e0e0e0] rounded-lg cursor-pointer hover:bg-[#efefef] hover:border-[#538e53] transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-1 group-hover:border-[#538e53] transition-colors">
              <span className="text-xl text-[#808080] group-hover:text-[#538e53] leading-none pb-1">
                +
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-[#808080] font-montserrat group-hover:text-[#538e53]">
              Add Image
            </span>
          </button>
        </div>

        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {/* Upload Video Section */}
      <div className="w-full">
        <label className="text-[14px] font-medium text-[#2b2b2b] font-montserrat mb-3 block">
          Upload Video (Max 1)
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {videoPreviews.map((src, index) => (
            <div
              key={`vid-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-black border border-gray-200 group"
            >
              <video
                src={src}
                className="w-full h-full object-cover opacity-80"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white text-2xl drop-shadow-md">▶</span>
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1">
                <button
                  type="button"
                  onClick={() => onRemoveVideo(index)}
                  className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {videoPreviews.length < 1 && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => videoInputRef.current?.click()}
              className="flex flex-col items-center justify-center aspect-square bg-[#f8f8f8] border-2 border-dashed border-[#e0e0e0] rounded-lg cursor-pointer hover:bg-[#efefef] hover:border-[#538e53] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-1 group-hover:border-[#538e53] transition-colors">
                <span className="text-sm text-[#808080] group-hover:text-[#538e53]">
                  ▶
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-[#808080] font-montserrat group-hover:text-[#538e53]">
                Add Video
              </span>
            </button>
          )}
        </div>

        <input
          type="file"
          ref={videoInputRef}
          accept="video/mp4,video/quicktime,video/x-msvideo,video/avi"
          className="hidden"
          onChange={handleVideoChange}
        />
      </div>
    </div>
  );
};
