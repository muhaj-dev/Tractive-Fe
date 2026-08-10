"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  /** Rendered size in px — drives both the box and the initials type scale. */
  size?: number;
  className?: string;
}

const initialsOf = (name?: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Real photo when there is one, initials when there isn't. Deliberately not a
 * stock portrait — a placeholder face reads as a real person's photo. */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 40,
  className = "",
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = !!src && !failed;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4efe4] ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name || "Profile photo"}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-montserrat font-semibold text-[#538e53] leading-none"
          style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }}
        >
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
};

export default UserAvatar;
