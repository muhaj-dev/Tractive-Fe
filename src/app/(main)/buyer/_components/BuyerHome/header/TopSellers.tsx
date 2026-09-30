"use client";

import React from "react";
import UserAvatar from "@/components/UserAvatar";
import { useRouter } from "next/navigation";

import { LoaderIcon } from "@/icons/Icons";

interface Seller {
  id: string;
  name: string;
  image: string;
  rating: number;
  storeLink: string;
}

interface TopSellersProps {
  topSellers: Seller[];
  loadingStates: Record<string, boolean>;
  isFollowing: (sellerId: string) => boolean;
  toggleFollow: (sellerId: string, sellerName?: string) => Promise<void>;
  renderStars: (rating: number) => React.ReactNode[];
}

export const TopSellers: React.FC<TopSellersProps> = ({
  topSellers,
  loadingStates,
  isFollowing,
  toggleFollow,
  renderStars,
}) => {
  const router = useRouter();
  // Loader SVG
  const Loader = () => <LoaderIcon />;

  return (
    <div className="w-full lg:w-[33%] bg-[#FEFEFE] rounded-[4px] flex flex-col gap-4 mb-4 lg:mb-0">
      <p className="text-[#2B2B2B] bg-[#CCE5CC80] px-4 py-[0.7rem] rounded-tl-[7px] rounded-br-[7px] text-[0.89rem] w-[7rem] font-normal">
        Top Sellers
      </p>
      <div className="flex flex-col gap-4 mx-auto mb-0 md:mb-4 w-[90%]">
        {topSellers.map((seller, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-1.5"
          >
            <div className="flex items-center gap-2">
              <div>
                <UserAvatar src={seller.image} name={seller.name} size={40} />
              </div>
              <div className="flex flex-col">
                <span className="truncate text-[0.7rem] text-[#2B2B2B] font-normal">
                  {seller.name}
                </span>
                <div className="flex items-center gap-[0.2rem]">
                  {renderStars(seller.rating)}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (isFollowing(seller.id)) {
                  toggleFollow(seller.id, seller.name);
                } else {
                  router.push(`/buyer/sellers-list/${seller.storeLink.split('/').pop()}`);
                }
              }}
              disabled={loadingStates[seller.id]}
              className={`
                relative overflow-hidden rounded-[4px] px-3 py-2 text-[0.8rem] font-normal
                border-[2px] border-[#538E53] transition-all duration-300 ease-in-out
                flex items-center justify-center min-w-[5.5rem]
                ${loadingStates[seller.id]
                  ? "bg-gray-200 border-gray-300 cursor-not-allowed text-gray-400"
                  : isFollowing(seller.id)
                    ? "bg-[#538E53] text-white hover:bg-[#3b753b] hover:border-[#3b753b] hover:shadow-md hover:scale-[1.03]"
                    : "bg-transparent text-[#538E53] hover:bg-[#538E53] hover:text-white hover:shadow-md hover:scale-[1.03]"
                }
              `}
            >
              {loadingStates[seller.id] ? (
                <Loader />
              ) : isFollowing(seller.id) ? (
                "Following"
              ) : (
                "Visit Store"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
