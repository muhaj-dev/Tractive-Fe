"use client";
import { Button } from "@/components/Button";
import { AwardIcon, YellowStarIcon } from "@/icons/Icons";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import React from "react";

interface SellerCardProps {
  id: string;
  image: string;
  sellerName: string;
  rating: number;
  rateStatus: string;
  sellerYear: string | number;
  productsCount: number;
  totalReviews?: number;
  sellerBio?: string;
}

export const SellerCard: React.FC<SellerCardProps> = ({
  id,
  image,
  sellerName,
  rating,
  rateStatus,
  sellerYear,
  productsCount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalReviews,
  sellerBio,
}) => {
  return (
    <div className="border-[1px] border-[#808080] w-full rounded-lg">
      <div className="flex flex-col justify-center w-full p-3 rounded-lg">
        <UserAvatar
          src={image}
          name={sellerName}
          className="w-10 h-10 sm:w-12 sm:h-12"
        />
        <h2 className="font-montserrat font-medium text-[13px] sm:text-[15px] text-[#2b2b2b] mt-2">
          {sellerName}
        </h2>
        <div className="flex items-center w-full gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-1">
            <AwardIcon />
            <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
              {sellerYear == 0 || sellerYear === "0" ? "Less than a year" : `${sellerYear} years`}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#2b2b2b]"></span>
          <div className="flex items-center gap-2">
            {rating > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <YellowStarIcon />
                  <span className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                    {rating}
                  </span>
                </div>
                <p className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                  Rating <span>{rateStatus}</span>
                </p>
              </>
            ) : (
              <p className="font-montserrat font-normal text-[11px] text-[#2b2b2b]">
                {rateStatus}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center bg-[#F7DFFF80] w-fit py-1.5 px-3 rounded-[100px] justify-center gap-1">
          <p className="font-montserrat font-normal text-[10px] sm:text-[12px] text-[#2b2b2b]">
            {productsCount} products
          </p>
        </div>
        <p className="font-montserrat mt-2 font-normal text-[11px] text-[#2b2b2b]">
          {sellerBio}
        </p>
        <Link href={`/buyer/sellers-list/${id}`}>
          <Button
            text="View"
            onClick={() => {}}
            className="mx-auto justify-center w-full sm:w-[90%] mt-3 text-[#fefefe] py-2 px-4 !rounded-[100px]"
            textClass="font-montserrat font-normal text-[12px] sm:text-[13px] text-[#fefefe]"
          />
        </Link>
      </div>
    </div>
  );
};
