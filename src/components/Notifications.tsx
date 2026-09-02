"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/queries/useNotificationQueries";
import type { AppNotification } from "@/services/notificationService";

const toneForTitle = (title?: string) => {
  if (!title) return "text-[#2b2b2b]";
  const lower = title.toLowerCase();
  if (lower.includes("congrat") || lower.includes("success")) {
    return "text-[#538e53]";
  }
  if (lower.includes("fail") || lower.includes("error") || lower.includes("reject")) {
    return "text-[#C23939]";
  }
  if (lower.includes("counter")) {
    return "text-[#004085]";
  }
  return "text-[#2b2b2b]";
};

/**
 * Where a notification should take you.
 *
 * The backend never sets `link` — it sends `type` plus a `metadata` bag
 * (productId / bidId / orderId / transactionId) — so every notification used to
 * be a dead end: clicking one marked it read and went nowhere. Derive a
 * destination from the type instead, scoped to the role area the user is
 * currently in, since one account can hold all three roles.
 *
 * Only routes that actually exist are returned; anything unrecognised stays
 * unlinked rather than becoming a 404 (see bug 14c).
 */
const linkFor = (
  n: AppNotification,
  role: "buyer" | "agent" | "transporter" | null,
): string | undefined => {
  if (n.link) return n.link;
  const type = n.type || "";
  const productId = n.metadata?.productId as string | undefined;

  if (type.startsWith("bid_")) {
    if (role === "agent") return "/agent/bids";
    if (role === "transporter") return "/transporter/negotiations";
    if (productId) return `/buyer/product/${productId}`;
    return "/buyer/my-biddings";
  }
  if (type.startsWith("order_") || type.startsWith("transaction_")) {
    if (role === "agent") return "/agent/pending";
    if (role === "transporter") return "/transporter/new";
    return "/buyer/my-orders";
  }
  if (type.startsWith("trip_") || type.startsWith("fleet_")) {
    if (role === "transporter") return "/transporter/new";
    // `(account)` is a route group, so it does not appear in the URL.
    return "/buyer/track-orders";
  }
  return undefined;
};

const formatTime = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
};

export const Notifications = () => {
  const pathname = usePathname();
  const roleSegment = (pathname || "").split("/")[1];
  const role =
    roleSegment === "buyer" || roleSegment === "agent" || roleSegment === "transporter"
      ? roleSegment
      : null;
  const { data, isLoading, isError } = useNotifications();
  const notifications = data?.notifications ?? [];
  const { mutate: markAllRead, isPending: isMarking } =
    useMarkAllNotificationsRead();
  const { mutate: markRead } = useMarkNotificationRead();

  const unreadCount = data?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  return (
    <div className="flex flex-col max-h-[70vh] sm:max-h-[500px]">
      {/* Header — sticky so "Mark all as read" stays reachable while scrolling */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e2e2e2] bg-[#fefefe] px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2">
          <p className="font-montserrat font-semibold text-[14px] text-[#2b2b2b]">
            Notifications
          </p>
          {hasUnread && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#538e53] px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => markAllRead()}
          disabled={!hasUnread || isMarking}
          className="cursor-pointer whitespace-nowrap font-montserrat text-[12px] font-medium text-[#538e53] hover:underline disabled:cursor-not-allowed disabled:text-[#a0a0a0] disabled:no-underline"
        >
          Mark all as read
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#538e53] border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="px-5 py-10 text-center font-montserrat text-[13px] text-[#808080]">
            Couldn&apos;t load notifications. Try again later.
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-10 text-center font-montserrat text-[13px] text-[#808080]">
            You&apos;re all caught up.
          </div>
        ) : (
          <ul className="divide-y divide-[#f0f0f0]">
            {notifications.map((n: AppNotification) => {
              const title = n.title || n.type || "Notification";
              const time = formatTime(n.createdAt);
              const category = n.type || "";
              const content = (
                <div className="flex gap-3 px-4 sm:px-5 py-4">
                  {/* Unread accent dot — keeps a stable width so text aligns */}
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.isRead ? "bg-transparent" : "bg-[#538e53]"
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p
                      className={`font-montserrat text-[13px] font-medium ${toneForTitle(
                        title,
                      )}`}
                    >
                      {title}
                    </p>
                    {n.message && (
                      <p className="font-montserrat text-[12.5px] font-normal text-[#4b4b4b]">
                        {n.message}
                      </p>
                    )}
                    <span className="font-montserrat text-[11.5px] font-normal text-[#909090]">
                      {time}
                      {category ? ` · ${category}` : ""}
                    </span>
                  </div>
                  {n.image && (
                    <Image
                      src={n.image}
                      alt={title}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-[6px] object-cover"
                    />
                  )}
                </div>
              );

              const href = linkFor(n, role);
              const onActivate = () => {
                if (!n.isRead) markRead(n._id);
              };
              // A bare div with onClick was neither focusable nor operable from
              // a keyboard, so a notification could only ever be opened with a
              // mouse. Use the element that matches what it does: a link when
              // there is somewhere to go, a button when there is not.
              const shared =
                "block w-full text-left cursor-pointer transition-colors hover:bg-[#f5f7f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#538e53]";

              return (
                <li
                  key={n._id}
                  className={n.isRead ? "bg-[#fafafa]" : "bg-[#fefefe]"}
                >
                  {href ? (
                    <Link href={href} onClick={onActivate} className={shared}>
                      {content}
                    </Link>
                  ) : (
                    <button type="button" onClick={onActivate} className={shared}>
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
