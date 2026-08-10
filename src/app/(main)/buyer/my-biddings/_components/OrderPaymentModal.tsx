"use client";
import React, { useState } from "react";
import { XIcon } from "@/icons/Icon1";
import { toast } from "sonner";
import { AccountDetails, TransferDetails } from "./AccountDetails";
import { DeliveryDetailsAndPaymentMethod } from "./DeliveryDetailsAndPaymentMethod";
import { PaymentSuccessModal } from "./PaymentSuccessModal";
import { useCreateTransaction } from "@/hooks/queries/useTransactionQueries";
import { useConfirmPayment } from "@/hooks/queries/usePaymentQueries";
import { paymentMethodMap } from "@/utils/paymentMethods";

interface ShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-[#2b2b2bd4] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#fefefe] rounded-[8px] w-[90%] max-w-[400px] max-h-[90vh] overflow-y-auto relative z-60"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-[#2b2b2b] font-montserrat text-[16px] font-medium cursor-pointer z-70"
          title="Close"
          aria-label="Close"
        >
          <XIcon />
        </button>
        {children}
      </div>
    </div>
  );
};

export interface OrderPaymentModalProps {
  /** Order to pay for. Must already exist — this modal never creates one. */
  orderId: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  /** Fired after the transaction is recorded, so lists can refetch. */
  onPaid?: () => void;
}

/**
 * The manual bank-transfer payment flow for an existing order:
 * pick a method → transfer to one of our accounts → tell us you've paid.
 *
 * Extracted from BidsCheckout so it can also be reached from My Orders. An
 * order created but not paid used to be unreachable once this modal closed —
 * there was no other route back to it.
 */
export const OrderPaymentModal: React.FC<OrderPaymentModalProps> = ({
  orderId,
  totalAmount,
  isOpen,
  onClose,
  onPaid,
}) => {
  const [step, setStep] = useState<"payment" | "bank-details">("payment");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const createTransaction = useCreateTransaction();
  const confirmPayment = useConfirmPayment();
  const isBusy = createTransaction.isPending || confirmPayment.isPending;

  const close = () => {
    if (isBusy) return;
    setStep("payment");
    setSelectedPaymentMethod("");
    onClose();
  };

  const handleContinue = (method: string) => {
    setSelectedPaymentMethod(method);
    setStep("bank-details");
  };

  const handleConfirm = (details: TransferDetails) => {
    if (!orderId) {
      toast.error("Order reference is missing. Please reopen this order.");
      return;
    }
    if (!selectedPaymentMethod) {
      toast.error("Payment method is missing. Please go back and select one.");
      return;
    }

    createTransaction.mutate(
      {
        order: orderId,
        amount: totalAmount,
        paymentMethod:
          paymentMethodMap[selectedPaymentMethod] || selectedPaymentMethod,
      },
      {
        onSuccess: (data) => {
          // The transaction is recorded; surface success even if the follow-up
          // confirmation call fails, since the payment itself is registered.
          const body = data as unknown as Record<string, unknown>;
          const inner = (body?.data ?? body?.transaction ?? body) as Record<
            string,
            unknown
          >;
          const paymentRef = inner?.paymentReference as string | undefined;

          const finish = () => {
            setStep("payment");
            setSelectedPaymentMethod("");
            onClose();
            onPaid?.();
            setIsSuccessOpen(true);
          };

          if (!paymentRef) {
            console.warn("No paymentReference on transaction response", data);
            finish();
            return;
          }

          // Attach the buyer's transfer evidence to the payment so an admin can
          // match it against a bank statement before approving.
          confirmPayment.mutate(
            {
              paymentRef,
              payload: {
                bankUsed: details.bankUsed,
                narration: details.narration,
                screenshotUrl: details.screenshotUrl,
              },
            },
            { onSuccess: finish, onError: finish },
          );
        },
      },
    );
  };

  return (
    <>
      <Shell isOpen={isOpen && step === "payment"} onClose={close}>
        <DeliveryDetailsAndPaymentMethod
          totalAmount={totalAmount}
          onContinue={handleContinue}
        />
      </Shell>

      <Shell isOpen={isOpen && step === "bank-details"} onClose={close}>
        <AccountDetails
          onBack={() => setStep("payment")}
          onConfirm={handleConfirm}
          isConfirming={isBusy}
        />
      </Shell>

      <PaymentSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />
    </>
  );
};
