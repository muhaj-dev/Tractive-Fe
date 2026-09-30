"use client";
import { Button } from "@/components/Button";
import Image from "next/image";
import { useRef, useState } from "react";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";

type Option = {
  id: string;
  label: string;
};

const options: Option[] = [
  { id: "anItem", label: "An item" },
  { id: "others", label: "Others" },
  { id: "agent", label: "Agent" },
  { id: "transporter", label: "Transporter" },
  { id: "buyer", label: "Buyer" }, // This will be the active/default one
];

export const ReportForm = () => {
  const [selected, setSelected] = useState<string>("buyer");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full bg-[#f1f1f1] pt-4 pb-16">
      <div className="w-[90%] max-w-[1200px] mx-auto bg-white rounded-[10px]">
        <div className="flex flex-col w-full px-4 md:px-10 py-10">
          <h2 className="text-[20px] text-center text-[#808080] font-montserrat font-normal mb-6">
            Report Form
          </h2>

          <div className="flex flex-col gap-8">
            {/* Options */}
            <div className="flex flex-col items-center justify-center py-[20px]">
              <h4 className="mb-4 text-center font-montserrat font-normal text-[#808080] text-[17px]">
                I am Reporting:
              </h4>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="report-option"
                      value={option.id}
                      checked={selected === option.id}
                      onChange={() => setSelected(option.id)}
                      className="w-4 h-4 accent-[#538E53] cursor-pointer"
                    />
                    <span className="text-[13px] font-normal font-montserrat text-[#2b2b2b]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form */}
            <form className="flex flex-col justify-center items-center gap-6">
              <div className="w-full md:w-[70%]">
                <label
                  htmlFor="report-name-link-id"
                  className="block mb-2 font-montserrat text-sm font-medium text-[#2b2b2b]"
                >
                  Link / ID / Name
                </label>
                <input
                  id="report-name-link-id"
                  type="text"
                  className="block p-2.5 w-full text-sm text-[#2b2b2b] rounded-full border border-[#808080] focus:ring-[#538E53] focus:border-[#538E53]"
                  placeholder="Enter the link, ID, or name of the item"
                  required
                />
              </div>

              <div className="w-full md:w-[70%]">
                <label
                  htmlFor="report-description"
                  className="block mb-2 font-montserrat text-sm font-medium text-[#2b2b2b]"
                >
                  Description
                </label>
                <textarea
                  id="report-description"
                  rows={6}
                  className="block p-2.5 w-full text-sm text-[#2b2b2b] rounded-lg border border-[#808080] focus:ring-[#538E53] focus:border-[#538E53]"
                  placeholder="Write your description here..."
                  required
                ></textarea>
              </div>

              {/* Image Upload */}
              <div className="w-full md:w-[70%] px-4">
                {/* Stays a div: it wraps the hidden file input. */}
                <div
                  onClick={handleClick}
                  role="button"
                  tabIndex={0}
                  aria-label={preview ? "Change image" : "Upload image"}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleClick();
                    }
                  }}
                  className="relative w-full max-w-[184px] h-[90px] rounded-md cursor-pointer flex items-center justify-center bg-[#f1f1f1] hover:bg-gray-100 transition"
                >
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Uploaded"
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <MdOutlineAddPhotoAlternate size={40} color="#808080" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={inputRef}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="w-full md:w-[70%] px-4">
                <Button
                  text="Done"
                  onClick={() => {}}
                  className="w-full max-w-[12rem] justify-center"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
