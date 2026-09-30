"use client";
import React, { useState } from "react";
import { FaAngleRight } from "react-icons/fa6";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../Button";
import Image from "next/image";
import { RiSearch2Line } from "react-icons/ri";

interface Props {
  onClose: () => void;
  onChatWithRep: () => void;
}

const faqData = [
  {
    category: "Account and profile",
    questions: [
      "How do I create an account on Agrictech?",
      "How can I update my profile information?",
      "What should I do if I forgot my password?",
    ],
  },
];

const answer =
  "Go to the top right corner on your home screen and click On the image, once you click on it, you will be required to register as a buyer, seller or transporter.";

export const AgTechCustomerService = ({ onClose, onChatWithRep }: Props) => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };
  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-[17px] relative z-[10]">
        <div className="bg-[#538e53] w-[100%] flex items-center justify-end gap-[59.23px] pr-6 py-3.5 rounded-t-[16.5px]">
          <h1 className="text-[#f9f9f9] text-[13px] font-montserrat font-normal text-center">
            AgricTech Customer Service
          </h1>
          <Button
            text="End Chat"
            onClick={onClose}
            className="bg-transparent hover:bg-transparent border-[0.823px] !px-3 !py-1.5 !rounded-[3.292px] border-[#f9f9f9] "
            textClass="text-[13px] font-montserrat font-normal text-[#f9f9f9]"
          />
        </div>
        <div className="flex flex-col items-center gap-[1rem] justify-center">
          <div className="w-[41px] h-[41px] rounded-full flex items-center justify-center">
            <Image
              src="/images/customerServiceProfile.png"
              alt="customer Profile"
              width={41.152}
              height={41.152}
            />
          </div>
          <p className="text-[#2b2b2b] font-montserrat text-[11px] font-medium">
            Good afternoon mr kelvin, how can i assist you?
          </p>
          <Button
            text="Chat with a customer representative"
            onClick={onChatWithRep}
            className=" flex p-[8.23px] justify-center items-center gap-[8.23px] !rounded-tr-[16.461px]  !rounded-bl-[16.461px] !rounded-tl-[0px]  !rounded-br-[0px]  hover:bg-[#538e53]"
            textClass="text-[13px] font-montserrat font-normal text-[#f9f9f9"
          />
        </div>

        <div className="flex flex-col justify-center items-center gap-4 bg-[#538e53] px-[53px] pt-[13px] pb-[20.6px] rounded-[12.346px] w-[90%] mx-auto">
          <h1 className="text-[#fefefe] text-center font-montserrat font-normal text-[16px]">
            Frequently asked questions
          </h1>
          <div className="flex items-center justify-center w-[100%] max-w-[500px] z-10 mx-auto">
            <input
              type="text"
              placeholder="Search"
              className=" relative bg-[#fefefe] w-[100%] pl-10 pr-4 py-[0.7rem] text-[13px] text-[#808080] rounded-[4.115px] focus:outline-none focus:border-[#538E53] placeholder:text-[#808080] placeholder:text-[14px] placeholder:font-montserrat placeholder:font-normal"
              required
            />
            <RiSearch2Line className="absolute left-24 text-[#808080] cursor-pointer" />
          </div>
          <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-[5rem]">
            {faqData.map((section, sectionIndex) => (
              <div
                key={section.category}
                className="flex flex-col items-start justify-between w-full"
              >
                <h3 className="text-[#fefefe] font-montserrat pb-2.5 font-normal text-[13px]">
                  {section.category}
                </h3>
                <div className="flex flex-col w-full">
                  {section.questions.map((question, questionIndex) => {
                    const id = `${sectionIndex}-${questionIndex}`;
                    const isOpen = openIndex === id;

                    return (
                      <div key={id} className="flex flex-col w-full">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between text-left py-1.5 cursor-pointer"
                          onClick={() => toggleQuestion(id)}
                        >
                          <h4 className="text-[#fefefe] font-montserrat font-medium text-[12px]">
                            {question}
                          </h4>
                          <FaAngleRight
                            className={`transition-transform duration-300 text-[#fefefe] ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="content"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <p className="text-[#fefefe] font-montserrat font-normal text-[11px] mt-2">
                                {answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
