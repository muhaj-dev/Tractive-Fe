import Image from "next/image";
import Link from "next/link";
import React from "react";
import { CiCreditCard1 } from "react-icons/ci";
import { HiOutlineCreditCard } from "react-icons/hi";
import { LuWarehouse } from "react-icons/lu";
import { TbBookmarkEdit } from "react-icons/tb";

export const Footer = () => {
  return (
    <footer className="bg-[#f1f1f1] w-full">
      <div className="flex flex-col bg-[#538E53] justify-center py-10 w-[100%] mx-auto">
        <div className="flex flex-col mx-auto items-center justify-center gap-[10px] w-[100%] max-w-[600px]">
          <p className="text-[#f9f9f9] font-montserrat text-[14px] font-normal text-center">
            Subscribe to our newsletter
          </p>
          <div className="flex items-center justify-center w-[90%] max-w-[500px]">
            <input
              type="email"
              placeholder="Chikeziekelvin24@gmail.com"
              className=" bg-[#fefefe] w-[100%] px-4 py-[0.7rem] rounded-tl-[5px] rounded-bl-[5px] focus:outline-none focus:border-[#538E53] placeholder:text-[#808080] placeholder:text-[14px] placeholder:font-montserrat placeholder:font-normal"
              required
            />
            <button
              type="submit"
              className="bg-[#CCE5CC] flex items-center justify-center font-montserrat text-[#2b2b2b] text-[14px] font-normal p-[0.8rem] rounded-tr-[5px] rounded-br-[5px] cursor-pointer"
            >
              Subscribe
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[80px] mt-10 w-[90%] justify-center mx-auto lg:flex-row ">
          <div className="flex md:flex-row md:justify-between gap-[80px] mt-10 lg:flex-row">
            <div>
              <p className="text-[#f9f9f9] font-montserrat text-[17px] font-medium">
                Need our support?
              </p>
              <ul className="flex flex-col gap-[10px] mt-4">
                <li className="flex items-center gap-2">
                  <Link
                    href="/about-us/help-center"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    Help center
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    href="/faqs"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    FAQs
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    href="/about-us/help-center"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    Hot-line: +2349034145971 +2349034145971
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <Link
                    href="/report"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    Report Someone
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    href="/about-us/help-center/how-to-buy-on-agric-tech"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    How to purchase an item
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    href="/about-us/help-center/how-to-sell-on-agric-tech"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    How to sell on Agrictech
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[#f9f9f9] font-montserrat text-[17px] font-medium">
                About Agrictech
              </p>
              <ul className="flex flex-col gap-[10px] mt-4">
                <li className="flex items-center gap-2">
                  <Link
                    href="/privacy-policy"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    Privacy policy
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    href="/our-location"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    Our location
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    href="/cookies"
                    className="font-montserrat font-normal text-[#f9f9f9] text-[14px]"
                  >
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-col md:flex-row md:justify-between gap-[80px] lg:flex-row">
            <div className="flex flex-col gap-2 mt-10">
              <p className="text-[#f9f9f9] font-montserrat text-[17px] text-left font-medium">
                Payment method
              </p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[2.5rem] mt-4">
                <li className="flex flex-col items-center gap-2 text-[#f9f9f9]">
                  <LuWarehouse className="text-[1.5rem]" />
                  <span className="font-montserrat font-normal text-[#f9f9f9] text-[14px]">
                    Deposit
                  </span>
                </li>
                <li className="flex flex-col items-center gap-2 text-[#f9f9f9]">
                  <CiCreditCard1 className="text-[1.5rem]" />
                  <span className="font-montserrat font-normal text-[#f9f9f9] text-[14px]">
                    Card
                  </span>
                </li>
                <li className="flex flex-col items-center gap-2 text-[#f9f9f9]">
                  <HiOutlineCreditCard className="text-[1.5rem]" />
                  <span className="font-montserrat font-normal text-[#f9f9f9] text-[14px]">
                    Transfer
                  </span>
                </li>
                <li className="flex flex-col items-center gap-2 text-[#f9f9f9]">
                  <TbBookmarkEdit className="text-[1.5rem]" />
                  <span className="font-montserrat font-normal text-[#f9f9f9] text-[14px]">
                    Cheque
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 mt-10">
              <p className="text-[#f9f9f9] font-montserrat text-[17px] text-left font-medium">
                Follow us on:
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="bg-[#1877f2] w-[50px] h-[50px] flex items-center justify-center">
                  <Image
                    src="/images/Facebook.png"
                    alt="facebook"
                    width={50}
                    height={50}
                    className=""
                  />
                </div>
                <div>
                  <Image
                    src="/images/Twitter.png"
                    alt="Twitter"
                    width={50}
                    height={50}
                    className=""
                  />
                </div>
                <div>
                  <Image
                    src="/images/Instagram.png"
                    alt="Instagram"
                    width={50}
                    height={50}
                    className=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
