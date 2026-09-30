"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { GoArrowRight } from "react-icons/go";

// Type definition
type HowToItem = {
  title: string;
  image: string;
  alt: string;
  link: string;
};

// Data
const howToItems: HowToItem[] = [
  {
    title: "How to sell on Agric Tech",
    image: "/images/AgricTech.png",
    alt: "Sell Agric tech",
    link: "/about-us/help-center/how-to-sell-on-agric-tech",
  },
  {
    title: "Payment and order",
    image: "/images/PaymentOrder.png",
    alt: "Payment and order",
    link: "/about-us/help-center/payment-and-order",
  },
  {
    title: "How to register as a transporter",
    image: "/images/TransporterReg.png",
    alt: "Transporter Registration",
    link: "/about-us/help-center/how-to-register-as-a-transporter",
  },
  {
    title: "How to buy on Agric tech",
    image: "/images/AgricTechCart.png",
    alt: "Buy on Agric tech",
    link: "/about-us/help-center/how-to-buy-on-agric-tech",
  },
];

export const HowTo = () => {
  return (
    <div className="w-full bg-[#fefefe] py-10">
      <div className="w-[90%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {howToItems.map((item, index) => (
          <div
            key={index}
            className="flex flex-col w-full rounded-md transition-all duration-300"
          >
            <div className="w-full">
              <Image
                src={item.image}
                alt={item.title}
                width={352}
                height={182}
                className="w-full h-[182px] object-cover"
              />
            </div>
            <Link
              href={item.link}
              className="flex items-center justify-between text-[#538e53] py-2"
            >
              <p className="text-[13.5px] font-medium">{item.title}</p>
              <GoArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
