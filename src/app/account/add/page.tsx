"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userService } from "@/services/UserService";
import { addAccountSchema, AddAccountSchemaType } from "@/schemas/addAccountSchema";
import { Button } from "@/components/Button";
import { SellerIcon, TransportationIcon, MenuIcon } from "@/icons/Icons"; // Using MenuIcon as placeholder for Agent

type RoleType = "buyer" | "agent" | "transporter";

const ROLES: { id: RoleType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "buyer",
    label: "Buyer",
    icon: <SellerIcon isActive={false} isHovered={false} />,
    description: "Purchase agricultural products directly from farmers.",
  },
  {
    id: "agent",
    label: "Agent",
    icon: <MenuIcon />, // Placeholder
    description: "Manage farmers and facilitate transactions.",
  },
  {
    id: "transporter",
    label: "Transporter",
    icon: <TransportationIcon isActive={false} isHovered={false} />,
    description: "Provide logistics and transportation services.",
  },
];

export default function AddAccountPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [existingRoles, setExistingRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await userService.getCurrentUser();
        // Handle both 'roles' and 'role' properties from backend/session
        const roles = profile.roles || profile.role || [];
        setExistingRoles(roles);
      } catch (error) {
        console.error("Failed to fetch profile", error);
        // Fallback to session data if profile fetch fails
        if (session?.user?.role) {
             setExistingRoles(session.user.role);
        }
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      // Initialize with session data first to prevent flash
      if (session.user.role) {
          setExistingRoles(session.user.role);
      }
      fetchProfile();
    }
  }, [session, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddAccountSchemaType>({
    resolver: zodResolver(addAccountSchema),
  });

  const onSubmit = async (data: AddAccountSchemaType) => {
    if (!selectedRole) return;

    setSubmitting(true);
    const toastId = toast.loading("Creating account...");

    try {
      await userService.addAccount({
        role: selectedRole,
        name: data.name,
        phone: data.phone,
        address: data.address,
        country: data.country,
        state: data.state,
        lga: data.lga,
      });

      // Update session
       await update({
        activeRole: selectedRole,
        // We might need to optimistically update roles too if the backend doesn't return them immediately in the session
      });
      
      // Force refresh to ensure all states are synced
       toast.dismiss(toastId);
      toast.success(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} account created successfully!`);
      
      // Redirect to the new dashboard
      router.push(`/${selectedRole}`);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to create account", error);
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to create account");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#538E53] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-12 px-4 sm:px-6 lg:px-8 font-montserrat">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2b2b2b] text-center mb-8">
          Add New Account
        </h1>

        {/* Section 1: Role Selection */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-[#2b2b2b] mb-4">Select Account Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLES.map((role) => {
              // Normalize role checking (lowercase)
              const isOwned = existingRoles.some(r => r.toLowerCase() === role.id.toLowerCase());
              const isSelected = selectedRole === role.id;

              return (
                <button
                  type="button"
                  disabled={isOwned}
                  aria-pressed={isSelected}
                  key={role.id}
                  onClick={() => !isOwned && setSelectedRole(role.id)}
                  className={`
                    relative p-6 rounded-lg border-2 transition-all cursor-pointer
                    ${isOwned 
                      ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed" 
                      : isSelected
                        ? "bg-[#f0fdf0] border-[#538E53] shadow-md"
                        : "bg-white border-gray-200 hover:border-[#538E53] hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-3 rounded-full ${isSelected ? "bg-[#538E53] text-white" : "bg-gray-100 text-[#2b2b2b]"}`}>
                         {/* Icons handling needs improvement for props passing if using React Nodes directly, but sufficient for now */}
                         {/* We clone the element to pass isActive if desired, or just render */}
                         {role.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{role.label}</h3>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                  {isOwned && (
                    <div className="absolute top-2 right-2 bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-full font-medium">
                      Already Exist
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Account Creation Form */}
        {selectedRole && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-6">
              Complete your {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Profile
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#538E53] focus:border-[#538E53] outline-none transition-colors"
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#538E53] focus:border-[#538E53] outline-none transition-colors"
                    placeholder="+234..."
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                 {/* Country */}
                 <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    {...register("country")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#538E53] focus:border-[#538E53] outline-none transition-colors"
                    placeholder="Nigeria"
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    {...register("state")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#538E53] focus:border-[#538E53] outline-none transition-colors"
                    placeholder="Lagos"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                 {/* LGA */}
                 <div>
                  <label htmlFor="lga" className="block text-sm font-medium text-gray-700 mb-1">
                    LGA
                  </label>
                  <input
                    id="lga"
                    type="text"
                    {...register("lga")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#538E53] focus:border-[#538E53] outline-none transition-colors"
                    placeholder="Ikeja"
                  />
                  {errors.lga && (
                    <p className="mt-1 text-sm text-red-600">{errors.lga.message}</p>
                  )}
                </div>
              </div>

               {/* Address - Full width */}
               <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    {...register("address")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#538E53] focus:border-[#538E53] outline-none transition-colors resize-none"
                    placeholder="123 Farm Road..."
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  text={submitting ? "Creating..." : "Create Account"}
                  disabled={submitting}
                  className="w-full md:w-auto px-8"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
