"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const chatMessages = [
  {
    id: 1,
    direction: "left",
    image: "/images/chatImage.png",
  },
  {
    id: 2,
    direction: "right",
    image: "/images/chatImage2.png",
  },
  {
    id: 3,
    direction: "left",
    image: "/images/chatImage.png",
  },
  {
    id: 4,
    direction: "right",
    image: "/images/chatImage2.png",
  },
  {
    id: 5,
    direction: "left",
    image: "/images/chatImage.png",
  },
];

interface Props {
  onOpen: () => void;
}

export const LiveChatIpad = ({ onOpen }: Props) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => (prev < chatMessages.length ? prev + 1 : 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-[17px] pt-[22px] pr-[41px]">
      <h1 className="text-[1.3rem] font-montserrat font-[524] text-center bg-gradient-to-b from-[#16FF16] to-[#8e8e8e] bg-clip-text text-transparent">
        Live Chat
      </h1>

      <button
        type="button"
        aria-label="Open live chat"
        onClick={onOpen}
        className="text-left bg-[#f9f9f9] w-[330px] h-[170px] flex flex-col gap-[0.3rem] rounded-[10px] cursor-pointer pt-[20px]"
      >
        <AnimatePresence>
          {chatMessages.slice(0, visibleCount).map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={`flex ${
                msg.direction === "right"
                  ? "flex-row-reverse pr-[25px]"
                  : "pl-[25px]"
              } items-center gap-[20px]`}
            >
              <div className="w-[23px] h-[23px]">
                <Image
                  src={msg.image}
                  alt="Chat Profile"
                  width={40}
                  height={40}
                />
              </div>
              <div
                className={`flex w-[33%] h-[20px] items-center pt-[0px] pr-[10px] pb-[0px] pl-[13px] bg-[#f1f1f1] rounded-t-[6px] ${
                  msg.direction === "right"
                    ? "rounded-bl-[6px]"
                    : "rounded-br-[6px]"
                }`}
              >
                <div
                  className={`flex flex-col ${
                    msg.direction === "right" ? "items-end" : "items-start"
                  } gap-[2px] w-[100%]`}
                >
                  <span className="h-[2px] w-[100%] rounded-[4px] bg-[#d9d9d9]"></span>
                  <span className="h-[2px] w-[76%] rounded-[4px] bg-[#d9d9d9]"></span>
                  <span className="h-[2px] w-[50%] rounded-[4px] bg-[#d9d9d9]"></span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </button>
    </div>
  );
};
