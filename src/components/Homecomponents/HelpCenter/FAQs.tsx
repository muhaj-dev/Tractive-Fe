"use client";
import React, { useState } from "react";
import { FaAngleRight } from "react-icons/fa6";
import { AnimatePresence, motion } from "framer-motion";

const faqData = [
  {
    category: "Account and profile",
    questions: [
      "How do I create an account on Agrictech?",
      "How can I update my profile information?",
      "What should I do if I forgot my password?",
    ],
  },
  {
    category: "Orders and shipments",
    questions: [
      "How do I place an order for a product?",
      "What payment methods are accepted on Agrictech?",
      "How can I track the status of my order?",
    ],
  },
  {
    category: "Shipping and delivery",
    questions: [
      "How long does it take for my order to be delivered?",
      "How much does shipping cost?",
      "Can I track the shipment of my order?",
    ],
  },
];

const answer =
  "Go to the top right corner on your home screen and click On the image, once you click on it, you will be required to register as a buyer, seller or transporter.";

export const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="w-full bg-[#fefefe] py-2">
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="w-full flex flex-col justify-center py-[1.5rem] gap-[14px] mx-auto px-4">
          <h1 className="text-[#2b2b2b] font-montserrat text-[20px] font-normal text-left">
            Frequently asked questions
          </h1>
          <div className="flex flex-col lg:flex-row items-start justify-between py-2 w-full gap-[5rem]">
            {faqData.map((section, sectionIndex) => (
              <div
                key={section.category}
                className="flex flex-col items-start justify-between py-2 w-full"
              >
                <h3 className="text-[#808080] font-montserrat font-normal text-[13px]">
                  {section.category}
                </h3>
                <div className="flex flex-col gap-[20px] w-full">
                  {section.questions.map((question, questionIndex) => {
                    const id = `${sectionIndex}-${questionIndex}`;
                    const isOpen = openIndex === id;

                    return (
                      <div
                        key={id}
                        className="flex flex-col w-full border-b border-gray-200 pb-3"
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between text-left py-2 cursor-pointer"
                          onClick={() => toggleQuestion(id)}
                        >
                          <h4 className="text-[#2b2b2b] font-montserrat font-medium text-[12px]">
                            {question}
                          </h4>
                          <FaAngleRight
                            className={`transition-transform duration-300 ${
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
                              <p className="text-[#2b2b2b] font-montserrat font-normal text-[11px] mt-2">
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
