"use client";
export const dynamic = "force-dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoIosCheckmark } from "react-icons/io";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import {
  getOnboardingSchema,
  OnboardingSchemaType,
} from "../../../schemas/onboardingSchema";
import { Button } from "../../../components/Button";
import {
  useUpdateProfile,
  useAddAccount,
  useAvailableRoles,
  ContentPayload,
} from "@/hooks/queries/useUserQueries";

const interests = [
  "fish",
  "Tubers",
  "Grains",
  "Edible",
  "Livestock",
  "Vegetable",
] as const;

type InterestType = (typeof interests)[number];

function OnboardingFormInner() {
  const router = useRouter();
  const { data: session, update } = useSession();

  const { mutateAsync: updateProfile, isPending: loadingProfile } =
    useUpdateProfile(); // Use updateProfile instead of addAccount
  const { mutateAsync: addAccount, isPending: loadingAdd } = useAddAccount();
  const loading = loadingProfile || loadingAdd;
  const { data: rolesData, isError: rolesError } = useAvailableRoles();

  // Get active role directly from session.
  // Register-As page updates this before redirecting here.
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams ? searchParams.get("role") : null;

  // Logic to determine the "target" role for onboarding
  // 1. If session has activeRole (switching/existing), use that.
  // 2. If not, check URL param (new flow from register-as).
  // 3. If not, check localStorage (fallback).
  const [targetRole, setTargetRole] = useState<string | null>(
    session?.user?.activeRole || null,
  );

  useEffect(() => {
    if (session?.user?.activeRole) {
      setTargetRole(session.user.activeRole);
    } else if (roleFromUrl) {
      setTargetRole(roleFromUrl);
    } else {
      const pending = localStorage.getItem("pendingRole");
      if (pending) setTargetRole(pending);
    }
  }, [session, roleFromUrl]);

  const [selectedInterests, setSelectedInterests] = useState<InterestType[]>(
    [],
  );

  // Get the appropriate schema based on user role
  const schema = getOnboardingSchema(targetRole || undefined);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      interests: [] as unknown as [InterestType, ...InterestType[]],
      role: targetRole as "agent" | "transporter" | "buyer",
    },
  });

  // Update role in form if targetRole changes
  useEffect(() => {
    if (targetRole) {
      setValue("role", targetRole as "agent" | "transporter" | "buyer");
    }
  }, [targetRole, setValue]);

  // Register the interests field
  useEffect(() => {
    register("interests");
  }, [register]);

  useEffect(() => {
    // Only redirect if completely lost (no session)
    if (session === null) {
      router.replace("/login");
    }
    // If logged in but no role target found, go back to selection
    else if (session && !targetRole && !loading) {
      // Small delay to ensure we aren't just waiting for hydration
      const timer = setTimeout(() => {
        if (!targetRole) {
          toast.error("Please select a role first.");
          router.replace("/register-as");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [session, targetRole, router, loading]);

  // Onboarding is only for a user creating their first role. Opened directly
  // (e.g. /onboarding?role=buyer) by someone who already has accounts, send
  // them to that dashboard if the role exists, or to add-role if it is new.
  useEffect(() => {
    if (!rolesData || !targetRole || loading) return;
    const existing = rolesData.availableRoles ?? [];
    if (existing.includes(targetRole)) {
      router.replace(`/${targetRole}`);
    } else if (existing.length > 0) {
      router.replace(`/add-role?role=${targetRole}`);
    }
  }, [rolesData, targetRole, loading, router]);

  // Load saved draft data from localStorage (Feature preservation)
  useEffect(() => {
    if (targetRole) {
      const saved = localStorage.getItem(`onboarding-data-${targetRole}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as OnboardingSchemaType;
          Object.keys(parsed).forEach((key) => {
            if (
              key === "interests" &&
              Array.isArray(parsed[key as keyof OnboardingSchemaType])
            ) {
              const interests = parsed[
                key as keyof OnboardingSchemaType
              ] as InterestType[];
              setSelectedInterests(interests);
              setValue(
                "interests",
                interests as [InterestType, ...InterestType[]],
                { shouldValidate: true },
              );
            } else {
              setValue(
                key as keyof OnboardingSchemaType,
                parsed[key as keyof OnboardingSchemaType],
              );
            }
          });
        } catch (error) {
          console.error("Error loading saved data:", error);
        }
      }
    }
  }, [targetRole, setValue]);

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
    if (!session) {
      toast.error("Unauthorized access. Please login.");
      router.replace("/login");
      return;
    }

    if (!targetRole) {
      toast.error("No role selected.");
      return;
    }

    if (!data.interests || data.interests.length === 0) {
      toast.error("Please select at least one interest.");
      return;
    }

    const toastId = toast.loading("Completing your profile...");

    try {
      const finalData: ContentPayload = {
        name: data.name,
        phone: data.phone,
        address: data.address,
        country: data.country,
        state: data.state,
        lga: data.lga,
        interests: data.interests || [],
      };

      // CRITICAL: Two-Step Flow for New Users
      // As per UPDATED user-role.md requirements:
      // 1. Update Profile (PATCH /api/profile)
      // 2. Add Account (POST /api/auth/add-account)

      // Step 1: Update profile with all user data (name, interests, lga, etc.)
      await updateProfile(finalData);

      // Step 2: Check if this is a new role and call add-account
      const isNewRole = !session.user?.role?.includes(targetRole);


      if (isNewRole) {
        const addAccountPayload = {
          role: targetRole,
          name: finalData.name,
          phone: finalData.phone,
          address: finalData.address,
          country: finalData.country,
          state: finalData.state,
          lga: finalData.lga,
        };

        await addAccount(addAccountPayload);
      }

      // Step 4: Refresh session to get updated user data from backend
      await update();

      // Clear draft
      localStorage.removeItem(`onboarding-data-${targetRole}`);
      localStorage.removeItem("pendingRole");

      toast.dismiss(toastId);
      toast.success("Profile setup complete!");

      // Redirect
      router.push(`/${targetRole}`);
      // Small delay to allow toast to show
      // setTimeout(() => {
      // }, 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.dismiss(toastId);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to complete profile.";
      toast.error(errorMessage);
    }
  };

  if (!session || !targetRole) return null; // Or skeleton

  if (rolesError) {
    return (
      <p role="alert" className="min-h-screen flex items-center justify-center text-center text-[13px] text-red-500 font-montserrat px-4">
        We couldn&apos;t load your accounts. Refresh the page to try again.
      </p>
    );
  }

  // Hold the form until we know this is a first-time user, and keep it hidden
  // while an existing user is being redirected away.
  if (!rolesData || (!loading && rolesData.availableRoles?.length > 0)) return null;

  return (
    <>
      <div className="w-full bg-[#f1f1f1] md:bg-[#fefefe] lg:flex">
        <div className="hidden lg:block w-[868px] h-screen">
          <Image
            src="/images/Tomato.png"
            alt="tomatoCarrot"
            width={868}
            height={1080}
            className="w-[868px] h-full"
          />
        </div>

        <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center">
          <div className="w-[90%] md:w-[70%] mx-auto flex flex-col">
            <h1 className="text-[18px] lg:text-[17px] py-4 text-center font-montserrat text-[#538e53] font-normal">
              Complete your {targetRole} profile!
            </h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full max-w-2xl mx-auto space-y-6 p-6"
            >
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

              {/* Local Government Area (LGA) */}
              <div>
                <label className="block text-[13px] font-montserrat font-normal text-[#2b2b2b]">
                  Local Government Area *
                </label>
                <input
                  type="text"
                  {...register("lga")}
                  className="mt-1 w-full border-[0.5px] font-montserrat border-[#808080] rounded px-3 py-2 text-[14px] placeholder:text-[12px] placeholder:text-[#808080] focus:outline-none focus:ring-[0.1px] focus:ring-[#538e53] focus:border-[#538e53]"
                  placeholder="Enter your LGA"
                />
                {errors.lga && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lga.message}
                  </p>
                )}
              </div>

              {/* Interests (Toggle Radio) */}
              <div className="flex flex-col gap-2">
                <label className="block text-[12px] font-montserrat font-normal text-[#808080]">
                  I am interested in: *
                </label>
                <div className="flex flex-wrap gap-4">
                  {interests.map((interest) => {
                    // Cast to string for comparison if interests array is still readonly const
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <label
                        key={interest}
                        className={`flex items-center cursor-pointer border-[0.5px] rounded-full px-[7px] py-[4px] gap-2 text-[12.7px] font-montserrat transition-all ${isSelected
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
                          className={`w-[1.2rem] h-[1.2rem] rounded-full border flex items-center justify-center ${isSelected ? "bg-[#fefefe]" : "border-[#808080]"
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
                    loading ? (
                      <div className="flex items-center justify-center gap-2.5">
                        <span className="animate-spin w-4 h-4 inline-block border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></span>
                        <span>Completing profile...</span>
                      </div>
                    ) : (
                      "Complete Profile"
                    )
                  }
                  className="w-[100%] justify-center"
                  onClick={handleSubmit(onSubmit, (errors) => {
                    console.error("Validation errors:", errors);
                    toast.error("Please check the form for errors.");
                  })}
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OnboardingForm() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></div></div>}>
      <OnboardingFormInner />
    </Suspense>
  );
}
