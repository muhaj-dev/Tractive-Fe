import Image from "next/image";
import Link from "next/link";
import React from "react";

interface OfficialStoreProps {
  /** Selected subcategory. Not a seller id; the banner links to the sellers list. */
  id: string;
}

export const OfficialStore: React.FC<OfficialStoreProps> = ({ id }) => {
  return (
    <div className="shadow-md rounded-[10px] bg-[#F1F8F1B2] w-[100%]">
      <Link
        href="/buyer/sellers-list"
        className="mt-6 rounded-[5px] shadow-md block"
      >
        <div className="flex items-center justify-center w-full gap-2 rounded-tr-[7px] rounded-tl-[7px] bg-[#F1F8F1B2] py-4 px-4">
          <p className="text-[#000] text-[0.65rem] sm:text-[0.79rem] text-center font-montserrat font-normal">
            Official Store
          </p>
          <div>
            <Image
              src="/images/verifiedIcon.png"
              alt="verified"
              width={18}
              height={18}
              className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] md:w-[19px] md:h-[19px]"
            />
          </div>
        </div>
        <div className="rounded-br-[5px] rounded-bl-[5px]">
          <Image
            src="/images/officialStore.png"
            alt="Official Store"
            width={300}
            height={301}
            className="rounded-br-[7px] rounded-bl-[7px] w-full h-auto"
          />
        </div>
      </Link>
    </div>
  );
};
