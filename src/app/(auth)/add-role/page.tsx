"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  useUserProfile,
  useAddAccount,
} from "@/hooks/queries/useUserQueries";
import { Button } from "@/components/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getOnboardingSchema,
  OnboardingSchemaType,
} from "../../../schemas/onboardingSchema";
import { IoIosCheckmark } from "react-icons/io";

const interests = [
  "fish",
  "Tubers",
  "Grains",
  "Edible",
  "Livestock",
  "Vegetable",
] as const;

type InterestType = (typeof interests)[number];

const ROLE_CONFIGS = {
  agent: {
    label: "Agent",
    description: "Connect farmers and buyers",
    icon: "/images/AsAAgent.png",
  },
  buyer: {
    label: "Buyer",
    description: "Purchase quality produce",
    icon: "/images/AsABuying.png",
  },
  transporter: {
    label: "Transporter",
    description: "Deliver agricultural products",
    icon: "/images/AsATransporter.png",
  },
};

function AddRolePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const roleParam = searchParams.get("role") as
    | "agent"
    | "buyer"
    | "transporter"
    | null;

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { mutateAsync: addAccount, isPending: addingAccount } = useAddAccount();

  const [selectedInterests, setSelectedInterests] = useState<InterestType[]>(
    [],
  );

  // Redirect if no role specified
  useEffect(() => {
    if (!roleParam) {
      toast.error("No role specified");
      router.replace("/register-as");
    }
  }, [roleParam, router]);

  // Get the appropriate schema based on role
  const schema = getOnboardingSchema(roleParam || undefined);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      interests: [] as unknown as [InterestType, ...InterestType[]],
      role: roleParam as "agent" | "transporter" | "buyer",
    },
  });

  // Register the interests field
  useEffect(() => {
    register("interests");
  }, [register]);

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (userProfile && roleParam) {
      setValue("name", userProfile.name || "");
      setValue("phone", userProfile.phone || "");
      setValue("address", userProfile.address || "");
      setValue("country", userProfile.country || "");
      setValue("state", userProfile.state || "");
      setValue("role", roleParam);

      if (userProfile.interests && Array.isArray(userProfile.interests)) {
        const validInterests = userProfile.interests.filter((i: string) =>
          interests.includes(i as InterestType),
        ) as InterestType[];
        setSelectedInterests(validInterests);
        setValue(
          "interests",
          validInterests as [InterestType, ...InterestType[]],
          {
            shouldValidate: true,
          },
        );
      }
    }
  }, [userProfile, roleParam, setValue]);

  const toggleInterest = (interest: InterestType) => {
    const updated = selectedInterests.includes(interest)
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];

    setSelectedInterests(updated);
    setValue("interests", updated as [InterestType, ...InterestType[]], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (data: OnboardingSchemaType) => {
    if (!session || !roleParam) {
      toast.error("Unauthorized access. Please login.");
      router.replace("/login");
      return;
    }

    if (!data.interests || data.interests.length === 0) {
      toast.error("Please select at least one interest.");
      return;
    }

    const toastId = toast.loading(
      `Creating your ${ROLE_CONFIGS[roleParam].label} account...`,
    );

    try {
      // Call add-account API to create the new role
      const addAccountPayload = {
        role: roleParam,
        phone: data.phone,
        address: data.address,
        country: data.country,
        state: data.state,
      };

      console.log("Creating new role with add-account API:", addAccountPayload);
      await addAccount(addAccountPayload);
      console.log("✓ Role created successfully");

      // Refresh session to get updated roles and activeRole
      console.log("Refreshing session...");
      await update();
      console.log("✓ Session updated");

      toast.dismiss(toastId);
      toast.success(
        `${ROLE_CONFIGS[roleParam].label} account created successfully!`,
      );

      // Redirect to the new role's dashboard
      router.push(`/${roleParam}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Add role error:", error);
      toast.dismiss(toastId);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create account.";
      toast.error(errorMessage);
    }
  };

  if (!session || !roleParam) return null;

  if (profileLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIGS[roleParam];
  const existingRoles = session.user?.role || [];

  return (
    <div className="w-full bg-[#f1f1f1] md:bg-[#fefefe] lg:flex min-h-screen">
      <div className="hidden lg:block w-[868px] h-screen">
        <Image
          src="/images/Tomato.png"
          alt="tomatoCarrot"
          width={868}
          height={1080}
          className="w-[868px] h-full object-cover"
        />
      </div>

      <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center py-10">
        <div className="w-[90%] md:w-[70%] mx-auto flex flex-col">
          <h1 className="text-[24px] lg:text-[20px] py-4 text-center font-montserrat text-[#538e53] font-semibold mb-2">
            Create Your {roleConfig.label} Account
          </h1>

          <p className="text-center text-[13px] text-[#808080] mb-6 font-montserrat">
            You&apos;re adding a new role to your existing account
          </p>

          {/* Show existing roles (blurred/disabled) */}
          {existingRoles.length > 0 && (
            <div className="mb-6">
              <p className="text-[12px] text-[#808080] mb-3 font-montserrat">
                Your existing roles:
              </p>
              <div className="flex gap-3 flex-wrap opacity-50">
                {existingRoles.map((role: string) => {
                  const config =
                    ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS];
                  if (!config) return null;
                  return (
                    <div
                      key={role}
                      className="p-4 rounded-lg border-2 border-[#e0e0e0] bg-white flex items-center gap-2"
                    >
                      <Image
                        src={config.icon}
                        alt={config.label}
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                      <span className="text-[14px] font-montserrat">
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New role being created (prominent) */}
          <div className="mb-8 p-6 rounded-lg border-2 border-[#538e53] bg-[#538e53] text-white">
            <div className="flex items-center gap-4">
              <Image
                src={roleConfig.icon}
                alt={roleConfig.label}
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <div>
                <h3 className="font-montserrat font-semibold text-[18px]">
                  {roleConfig.label}
                </h3>
                <p className="text-[13px] text-[#fefefe]">
                  {roleConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            {/* Name */}
            <div>
              <label className="block text-[13px] font-montserrat font-normal text-[#2b2b2b]">
                Full Name *
              </label>
              <input
                type="text"
                {...register("name")}
                className="mt-1 w-full border-[0.5px] font-montserrat border-[#808080] rounded px-3 py-2 text-[13px] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[13px] font-montserrat font-normal text-[#2b2b2b]">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register("phone")}
                className="mt-1 w-full border-[0.5px] font-montserrat border-[#808080] rounded px-3 py-2 text-[14px] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                placeholder="+234..."
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-[13px] font-montserrat font-normal text-[#2b2b2b]">
                Address *
              </label>
              <input
                type="text"
                {...register("address")}
                className="mt-1 w-full border-[0.5px] font-montserrat border-[#808080] rounded px-3 py-2 text-[14px] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                placeholder="Enter your street address"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-[13px] font-montserrat font-normal text-[#2b2b2b]">
                Country *
              </label>
              <input
                type="text"
                {...register("country")}
                className="mt-1 w-full border-[0.5px] font-montserrat border-[#808080] rounded px-3 py-2 text-[14px] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                placeholder="Enter your country"
              />
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.country.message}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-[13px] font-montserrat font-normal text-[#2b2b2b]">
                State *
              </label>
              <input
                type="text"
                {...register("state")}
                className="mt-1 w-full border-[0.5px] font-montserrat border-[#808080] rounded px-3 py-2 text-[14px] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                placeholder="Enter your state"
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.state.message}
                </p>
              )}
            </div>

            {/* Interests */}
            <div className="flex flex-col gap-2">
              <label className="block text-[12px] font-montserrat font-normal text-[#808080]">
                I am interested in: *
              </label>
              <div className="flex flex-wrap gap-4">
                {interests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <label
                      key={interest}
                      className={`flex items-center cursor-pointer border-[0.5px] rounded-full px-[7px] py-[4px] gap-2 text-[12.7px] font-montserrat transition-all ${
                        isSelected
                          ? "bg-[#538e53] text-[#fefefe]"
                          : "text-[#808080] border-[#808080]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={interest}
                        checked={isSelected}
                        onChange={() => toggleInterest(interest)}
                        className="hidden"
                      />
                      <span
                        className={`w-[1.2rem] h-[1.2rem] rounded-full border flex items-center justify-center ${
                          isSelected ? "bg-[#fefefe]" : "border-[#808080]"
                        }`}
                      >
                        {isSelected && (
                          <IoIosCheckmark className="w-[2rem] h-[2rem] text-[#538e53] rounded-full" />
                        )}
                      </span>
                      {interest}
                    </label>
                  );
                })}
              </div>
              {errors.interests && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.interests.message as string}
                </p>
              )}
            </div>

            {/* Submit */}
            <div>
              <Button
                type="submit"
                text={
                  addingAccount ? (
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="animate-spin w-4 h-4 inline-block border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></span>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    `Create ${roleConfig.label} Account`
                  )
                }
                className="w-[100%] justify-center"
                disabled={addingAccount}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddRolePage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></div></div>}>
      <AddRolePageInner />
    </Suspense>
  );
}
