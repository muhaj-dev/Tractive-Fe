"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const FALLBACK = "/images/placeholder-avatar.png";

interface AvatarProps {
  /** Stored avatar URL. May be missing, or present but broken. */
  src?: string | null;
  alt: string;
  size: number;
  className?: string;
}

/**
 * A user avatar that survives a broken URL.
 *
 * `src || FALLBACK` alone is not enough: it only covers a *missing* URL. Live data
 * also contains URLs that resolve to a 404 — e.g. the seeded
 * `res.cloudinary.com/.../test_avatar.png`, which 404s on the agent dashboard and the
 * customers page — and those render as a broken image. Product images already handle
 * this (see `BidingCard`); avatars did not.
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size,
  className = "",
}) => {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK);

  // Re-sync when the row this avatar belongs to changes (tables reuse these).
  useEffect(() => {
    setImgSrc(src || FALLBACK);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => {
        if (imgSrc !== FALLBACK) setImgSrc(FALLBACK);
      }}
    />
  );
};

export default Avatar;
