"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  /**
   * Rendered size in px — drives both the box and the initials type scale.
   * Leave it out to size the avatar with `className` instead (e.g. responsive
   * `w-8 sm:w-9 md:w-10` classes); `initialsSize` then sets the type.
   */
  size?: number;
  className?: string;
  /**
   * Solid background for the initials, e.g. a colour derived from the name.
   * When set the initials are white; otherwise they sit on the pale green tint.
   */
  color?: string;
  /** How many initials to show: first + last (default) or just the first. */
  initialsCount?: 1 | 2;
  /** Initials font size in px when `size` is not given (default 12px, 13px
   * from `sm`). */
  initialsSize?: number;
}

const initialsOf = (name?: string, count: 1 | 2 = 2) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (count === 1) return parts[0].charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Real photo when there is one, initials when there isn't — or when the photo
 * URL is broken. Deliberately not a stock portrait — a placeholder face reads
 * as a real person's photo. */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size,
  className = "",
  color,
  initialsCount = 2,
  initialsSize,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = !!src && !failed;
  const fontSize =
    size !== undefined ? Math.max(10, Math.round(size * 0.38)) : initialsSize;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        color ? "" : "bg-[#e4efe4]"
      } ${className}`}
      style={{
        ...(size !== undefined ? { width: size, height: size } : {}),
        ...(color && !showImage ? { backgroundColor: color } : {}),
      }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name || "Profile photo"}
          fill
          sizes={`${size ?? 40}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`font-montserrat font-semibold leading-none ${
            color ? "text-white" : "text-[#538e53]"
          } ${fontSize === undefined ? "text-[12px] sm:text-[13px]" : ""}`}
          style={fontSize === undefined ? undefined : { fontSize }}
        >
          {initialsOf(name, initialsCount)}
        </span>
      )}
    </span>
  );
};

export default UserAvatar;
