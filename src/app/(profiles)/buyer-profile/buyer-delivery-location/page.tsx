"use client";
import React, { useState, useEffect } from "react";
import { nigerianStates, lgaData, matchOption } from "@/utils/state&LGA";
import { ArrowDownIcon } from "@/icons/Icons";
import { useProfile, useUpdateProfile } from "@/hooks/queries/useUserQueries";

const DeliveryLocation = () => {
  const { data: profile, isLoading: fetchingProfile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    state: "",
    lga: "",
    street: "",
  });

  // Populate the form once profile data arrives
  useEffect(() => {
    if (!profile) return;
    // Match case-insensitively so "ilorin south" preselects "Ilorin South".
    const state = matchOption(nigerianStates, profile.state);
    setFormData({
      state,
      lga: matchOption(lgaData[state], profile.lga),
      street: profile.address || "",
    });
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { lga: "" } : {}), // Reset LGA when state changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      state: formData.state,
      lga: formData.lga,
      address: formData.street,
    });
  };

  if (fetchingProfile) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full" />
          <span className="text-[#538e53] font-montserrat text-[14px]">
            Loading location...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[100%] bg-[#fefefe] flex flex-col items-center shadow-md rounded-[4px] pt-[4rem]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center gap-4 py-6 w-[90%] max-w-[500px]"
      >
        {/* State */}
        <div className="w-full">
          <label
            htmlFor="state"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            State <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full p-2 pr-8 rounded-[4px] border-[1px] border-[#e2e2e2] text-[13px] placeholder:text-[13px] focus:outline-none focus:border-[#538E53] font-montserrat text-[#2b2b2b] appearance-none"
              required
            >
              <option value="" disabled>
                Select a state
              </option>
              {nigerianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ArrowDownIcon className="h-4 w-4 text-[#2b2b2b]" />
            </div>
          </div>
        </div>

        {/* Local Government Area */}
        <div className="w-full">
          <label
            htmlFor="lga"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Local Government Area <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="lga"
              name="lga"
              value={formData.lga}
              onChange={handleChange}
              className="w-full p-2 pr-8 rounded-[4px] border-[1px] border-[#e2e2e2] text-[13px] placeholder:text-[13px] focus:outline-none focus:border-[#538E53] font-montserrat text-[#2b2b2b] appearance-none"
              disabled={!formData.state}
              required
            >
              <option value="" disabled>
                Select an LGA
              </option>
              {formData.state &&
                lgaData[formData.state]?.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ArrowDownIcon className="h-4 w-4 text-[#2b2b2b]" />
            </div>
          </div>
        </div>

        {/* Street/Area */}
        <div className="w-full">
          <label
            htmlFor="street"
            className="font-montserrat font-normal text-[13px] text-[#2b2b2b] mb-1 block"
          >
            Street/Area <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="Enter street or area"
            className="w-full p-2 rounded-[4px] border-[1px] border-[#e2e2e2] text-[13px] placeholder:text-[13px] focus:outline-none focus:border-[#538E53] font-montserrat text-[#2b2b2b]"
            required
          />
        </div>

        {/* Done Button */}
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="bg-[#538E53] text-[#FEFEFE] p-2 rounded-[4px] w-full font-montserrat font-medium text-[13px] hover:bg-[#214821] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {updateProfile.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-[#fefefe] border-t-transparent rounded-full" />
              <span>Saving...</span>
            </div>
          ) : (
            "Done"
          )}
        </button>
      </form>
    </div>
  );
};

export default DeliveryLocation;
