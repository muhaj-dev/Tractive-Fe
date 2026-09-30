import Image from "next/image";
import React from "react";

interface Props {
  onOpen: () => void;
}

export const PPLiveChatAndHotLine = ({ onOpen }: Props) => {
  return (
    <div className="w-full flex flex-col">
      <div className="w-[90%] mx-auto flex gap-4 justify-start lg:justify-center p-2">
        {/* Live Chat */}
        <button
          type="button"
          onClick={onOpen}
          className="flex gap-4 items-center text-left lg:py-[3px] rounded-[4px] lg:px-[20px] lg:bg-[#1414140d] md:h-[63px] cursor-pointer"
        >
          <div className="hidden md:block">
            <Image
              src="/images/LCHL.png"
              alt=""
              width={39.476}
              height={39.476}
            />
          </div>
          <div className="flex flex-col">
            <p className="font-montserrat hidden md:block font-normal lg:hidden text-sm">
              Chat 24/7
            </p>
            <p className=" font-montserrat text-[#538e53] font-normal text-sm">
              Live Chat with us
            </p>
          </div>
        </button>

        {/* Hotline */}
        <div className="flex gap-4 items-center rounded-[4px] lg:py-[3px] lg:px-[20px] lg:bg-[#1414140d] md:h-[63px]">
          <div className="hidden md:block">
            <Image
              src="/images/LCHL.png"
              alt=""
              width={39.476}
              height={39.476}
            />
          </div>
          <div className="flex items-center md:items-start gap-2 md:flex-col ">
            <p className="text-[#9f9f9f] md:text-[#2b2b2b] font-normal font-montserrat block text-sm">
              Hot-line
            </p>
            <span className="text-[#9f9f9f] md:hidden">:</span>
            <div className="text-[#538e53] flex items-center gap-3 text-sm font-montserrat font-normal">
              <p>09034145971</p>
              <p>09034145971</p>
              <p className="hidden md:block">09034145971</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
