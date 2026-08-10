"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  useAvailableRoles,
  useSwitchRole,
  useAddAccount,
} from "@/hooks/queries/useUserQueries";
import { Button } from "@/components/Button";

interface RoleOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const roles: RoleOption[] = [
  {
    id: "buyer",
    label: "Buyer",
    description: "Purchase quality produce",
    icon: "/images/AsABuying.png",
  },
  {
    id: "agent",
    label: "Agent",
    description: "Connect farmers and buyers",
    icon: "/images/AsAAgent.png",
  },
  {
    id: "transporter",
    label: "Transporter",
    description: "Deliver agricultural products",
    icon: "/images/AsATransporter.png",
  },
];

export default function RegisterAs() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, update } = useSession();

  const { data: availableRolesData } = useAvailableRoles();
  const switchRoleMutation = useSwitchRole();
  const addAccountMutation = useAddAccount();

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleSubmit = async () => {
    if (!selectedRole || !session) return;

    const roleId = selectedRole;
    const isRoleAvailable =
      availableRolesData?.availableRoles?.includes(roleId);
    const hasExistingRoles =
      availableRolesData?.availableRoles &&
      availableRolesData.availableRoles.length > 0;

    try {
      if (isRoleAvailable) {
        // Role exists - switch to it
        const toastId = toast.loading(`Switching to ${roleId} account...`);
        await switchRoleMutation.mutateAsync({ activeRole: roleId });

        // Update session
        await update({
          activeRole: roleId,
        });

        toast.dismiss(toastId);
        toast.success(`Switched to ${roleId} successfully!`);
        router.replace(`/${roleId}`);
      } else {
        // Role doesn't exist - need to create it

        if (hasExistingRoles) {
          // Existing user adding a new role - redirect to add-role page
          console.log(
            "Existing user adding new role, redirecting to add-role page",
          );
          router.push(`/add-role?role=${roleId}`);
        } else {
          // Brand new user - first role creation via onboarding
          console.log(
            "New user creating first role, redirecting to onboarding",
          );
          localStorage.setItem("pendingRole", roleId);
          router.push(`/onboarding?role=${roleId}`);
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error processing role selection:", error);
      toast.dismiss();
      toast.error(error.message || "Something went wrong. Please try again.");
    }
  };

  const isLoading =
    switchRoleMutation.isPending || addAccountMutation.isPending;

  if (!session) return null;

  return (
    <div className="w-full bg-[#f1f1f1] md:bg-[#fefefe] lg:flex min-h-screen">
      <div className="hidden lg:block w-[868px] h-screen">
        <Image
          src="/images/signinLogin.png"
          alt="Register as"
          width={868}
          height={1080}
          className="w-[868px] h-full object-cover"
        />
      </div>

      <div className="w-full lg:w-[70%] lg:mx-auto flex items-center justify-center py-10">
        <div className="w-[90%] md:w-[70%] mx-auto flex flex-col">
          <div className="hidden lg:flex w-[80px] h-[70px] mx-auto items-center justify-center mb-6">
            <Image
              src="/images/signinloginlogo.png"
              alt="Tractive Logo"
              width={127}
              height={127}
              className="w-[127px] h-[80px]"
            />
          </div>

          <h1 className="text-[24px] lg:text-[20px] py-4 text-center font-montserrat text-[#2b2b2b] md:text-[#538e53] font-normal mb-2">
            How would you like to use Tractive?
          </h1>

          <p className="text-center text-[13px] text-[#808080] mb-8 font-montserrat">
            Select a role to get started
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {roles.map((role) => {
              const isAvailable = availableRolesData?.availableRoles?.includes(
                role.id,
              );
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  disabled={isLoading}
                  className={`p-6 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-3 relative ${
                    selectedRole === role.id
                      ? "border-[#538e53] bg-[#538e53] text-white"
                      : "border-[#e0e0e0] bg-white hover:border-[#538e53]"
                  } ${
                    isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {/* Tag for existing roles */}
                  {isAvailable && (
                    <span
                      className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full ${
                        selectedRole === role.id
                          ? "bg-white text-[#538e53]"
                          : "bg-[#538e53] text-white"
                      }`}
                    >
                      Existing
                    </span>
                  )}

                  <div className="w-16 h-16 rounded-full flex items-center justify-center">
                    <Image
                      src={role.icon}
                      alt={role.label}
                      width={48}
                      height={48}
                      className="w-12 h-12"
                    />
                  </div>

                  <h3 className="font-montserrat font-semibold text-[16px]">
                    {role.label}
                  </h3>

                  <p
                    className={`text-center text-[12px] font-montserrat ${
                      selectedRole === role.id
                        ? "text-[#fefefe]"
                        : "text-[#808080]"
                    }`}
                  >
                    {role.description}
                  </p>

                  {selectedRole === role.id && (
                    <div className="mt-2 text-[12px] font-montserrat">
                      Selected ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || isLoading}
            textClass="text-center mx-auto"
            text={isLoading ? "Processing..." : "Continue"}
            className="w-full md:w-[50%]  mx-auto block"
          />

          <p className="text-center text-[12px] text-[#808080] font-montserrat mt-6">
            Want to change your role later?{" "}
            <Link
              href="/account-settings"
              className="text-[#538e53] hover:underline"
            >
              Go to settings
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
