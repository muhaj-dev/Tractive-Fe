"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PackedIcon,
  MoneyReceiveIcon,
  BoxTickIcon,
} from "@/icons/DashboardIcons";

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ stroke?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Track orders", href: "/buyer/track-orders", icon: PackedIcon },
  { label: "Transactions", href: "/buyer/transactions", icon: MoneyReceiveIcon },
  // My Orders lives here too: it is the same account area, and it was
  // previously reachable only from the top nav, which hid it from anyone
  // already inside Track orders / Transactions.
  { label: "My Orders", href: "/buyer/my-orders", icon: BoxTickIcon },
  // "Chats" (/buyer/chats) removed: the route does not exist, so it 404'd.
];

export const AccountSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-[200px] md:flex-shrink-0">
      <nav
        className="bg-[#fefefe] rounded-[10px] shadow-sm p-2 md:p-3 flex md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-visible"
        aria-label="Buyer account navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;
          const stroke = isActive ? "#538e53" : "#2b2b2b";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-[8px] font-montserrat text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#eaf3ea] text-[#538e53]"
                  : "text-[#2b2b2b] hover:bg-[#f5f5f5]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon stroke={stroke} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
