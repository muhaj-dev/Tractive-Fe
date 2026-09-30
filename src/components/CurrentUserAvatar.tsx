"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useProfile } from "@/hooks/queries/useUserQueries";
import { UserAvatar } from "./UserAvatar";

type CurrentUserAvatarProps = Omit<
  React.ComponentProps<typeof UserAvatar>,
  "src" | "name"
>;

/** Reads the photo from the cached `["profile"]` query (fetched once and shared
 * by every navbar), so a photo changed after login still shows — the session
 * only carries the one it had at sign-in, which is the fallback. */
const SignedInAvatar = (props: CurrentUserAvatarProps) => {
  const { data: session } = useSession();
  const { data: profile } = useProfile();

  return (
    <UserAvatar
      {...props}
      src={(profile?.image as string | undefined) || session?.user?.image}
      name={
        (profile?.name as string | undefined) || session?.user?.name || undefined
      }
    />
  );
};

/** The signed-in user's own avatar: their photo, or their initials when there
 * is none. The profile is only requested once the session is authenticated —
 * a 401 from it would otherwise sign a visitor "out" on a public page. */
export const CurrentUserAvatar = (props: CurrentUserAvatarProps) => {
  const { status } = useSession();

  // Loading or signed out: there is no user to show yet.
  if (status !== "authenticated") return <UserAvatar {...props} />;

  return <SignedInAvatar {...props} />;
};

export default CurrentUserAvatar;
