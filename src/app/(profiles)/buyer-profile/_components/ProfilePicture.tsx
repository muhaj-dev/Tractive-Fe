import { CameraIcon } from "@/icons/Icon1";
import { CurrentUserAvatar } from "@/components/CurrentUserAvatar";
import React from "react";

export const ProfilePicture = () => {
  return (
    <div className="relative">
      <CurrentUserAvatar size={90} />
      <div className="absolute -bottom-2 left-0 bg-[#f1f1f1] rounded-full p-2 cursor-pointer hover:bg-[#e2e2e2] transition-colors duration-200">
        <CameraIcon />
      </div>
    </div>
  );
};
