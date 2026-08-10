// _components/AccountDetails.tsx
"use client";
import Image from "next/image";
import React from "react";
import { BankAccounts } from "./BankAccounts";
import { Button } from "@/components/Button";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { toast } from "sonner";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

const BouncingDots = () => (
  <span className="inline-flex items-center gap-[3px] ml-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-[5px] h-[5px] bg-current rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.6s" }}
      />
    ))}
  </span>
);

export interface TransferDetails {
  bankUsed: string;
  narration?: string;
  screenshotUrl?: string;
}

interface AccountDetailsProps {
  onBack: () => void;
  onConfirm: (details: TransferDetails) => void;
  isConfirming: boolean;
}

const MAX_SCREENSHOT_MB = 5;

export const AccountDetails: React.FC<AccountDetailsProps> = ({
  onBack,
  onConfirm,
  isConfirming,
}) => {
  // Captured so `POST /api/payments/{ref}/confirm` can be sent with real
  // evidence — without it an admin approves a transfer they cannot match
  // against a bank statement.
  const [bankUsed, setBankUsed] = React.useState<string | null>(null);
  const [narration, setNarration] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { uploadToCloudinary, isUploading } = useCloudinaryUpload();
  const busy = isConfirming || isUploading;

  // Revoke the object URL when the preview changes or the step unmounts.
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image of your transfer receipt.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_MB * 1024 * 1024) {
      toast.error(`That image is over ${MAX_SCREENSHOT_MB}MB. Please pick a smaller one.`);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    if (preview) URL.revokeObjectURL(preview);
    setScreenshot(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = async () => {
    setTouched(true);
    if (!bankUsed) return;

    let screenshotUrl: string | undefined;
    if (screenshot) {
      try {
        screenshotUrl = await uploadToCloudinary(screenshot);
      } catch {
        // The proof is optional evidence — a failed upload must not stop the
        // buyer paying. Warn, then continue with the bank and narration.
        toast.error("Couldn't upload your receipt. Continuing without it.");
      }
    }

    onConfirm({
      bankUsed,
      narration: narration.trim() || undefined,
      screenshotUrl,
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-3">
      {/* Back button */}
      <div className="px-4">
        <button
          onClick={onBack}
          disabled={busy}
          className="flex items-center gap-1 text-[#538e53] font-montserrat text-[12px] font-medium cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IoArrowBack size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Image */}
      <div className="flex items-center justify-center">
        <Image
          src="/images/accountVector.png"
          alt="Vector"
          width={374}
          height={249}
          className="w-[240px] h-[180px] object-contain"
        />
      </div>

      {/* Instruction text */}
      <p className="font-montserrat font-normal text-center text-[11px] px-5 text-[#2b2b2b]">
        To complete your order, kindly transfer the total amount due along with
        the item ID to one of the account numbers listed below. Thank you!
      </p>

      {/* Bank accounts — tap the one you transferred to */}
      <BankAccounts selectedBank={bankUsed} onSelectBank={setBankUsed} />

      <div className="px-4 -mt-2">
        {touched && !bankUsed && (
          <p className="text-[#c0392b] font-montserrat text-[11px] mb-2">
            Select the account you transferred to.
          </p>
        )}
        <label className="block font-montserrat text-[11px] text-[#808080] mb-1">
          Transfer reference or narration (optional)
        </label>
        <input
          type="text"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          disabled={busy}
          placeholder="e.g. the narration shown on your transfer receipt"
          className="w-full py-2 px-3 rounded-md border border-[#ccc] font-montserrat text-[12px] text-[#2b2b2b] placeholder-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53] disabled:opacity-50"
        />

        {/* Transfer receipt — optional proof the admin can check against a statement */}
        <label className="block font-montserrat text-[11px] text-[#808080] mt-3 mb-1">
          Screenshot of your receipt (optional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={busy}
          className="hidden"
        />
        {preview ? (
          <div className="flex items-center gap-3 p-2 border border-[#e2e2e2] rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Transfer receipt preview"
              className="w-12 h-12 rounded-[4px] object-cover shrink-0"
            />
            <span className="font-montserrat text-[11px] text-[#2b2b2b] truncate flex-1">
              {screenshot?.name}
            </span>
            <button
              type="button"
              onClick={clearScreenshot}
              disabled={busy}
              aria-label="Remove receipt"
              className="text-[#808080] hover:text-[#c0392b] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoClose size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="w-full py-2 px-3 rounded-md border border-dashed border-[#ccc] font-montserrat text-[12px] text-[#808080] hover:border-[#538e53] hover:text-[#538e53] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Attach receipt image
          </button>
        )}
      </div>

      {/* Confirm button */}
      <div className="px-4 pb-4 pt-3">
        <Button
          text={
            busy ? (
              <span className="flex items-center">
                {isUploading ? "Uploading receipt" : "Processing"}
                <BouncingDots />
              </span>
            ) : (
              "I've made the transfer"
            )
          }
          onClick={handleConfirm}
          className="justify-center w-full cursor-pointer"
          disabled={busy}
        />
      </div>
    </div>
  );
};
