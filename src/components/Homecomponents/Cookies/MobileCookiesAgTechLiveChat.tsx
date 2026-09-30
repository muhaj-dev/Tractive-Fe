"use client";
import Image from "next/image";
import React from "react";

interface Props {
  onOpen: () => void;
}

export const MobileCookiesAgTechLiveChat = ({ onOpen }: Props) => {
  return (
    <div className="relative bg-[#538e53] w-[100%] mx-auto h-[220px] flex flex-col gap-[25px] rounded-[10px] overflow-hidden">
      <div className="flex justify-end items-start w-[100%]">
        <div className="flex flex-col ">
          <div className="flex flex-col justify-start w-[100%] gap-[55px] pr-2 pt-6">
            <div className="flex flex-col items-start justify-start w-[100%]">
              <h1 className="text-[1.5rem] font-montserrat font-normal text-left bg-gradient-to-b from-[#06AD06] to-[#ffffff] bg-clip-text text-transparent">
                AGRICTECH
              </h1>
              <p className="text-[#f9f9f9] text-left font-montserrat font-normal text-[12px] leading-[25px]">
                Connecting farmers, buyers and transporters
              </p>
            </div>
            <button
              type="button"
              onClick={onOpen}
              className="z-10 text-[#f9f9f9] text-right pr-6 font-montserrat font-normal text-[12px] leading-[25px] cursor-pointer"
            >
              Customer Service 24/7
            </button>
          </div>
          <div className="z-0 flex flex-col items-start justify-start w-[200px] absolute bottom-0 left-0 right-0">
            <Image
              src="/images/customerService.png"
              alt="Customer Service"
              width={825}
              height={742}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
