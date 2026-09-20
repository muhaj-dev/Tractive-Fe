"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { SwapIcon } from "@/icons/Icon1";
import { useSwitchRole } from "@/hooks/queries/useUserQueries";
import { getApiError } from "@/utils/apiError";
import { useAddAccountModal } from "@/components/providers/AddAccountModalProvider";

export type UserRole = "agent" | "buyer" | "transporter";

interface RoleConfig {
  displayName: string;
  accountLabel: string;
  profilePath: string;
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  agent: {
    displayName: "Agent",
    accountLabel: "Agents account",
    profilePath: "/agent-profile",
  },
  buyer: {
    displayName: "Buyer",
    accountLabel: "Buyers account",
    profilePath: "/buyer-profile",
  },
  transporter: {
    displayName: "Transporter",
    accountLabel: "Transporters account",
    profilePath: "/transporter-profile",
  },
};

const ALL_ROLES: UserRole[] = ["agent", "buyer", "transporter"];

export interface AccountMenuProps {
  onLogout: () => void;
  /** Overrides the active role from the session. */
  currentRole?: UserRole;
  /**
   * "desktop" floats the menu under the avatar; "mobile" renders it inline,
   * full width, inside a drawer.
   */
  variant?: "desktop" | "mobile";
}

/**
 * The single profile menu used by every navbar, desktop and mobile.
 *
 * Order is Profile settings → Add account → Switch account → Logout.
 */
export const AccountMenu = ({
  onLogout,
  currentRole,
  variant = "desktop",
}: AccountMenuProps) => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const switchRoleMutation = useSwitchRole();
  const { openAddAccountModal } = useAddAccountModal();
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);

  const user = session?.user;
  const activeRole = (currentRole || user?.activeRole) as UserRole | undefined;
  const ownedRoles: string[] = user?.role || [];

  const switchableRoles = ALL_ROLES.filter(
    (role) => role !== activeRole && ownedRoles.includes(role),
  );
  const hasUnownedRole = ALL_ROLES.some((role) => !ownedRoles.includes(role));

  // Admins have no dedicated profile route yet, so they keep landing on the
  // agent profile — same as before this menu was unified.
  const currentProfilePath =
    activeRole && ROLE_CONFIGS[activeRole]
      ? ROLE_CONFIGS[activeRole].profilePath
      : "/agent-profile";

  const isMobile = variant === "mobile";

  const containerClass = isMobile
    ? "flex flex-col gap-3 pt-2 w-full bg-[#fefefe] rounded-[4px] z-20"
    : "flex flex-col gap-3 absolute right-0 top-12 pt-2 w-48 bg-[#fefefe] rounded-[4px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] z-20";

  const itemClass = `flex items-center justify-between w-full gap-2 px-3 py-1 text-[12px] text-[#2b2b2b] rounded-[4px] cursor-pointer transition-colors ${
    isMobile
      ? "hover:bg-[#2b2b2b] hover:text-[#fefefe] duration-200"
      : "hover:bg-[#538E53] hover:text-[#fefefe]"
  }`;

  const handleSwitchRole = async (role: UserRole) => {
    const loadingToastId = toast.loading(
      `Switching to ${ROLE_CONFIGS[role].displayName} role...`,
    );

    try {
      await switchRoleMutation.mutateAsync({ activeRole: role });
      await update({ activeRole: role });

      toast.dismiss(loadingToastId);
      toast.success(`Switched to ${ROLE_CONFIGS[role].displayName} role!`);

      router.push(`/${role}`);
    } catch (error) {
      console.error("Role switch error:", error);
      toast.dismiss(loadingToastId);

      const { message, description } = getApiError(
        error,
        `Failed to switch to your ${ROLE_CONFIGS[role].displayName} account.`,
      );
      toast.error(message, { description, duration: 8000 });
    }
  };

  return (
    <div className={containerClass}>
      <ul className="flex flex-col w-[95%] mx-auto">
        {/* Profile settings */}
        <li>
          <Link href={currentProfilePath} className={itemClass}>
            Profile settings
          </Link>
        </li>

        {/* Add account */}
        {hasUnownedRole && (
          <li>
            <button
              type="button"
              onClick={() => openAddAccountModal()}
              className={itemClass}
            >
              <span>Add account</span>
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-[16px] h-[16px] rounded-full border border-dashed border-current text-[12px] leading-none"
              >
                +
              </span>
            </button>
          </li>
        )}

        {/* Switch account */}
        {switchableRoles.length > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setIsSwitchOpen((open) => !open)}
              aria-expanded={isSwitchOpen}
              className={itemClass}
            >
              <span>Switch account</span>
              <span aria-hidden="true" className="text-[10px]">
                {isSwitchOpen ? "▲" : "▼"}
              </span>
            </button>

            {isSwitchOpen && (
              <div className="flex flex-col gap-2 py-2 pl-2">
                {switchableRoles.map((role) => {
                  const config = ROLE_CONFIGS[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleSwitchRole(role)}
                      disabled={switchRoleMutation.isPending}
                      title={`Switch to ${config.displayName} account`}
                      className="flex items-center justify-between gap-1 p-1 rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-center gap-1">
                        <Image
                          src="/images/profile_image.png"
                          alt=""
                          width={25}
                          height={25}
                          className="rounded-full"
                        />
                        <div className="flex flex-col items-start">
                          <span className="block text-[10px] text-[#2b2b2b] font-medium text-left">
                            {config.displayName}
                          </span>
                          <span className="block text-[10px] text-[#666666] text-left">
                            {config.accountLabel}
                          </span>
                        </div>
                      </div>
                      <SwapIcon />
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        )}

        {/* Logout */}
        <li>
          <button type="button" onClick={onLogout} className={itemClass}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AccountMenu;
