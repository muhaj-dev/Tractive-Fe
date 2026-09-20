"use client";
import Image from "next/image";
import React from "react";

interface BidItem {
  id: string;
  title: string;
  quantity: string;
  seller: string;
  /** Price of ONE unit, at the agreed (counter-aware) figure. */
  price: number;
  /** price × quantity — what this line costs. */
  lineTotal: number;
  imageSrc: string;
}

interface MyBidsProps {
  bidItems: BidItem[];
  selection: { isCheckoutAll: boolean; selectedBids: string[] };
  setSelection: (isCheckoutAll: boolean, selectedBids: string[]) => void;
  isRefetching?: boolean;
}

export const MyBids: React.FC<MyBidsProps> = ({
  bidItems,
  selection,
  setSelection,
  isRefetching,
}) => {
  const handleCheckoutAllChange = () => {
    if (!selection.isCheckoutAll) {
      // Check all items when selecting "Checkout All"
      setSelection(
        true,
        bidItems.map((item) => item.id)
      );
    } else {
      // Uncheck all
      setSelection(false, []);
    }
  };

  const handleItemChange = (id: string) => {
    let newSelectedBids: string[];
    if (selection.selectedBids.includes(id)) {
      // Uncheck item
      newSelectedBids = selection.selectedBids.filter((bidId) => bidId !== id);
    } else {
      // Check item
      newSelectedBids = [...selection.selectedBids, id];
    }
    // If an item is toggled, disable "Checkout All" unless all items are selected
    const isCheckoutAll = newSelectedBids.length === bidItems.length;
    setSelection(isCheckoutAll, newSelectedBids);
  };

  return (
    <div className="w-full bg-[#fefefe] shadow-md my-4 sm:my-6 md:my-8 rounded-[5px] max-w-7xl mx-auto">
      <style jsx>{`
        .custom-checkbox {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid #538e53;
          border-radius: 3px;
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
        }
        .custom-checkbox:checked {
          background-color: #538e53;
          border-color: #538e53;
        }
        .custom-checkbox:checked::before {
          content: "";
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 5px;
          height: 9px;
          border: solid #fff;
          border-width: 0 2px 2px 0;
        }
      `}</style>

      <div className="flex items-center gap-2 p-2 sm:p-3 md:p-3.5">
        <p className="font-montserrat font-medium text-xs sm:text-sm md:text-[14px] text-[#2b2b2b]">
          Ready to checkout
        </p>
        <span className="font-montserrat font-normal text-[10px] sm:text-[11px] md:text-[12px] text-[#fefefe] bg-[#538e53] w-4 h-4 sm:w-[14px] sm:h-[15px] md:w-[15px] md:h-[16px] p-1 flex justify-center items-center rounded-[3px]">
          {bidItems.length}
        </span>
      </div>
      <div className="w-full border-t border-dashed border-[#808080]"></div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-3.5">
        <input
          type="checkbox"
          id="checkout-all"
          className="custom-checkbox cursor-pointer"
          checked={selection.isCheckoutAll}
          onChange={handleCheckoutAllChange}
        />
        <label
          htmlFor="checkout-all"
          className="font-montserrat font-normal text-xs sm:text-sm md:text-[14px] text-[#2b2b2b]"
        >
          Checkout All
        </label>
      </div>
      <div className="w-full h-[1px] bg-[#808080]"></div>

      {isRefetching ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-[#538e53] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 font-montserrat text-[13px] text-[#808080]">
            Updating your bids...
          </span>
        </div>
      ) : bidItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12">
          <p className="font-montserrat font-normal text-sm sm:text-base text-[#808080]">
            No bids ready for checkout yet.
          </p>
        </div>
      ) : (
        bidItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 w-full p-2 sm:p-3 md:p-3.5">
            <input
              type="checkbox"
              id={item.id}
              className="ml-0 sm:ml-3.5 custom-checkbox cursor-pointer"
              checked={
                selection.isCheckoutAll ||
                selection.selectedBids.includes(item.id)
              }
              onChange={() => handleItemChange(item.id)}
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 py-2 sm:py-3 md:py-3.5">
                <Image
                  src={item.imageSrc}
                  alt="Bid won"
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-[119px] md:h-[129px] object-cover"
                />
                <div className="flex flex-col gap-4 sm:gap-6 md:gap-9">
                  <div className="flex flex-col gap-1">
                    <p className="font-montserrat font-normal text-[11px] sm:text-[12px] md:text-[13px] text-[#2b2b2b]">
                      {item.title}
                    </p>
                    <small className="font-montserrat font-normal text-[9px] sm:text-[10px] md:text-[11px] text-[#808080]">
                      Qty: {item.quantity}
                    </small>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center">
                      <p className="font-montserrat font-normal text-[10px] sm:text-[11px] md:text-[12px] text-[#808080]">
                        Seller:{" "}
                        <span className="text-[#2b2b2b]">{item.seller}</span>
                      </p>
                      {/* Seller rating intentionally omitted: the won-bids
                          payload carries no rating for the agent, so a star row
                          here would be fabricated. Restore once the API returns
                          one. */}
                    </div>
                  </div>
                  {/* Unit price, the quantity it is charged on, and the line
                      total. Showing the unit price alone read as the price of
                      the whole line and understated it by the quantity. */}
                  <div className="flex flex-col gap-0.5">
                    <p className="font-montserrat font-normal text-[10px] sm:text-[11px] md:text-[12px] text-[#808080]">
                      ₦{item.price.toLocaleString()} × {item.quantity}
                    </p>
                    <p className="font-montserrat font-semibold text-[13px] sm:text-[14px] md:text-[16px] text-[#2b2b2b]">
                      ₦{item.lineTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {index < bidItems.length - 1 && (
            <div className="w-full h-[1px] bg-[#808080]"></div>
          )}
        </React.Fragment>
      )))}
    </div>
  );
};
