"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUserProfile, useAddAccount } from "@/hooks/queries/useUserQueries";
import {
  addAccountModalSchema,
  AddAccountModalSchemaType,
} from "@/schemas/addAccountModalSchema";
import { nigerianStates, lgaData } from "@/utils/state&LGA";
import { useModalA11y } from "@/hooks/useModalA11y";

type RoleType = "agent" | "transporter" | "buyer";

const ROLES: { id: RoleType; label: string }[] = [
  { id: "agent", label: "Agent" },
  { id: "transporter", label: "Transporter" },
  { id: "buyer", label: "Buyer" },
];

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Preselects a role when the modal is opened from a specific "Add <role>" action. */
  defaultRole?: RoleType;
}

const fieldClass =
  "mt-1 w-full border-[0.5px] border-[#808080] rounded px-3 py-2 text-[13px] font-montserrat text-[#2b2b2b] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[1px] focus:ring-[#538e53] focus:border-[#538e53] disabled:bg-[#f1f1f1] disabled:cursor-not-allowed";

const labelClass =
  "block text-[13px] font-montserrat font-normal text-[#2b2b2b]";

const errorClass = "text-red-500 text-[11px] font-montserrat mt-1";

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  defaultRole,
}) => {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: session, update } = useSession();
  const { data: userProfile } = useUserProfile();
  const { mutateAsync: addAccount, isPending } = useAddAccount();

  const ownedRoles: string[] = useMemo(
    () => session?.user?.role || [],
    [session?.user?.role],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddAccountModalSchemaType>({
    resolver: zodResolver(addAccountModalSchema),
    defaultValues: {
      role: defaultRole,
      state: "",
      lga: "",
      address: "",
      phone: "",
    },
  });

  const selectedRole = watch("role");
  const selectedState = watch("state");

  const lgaOptions = useMemo(
    () => (selectedState ? lgaData[selectedState] || [] : []),
    [selectedState],
  );

  // Seed the form from the user's existing profile each time the modal opens.
  // The first role they created already captured most of this, so we only make
  // them confirm it rather than retype it.
  //
  // Keyed on the open transition, not on `userProfile` identity: a background
  // refetch (react-query refetches on window focus) must not clobber whatever
  // the user has already typed.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }
    if (wasOpen.current) return;
    wasOpen.current = true;

    const firstUnowned = ROLES.find((r) => !ownedRoles.includes(r.id))?.id;
    const initialRole =
      defaultRole && !ownedRoles.includes(defaultRole)
        ? defaultRole
        : firstUnowned;

    reset({
      role: initialRole,
      state: userProfile?.state || "",
      lga: userProfile?.lga || "",
      address: userProfile?.address || "",
      phone: userProfile?.phone || "",
    });
  }, [isOpen, userProfile, defaultRole, ownedRoles, reset]);

  // An LGA only means something in the context of its state.
  useEffect(() => {
    const currentLga = watch("lga");
    if (currentLga && !lgaOptions.includes(currentLga)) {
      setValue("lga", "");
    }
  }, [lgaOptions, setValue, watch]);

  const handleClose = () => {
    if (!isPending) onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPending, onClose]);

  // Focus into the dialog, Tab trap, scroll lock, Escape (unless saving).
  useModalA11y(isOpen, modalRef, { onEscape: handleClose });

  const onSubmit = async (data: AddAccountModalSchemaType) => {
    if (!session?.user) {
      toast.error("Your session expired. Please log in again.");
      router.replace("/login");
      return;
    }

    const roleLabel =
      ROLES.find((r) => r.id === data.role)?.label ?? data.role;
    const toastId = toast.loading(`Creating your ${roleLabel} account...`);

    try {
      await addAccount({
        role: data.role,
        // Carried over from the existing profile — this flow never re-collects them.
        name: userProfile?.name || session.user.name || "",
        country: userProfile?.country || "Nigeria",
        phone: data.phone,
        address: data.address,
        state: data.state,
        lga: data.lga,
      });

      await update({ activeRole: data.role });

      toast.dismiss(toastId);
      toast.success(`${roleLabel} account created successfully!`);

      onClose();
      router.push(`/${data.role}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to create account. Please try again.",
      );
    }
  };

  if (!isOpen) return null;

  const hasUnownedRole = ROLES.some((r) => !ownedRoles.includes(r.id));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#2b2b2b94] flex items-center justify-center z-[200] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-account-title"
          className="bg-[#fefefe] rounded-[10px] shadow-lg w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between gap-4">
            <h2
              id="add-account-title"
              className="flex-1 text-center text-[14px] font-montserrat font-semibold text-[#538e53]"
            >
              Kudos! you are almost done!
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              aria-label="Close"
              className="cursor-pointer text-[#808080] hover:text-[#2b2b2b] text-[16px] leading-none transition-colors disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </div>

          {!hasUnownedRole ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-[13px] font-montserrat text-[#2b2b2b] text-center">
                You already have all three account types. Use the profile menu
                to switch between them.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="cursor-pointer bg-[#538e53] text-[#fefefe] text-[13px] font-montserrat px-6 py-2.5 rounded hover:bg-[#467746] transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
              {/* Role selection */}
              <fieldset>
                <legend className="w-full text-center text-[12px] font-montserrat text-[#808080] mb-3">
                  I am registering as
                </legend>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {ROLES.map((role) => {
                    const isOwned = ownedRoles.includes(role.id);
                    const isSelected = selectedRole === role.id;

                    return (
                      <label
                        key={role.id}
                        title={
                          isOwned
                            ? `You already have a ${role.label} account`
                            : undefined
                        }
                        className={`flex items-center gap-2 text-[12px] font-montserrat transition-colors ${
                          isOwned
                            ? "text-[#b8becd] cursor-not-allowed"
                            : "text-[#2b2b2b] cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          value={role.id}
                          disabled={isOwned || isPending}
                          {...register("role")}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`w-[14px] h-[14px] rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-[#538e53]"
                              : isOwned
                                ? "border-[#b8becd]"
                                : "border-[#808080]"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-[8px] h-[8px] rounded-full bg-[#538e53]" />
                          )}
                        </span>
                        {role.label}
                      </label>
                    );
                  })}
                </div>
                {errors.role && (
                  <p className={`${errorClass} text-center`}>
                    {errors.role.message}
                  </p>
                )}
              </fieldset>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label htmlFor="state" className={labelClass}>
                    State
                  </label>
                  <select
                    id="state"
                    {...register("state")}
                    disabled={isPending}
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="">Select</option>
                    {nigerianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className={errorClass}>{errors.state.message}</p>
                  )}
                </div>

                {/* LGA */}
                <div>
                  <label htmlFor="lga" className={labelClass}>
                    L.G.A
                  </label>
                  <select
                    id="lga"
                    {...register("lga")}
                    disabled={isPending || !selectedState}
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="">
                      {selectedState ? "Select" : "Select a state first"}
                    </option>
                    {lgaOptions.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                  {errors.lga && (
                    <p className={errorClass}>{errors.lga.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mt-4">
                <label htmlFor="address" className={labelClass}>
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  placeholder="House address"
                  disabled={isPending}
                  {...register("address")}
                  className={fieldClass}
                />
                {errors.address && (
                  <p className={errorClass}>{errors.address.message}</p>
                )}
              </div>

              {/* Mobile */}
              <div className="mt-4">
                <label htmlFor="phone" className={labelClass}>
                  Mobile
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="Eg 1246474645"
                  disabled={isPending}
                  {...register("phone")}
                  className={fieldClass}
                />
                {errors.phone && (
                  <p className={errorClass}>{errors.phone.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer mt-7 w-full bg-[#538e53] text-[#fefefe] text-[13px] font-montserrat py-2.5 rounded hover:bg-[#467746] transition-colors disabled:bg-[#b8becd] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Done"
                )}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddAccountModal;
