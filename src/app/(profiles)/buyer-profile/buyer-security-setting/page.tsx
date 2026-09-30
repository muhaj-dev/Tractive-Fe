"use client";
import { useChangePassword } from "@/hooks/queries/useUserQueries";
import React, { useState } from "react";
import { toast } from "sonner";

const SecuritySetting = () => {
  const changePassword = useChangePassword();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    changePassword.mutate(
      {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      },
      {
        onSuccess: () => {
          setFormData({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          });
        },
      },
    );
  };

  const inputClass =
    "w-full p-2 rounded-[4px] border-[1px] border-[#e2e2e2] focus:outline-none focus:border-[#538E53] text-[13px] placeholder:text-[13px] font-montserrat text-[#2b2b2b]";

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-[#808080]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {show ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  );

  return (
    <div className="w-[100%] bg-[#fefefe] flex flex-col items-center shadow-md rounded-[4px] pt-[4rem]">
      <form
        method="post"
        onSubmit={handleSubmit}
        className="flex flex-col justify-center gap-4 py-6 w-[90%] max-w-[500px]"
      >
        {/* Current Password */}
        <div className="w-full">
          <label
            htmlFor="currentPassword"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Current Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              className={inputClass}
              required
              disabled={changePassword.isPending}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
            >
              <EyeIcon show={showCurrent} />
            </button>
          </div>
        </div>

        <span className="w-[100%] h-[1px] bg-[#e2e2e2]" />
        <span className="font-montserrat font-normal text-[15px] text-[#2b2b2b]">
          Create New Password
        </span>

        {/* New Password */}
        <div className="w-full">
          <label
            htmlFor="newPassword"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className={inputClass}
              required
              disabled={changePassword.isPending}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
            >
              <EyeIcon show={showNew} />
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="w-full">
          <label
            htmlFor="confirmNewPassword"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className={inputClass}
              required
              disabled={changePassword.isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
            >
              <EyeIcon show={showConfirm} />
            </button>
          </div>
          {formData.confirmNewPassword &&
            formData.newPassword !== formData.confirmNewPassword && (
              <p className="text-red-500 text-[11px] font-montserrat mt-1">
                Passwords do not match
              </p>
            )}
        </div>

        <button
          type="submit"
          disabled={changePassword.isPending}
          className="bg-[#538E53] text-[#FEFEFE] p-2 rounded-[4px] w-full font-montserrat font-medium text-[14px] hover:bg-[#214821] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {changePassword.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-[#fefefe] border-t-transparent rounded-full" />
              <span>Changing Password...</span>
            </div>
          ) : (
            "Done"
          )}
        </button>
      </form>
    </div>
  );
};

export default SecuritySetting;
