import React from "react";

interface Props {
  from?: string | null;
  to?: string | null;
  className?: string;
}

// "—" is the helpers' stand-in for an unknown end of the route.
const known = (v?: string | null): v is string => !!v && v.trim() !== "—";

/**
 * Shown in place of the live map until the backend reports a GPS position.
 * Fills its parent, so the caller's map slot keeps its size.
 */
export default function NoLiveLocation({ from, to, className = "" }: Props) {
  const hasRoute = known(from) || known(to);
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center gap-2 px-4 bg-[#f1f1f1] text-center ${className}`}
    >
      <span
        aria-hidden="true"
        className="w-3 h-3 rounded-full border-2 border-[#808080]"
      />
      <p className="font-montserrat font-medium text-[13px] sm:text-[14px] text-[#2b2b2b]">
        No live location yet
      </p>
      <p className="font-montserrat text-[11px] sm:text-[12px] text-[#808080]">
        The map appears once the vehicle reports its GPS position.
      </p>
      {hasRoute && (
        <p className="font-montserrat font-medium text-[11px] sm:text-[12px] text-[#538e53]">
          {known(from) ? from : "Unknown"} → {known(to) ? to : "Unknown"}
        </p>
      )}
    </div>
  );
}
