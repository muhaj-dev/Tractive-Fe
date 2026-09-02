"use client";
import React, { useState } from "react";
import { MdCheck } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import { CopyIcon } from "@/icons/Icon1";
import { useBankAccounts } from "@/hooks/queries/usePaymentQueries";
import type { BankAccount } from "@/services/paymentService";

// Plain <img> (not next/image) so admin-supplied logo URLs from any host — and
// SVGs — render without a remotePatterns whitelist. Falls back to the bank's
// initials if the URL is missing or fails to load.
const BankLogo = ({ account }: { account: BankAccount }) => {
  const [errored, setErrored] = useState(false);
  const showImage = !!account.logoUrl && !errored;
  return showImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={account.logoUrl as string}
      alt={account.bank}
      onError={() => setErrored(true)}
      className="w-9 h-9 rounded-full object-contain shrink-0 bg-white"
    />
  ) : (
    <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-[#CCE5CC80] text-[#2b2b2b] font-montserrat font-semibold text-[12px]">
      {(account.bank || "?").slice(0, 2).toUpperCase()}
    </div>
  );
};

interface BankAccountsProps {
  /**
   * When set, each account becomes selectable and the chosen bank is reported
   * back. The backend records it on the payment confirmation
   * (`POST /api/payments/{ref}/confirm` → `bankUsed`) so an admin can match the
   * transfer against a statement.
   */
  selectedBank?: string | null;
  onSelectBank?: (bank: string) => void;
}

export const BankAccounts: React.FC<BankAccountsProps> = ({
  selectedBank,
  onSelectBank,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { data: accounts = [], isLoading, isError } = useBankAccounts();
  const selectable = typeof onSelectBank === "function";

  const handleCopy = async (number: string, index: number) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full px-4 pb-4 relative">
      <div className="">
        <div className="w-full flex flex-col gap-[0.1rem] justify-center">

          <div
            className="flex flex-col gap-2 items-center w-full"
            role={selectable ? "radiogroup" : undefined}
            aria-label={selectable ? "Account you transferred to" : undefined}
          >
            {isLoading && (
              <p className="text-[#808080] font-montserrat text-[12px] py-2">
                Loading bank accounts…
              </p>
            )}
            {!isLoading && isError && (
              <p className="text-[#c0392b] font-montserrat text-[12px] py-2">
                Couldn&apos;t load bank accounts. Please try again.
              </p>
            )}
            {!isLoading && !isError && accounts.length === 0 && (
              <p className="text-[#808080] font-montserrat text-[12px] py-2">
                No bank accounts available.
              </p>
            )}
            {accounts.map((account, index) => (
              <div
                key={account.id}
                onClick={
                  selectable ? () => onSelectBank!(account.bank) : undefined
                }
                // role="radio" alone is a promise the element cannot keep: it was
                // not focusable and did not answer the keyboard, so the bank a
                // buyer transferred to could only be picked with a mouse — and
                // the confirm button silently does nothing until one is picked.
                onKeyDown={
                  selectable
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectBank!(account.bank);
                        }
                      }
                    : undefined
                }
                tabIndex={selectable ? 0 : undefined}
                role={selectable ? "radio" : undefined}
                aria-checked={selectable ? selectedBank === account.bank : undefined}
                className={`relative flex items-center w-full p-2.5 border rounded-md gap-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#538e53] ${
                  selectable ? "cursor-pointer" : ""
                } ${
                  selectable && selectedBank === account.bank
                    ? "border-[#538e53] bg-[#f2f8f2]"
                    : "border-[#e2e2e2]"
                }`}
              >
                <BankLogo account={account} />

                <div className="flex justify-between items-center w-full min-w-0 gap-2">
                  <div className="flex flex-col min-w-0">
                    <p className="text-[#2b2b2b] font-montserrat text-[12px] font-medium truncate">
                      {account.bank}
                    </p>
                    <p className="text-[#808080] font-montserrat text-[11px] font-normal truncate">
                      {account.accountName}
                    </p>
                  </div>

                  <div className="relative flex items-center gap-2 shrink-0">
                    <p className="text-[#2b2b2b] font-montserrat text-[12px] font-medium">
                      {account.accountNumber}
                    </p>

                    <motion.div
                      onMouseEnter={() => setHoverIndex(index)}
                      onMouseLeave={() => setHoverIndex(null)}
                      onClick={() => handleCopy(account.accountNumber, index)}
                      whileTap={{ scale: 1.2 }}
                      className="cursor-pointer text-[#2b2b2b] relative"
                    >
                      {/* Icon Switch */}
                      <AnimatePresence mode="wait" initial={false}>
                        {copiedIndex === index ? (
                          <motion.span
                            key="check"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <MdCheck size={16} className="text-[#538e53]" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CopyIcon />
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Copied Tooltip (above) */}
                      <AnimatePresence>
                        {copiedIndex === index && (
                          <motion.div
                            key="copied"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -10 }}
                            exit={{ opacity: 0, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-[120%] left-1/2 -translate-x-1/2 bg-[#538e53] text-white text-xs px-2 py-1 rounded shadow-md z-10 whitespace-nowrap"
                          >
                            Copied!
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hover Tooltip */}
                      <AnimatePresence>
                        {hoverIndex === index && copiedIndex !== index && (
                          <motion.div
                            key="hover"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: -4 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-[120%] left-1/2 -translate-x-1/2 bg-[#2b2b2b] text-[#f1f1f1] text-xs px-2 py-1 rounded z-10 whitespace-nowrap"
                          >
                            Copy
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
