"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowDownIcon } from "@/icons/Icons";
import {
  useBankAccount,
  useUpdateBankAccount,
} from "@/hooks/queries/useBankAccountQueries";
import type { BankAccountDetails } from "@/services/profileService";

// List of commercial banks in Nigeria (2025)
const nigerianBanks = [
  "Access Bank Plc",
  "Citibank Nigeria Limited",
  "Ecobank Nigeria Plc",
  "Fidelity Bank Plc",
  "First Bank of Nigeria Limited",
  "First City Monument Bank Plc",
  "Globus Bank Limited",
  "Guaranty Trust Bank Plc",
  "Heritage Banking Company Limited",
  "Keystone Bank Limited",
  "Kuda Bank",
  "Moniepoint Microfinance Bank",
  "Opay Digital Services Limited",
  "Polaris Bank Limited",
  "Premium Trust Bank",
  "Providus Bank Limited",
  "Signature Bank Limited",
  "Stanbic IBTC Bank Plc",
  "Standard Chartered Bank Nigeria Limited",
  "Sterling Bank Plc",
  "Suntrust Bank Nigeria Limited",
  "Titan Trust Bank Limited",
  "Union Bank of Nigeria Plc",
  "United Bank for Africa Plc",
  "Unity Bank Plc",
  "Wema Bank Plc",
  "Zenith Bank Plc",
] as const;

const emptyForm: BankAccountDetails = {
  bankName: "",
  accountNumber: "",
  accountName: "",
};

interface BankAccountFormProps {
  /** Extra classes for the card wrapper, so each profile keeps its layout. */
  className?: string;
  accountNumberPlaceholder?: string;
  accountNamePlaceholder?: string;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
  className = "",
  accountNumberPlaceholder = "Enter your account number",
  accountNamePlaceholder = "Enter your account name",
}) => {
  const { data: savedAccount, isLoading } = useBankAccount();
  const updateBankAccount = useUpdateBankAccount();

  const [formData, setFormData] = useState<BankAccountDetails>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Populate once the saved account arrives.
  useEffect(() => {
    if (savedAccount) setFormData(savedAccount);
  }, [savedAccount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // NUBAN account numbers are 10 digits — keep the field numeric.
    const next = name === "accountNumber" ? value.replace(/\D/g, "") : value;
    setError(null);
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  const handleBankSelect = (bank: string) => {
    setError(null);
    setFormData((prev) => ({ ...prev, bankName: bank }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.bankName) {
      setError("Select your bank.");
      return;
    }
    if (formData.accountNumber.length !== 10) {
      setError("Account number must be 10 digits.");
      return;
    }
    if (!formData.accountName.trim()) {
      setError("Enter the name on the account.");
      return;
    }

    try {
      await updateBankAccount.mutateAsync({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName.trim(),
      });
    } catch {
      // The mutation's onError already surfaces a toast.
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isSaving = updateBankAccount.isPending;

  return (
    <div
      className={`w-[100%] bg-[#fefefe] flex flex-col items-center shadow-md rounded-[4px] pt-[4rem] ${className}`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center gap-4 py-6 w-[90%] max-w-[500px]"
      >
        {/* Bank Name */}
        <div className="w-full" ref={dropdownRef}>
          <label
            htmlFor="bankName"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Bank
          </label>
          <div className="relative">
            <button
              type="button"
              id="bankName"
              disabled={isLoading || isSaving}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-2 pr-8 rounded-[4px] border-[1px] border-[#e2e2e2] text-[13px] font-montserrat text-[#2b2b2b] text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:border-[#538E53]"
            >
              {isLoading
                ? "Loading…"
                : formData.bankName || "Select a bank"}
            </button>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ArrowDownIcon className="h-4 w-4 text-[#2b2b2b]" />
            </div>
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#fefefe] border-[1px] border-[#e2e2e2] rounded-[4px] shadow-md max-h-[200px] overflow-y-auto">
                {nigerianBanks.map((bank) => (
                  <button
                    type="button"
                    key={bank}
                    onClick={() => handleBankSelect(bank)}
                    className="block w-full text-left p-2 text-[13px] font-montserrat text-[#2b2b2b] hover:bg-[#f0f0f0] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#538e53]"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Account Number */}
        <div className="w-full">
          <label
            htmlFor="accountNumber"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Account Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            disabled={isLoading || isSaving}
            placeholder={accountNumberPlaceholder}
            className="w-full p-2 rounded-[4px] border-[1px] border-[#e2e2e2] focus:outline-none focus:border-[#538E53] text-[13px] placeholder:text-[13px] font-montserrat text-[#2b2b2b] disabled:opacity-60"
            required
          />
        </div>

        {/* Account Name */}
        <div className="w-full">
          <label
            htmlFor="accountName"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Account Name
          </label>
          <input
            type="text"
            id="accountName"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            disabled={isLoading || isSaving}
            placeholder={accountNamePlaceholder}
            className="w-full p-2 rounded-[4px] border-[1px] border-[#e2e2e2] focus:outline-none focus:border-[#538E53] text-[13px] placeholder:text-[13px] font-montserrat text-[#2b2b2b] disabled:opacity-60"
            required
          />
        </div>

        {error && (
          <p className="w-full text-[12px] font-montserrat text-[#c0392b]">
            {error}
          </p>
        )}

        {/* Done Button */}
        <button
          type="submit"
          disabled={isLoading || isSaving}
          className="bg-[#538E53] text-[#FEFEFE] p-2 rounded-[4px] w-full font-montserrat font-medium text-[13px] cursor-pointer hover:bg-[#214821] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isSaving ? "Saving…" : "Done"}
        </button>
      </form>
    </div>
  );
};

export default BankAccountForm;
