"use client";
import React from "react";
import { useWishlist } from "@/hooks/wishlistContext";
interface menuIconProps {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export const MenuIcon: React.FC<menuIconProps> = ({ className, onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={`cursor-pointer ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      <path
        d="M22 8.27V4.23C22 2.64 21.36 2 19.77 2H15.73C14.14 2 13.5 2.64 13.5 4.23V8.27C13.5 9.86 14.14 10.5 15.73 10.5H19.77C21.36 10.5 22 9.86 22 8.27Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 8.52V3.98C10.5 2.57 9.86 2 8.27 2H4.23C2.64 2 2 2.57 2 3.98V8.51C2 9.93 2.64 10.49 4.23 10.49H8.27C9.86 10.5 10.5 9.93 10.5 8.52Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 19.77V15.73C10.5 14.14 9.86 13.5 8.27 13.5H4.23C2.64 13.5 2 14.14 2 15.73V19.77C2 21.36 2.64 22 4.23 22H8.27C9.86 22 10.5 21.36 10.5 19.77Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 15.5H21"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 19.5H21"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface SearchIconProps {
  className?: string;
  stroke?: string;
}

export const SearchIcon = ({
  stroke = "#FEFEFE",
  className,
}: SearchIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="19"
      viewBox="0 0 18 19"
      fill="none"
      className={`flex flex-col justify-center items-center rounded-[4px]
 ${className}`}
    >
      <path
        d="M8.25 15.5C10.0402 15.5 11.7571 14.7888 13.023 13.523C14.2888 12.2571 15 10.5402 15 8.75C15 6.95979 14.2888 5.2429 13.023 3.97703C11.7571 2.71116 10.0402 2 8.25 2C6.45979 2 4.7429 2.71116 3.47703 3.97703C2.21116 5.2429 1.5 6.95979 1.5 8.75C1.5 10.5402 2.21116 12.2571 3.47703 13.523C4.7429 14.7888 6.45979 15.5 8.25 15.5ZM14.1975 16.0175C14.595 17.2175 15.5025 17.3375 16.2 16.2875C16.8375 15.3275 16.4175 14.54 15.2625 14.54C14.4075 14.5325 13.9275 15.2 14.1975 16.0175Z"
        stroke={stroke}
        strokeWidth="0.62574"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const NotificationIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 25"
      fill="none"
      className="cursor-pointer"
    >
      <path
        d="M12.0206 3.41016C8.71058 3.41016 6.02058 6.10016 6.02058 9.41016V12.3002C6.02058 12.9102 5.76058 13.8402 5.45058 14.3602L4.30058 16.2702C3.59058 17.4502 4.08058 18.7602 5.38058 19.2002C9.69058 20.6402 14.3406 20.6402 18.6506 19.2002C19.8606 18.8002 20.3906 17.3702 19.7306 16.2702L18.5806 14.3602C18.2806 13.8402 18.0206 12.9102 18.0206 12.3002V9.41016C18.0206 6.11016 15.3206 3.41016 12.0206 3.41016Z"
        stroke="#2B2B2B"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <path
        d="M13.8699 3.70043C13.5599 3.61043 13.2399 3.54043 12.9099 3.50043C11.9499 3.38043 11.0299 3.45043 10.1699 3.70043C10.4599 2.96043 11.1799 2.44043 12.0199 2.44043C12.8599 2.44043 13.5799 2.96043 13.8699 3.70043Z"
        stroke="#2B2B2B"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.0195 19.5596C15.0195 21.2096 13.6695 22.5596 12.0195 22.5596C11.1995 22.5596 10.4395 22.2196 9.89953 21.6796C9.35953 21.1396 9.01953 20.3796 9.01953 19.5596"
        stroke="#2B2B2B"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
    </svg>
  );
};

// Home Icon Component
export const HomeIcon: React.FC<{ isActive: boolean; isHovered: boolean }> = ({
  isActive,
  isHovered,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
  >
    <path
      d="M9 13.5V11.25"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.55294 2.11489L2.35544 6.27739C1.77044 6.74239 1.39544 7.72489 1.52294 8.45989L2.52044 14.4299C2.70044 15.4949 3.72044 16.3574 4.80044 16.3574H13.2004C14.2729 16.3574 15.3004 15.4874 15.4804 14.4299L16.4779 8.45989C16.5979 7.72489 16.2229 6.74239 15.6454 6.27739L10.4479 2.12239C9.64544 1.47739 8.34794 1.47739 7.55294 2.11489Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Transportation List Icon Component
export const TransportationIcon: React.FC<{
  isActive: boolean;
  isHovered: boolean;
}> = ({ isActive, isHovered }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="19"
    height="18"
    viewBox="0 0 19 18"
    fill="none"
  >
    <path
      d="M9.33429 10.5H10.0843C10.9093 10.5 11.5843 9.825 11.5843 9V1.5H4.83429C3.70929 1.5 2.7268 2.12249 2.2168 3.03749"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.83398 12.75C1.83398 13.995 2.83898 15 4.08398 15H4.83398C4.83398 14.175 5.50898 13.5 6.33398 13.5C7.15898 13.5 7.83398 14.175 7.83398 15H10.834C10.834 14.175 11.509 13.5 12.334 13.5C13.159 13.5 13.834 14.175 13.834 15H14.584C15.829 15 16.834 13.995 16.834 12.75V10.5H14.584C14.1715 10.5 13.834 10.1625 13.834 9.75V7.5C13.834 7.0875 14.1715 6.75 14.584 6.75H15.5515L14.269 4.50751C13.999 4.04251 13.504 3.75 12.964 3.75H11.584V9C11.584 9.825 10.909 10.5 10.084 10.5H9.33398"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.33398 16.5C7.16241 16.5 7.83398 15.8284 7.83398 15C7.83398 14.1716 7.16241 13.5 6.33398 13.5C5.50556 13.5 4.83398 14.1716 4.83398 15C4.83398 15.8284 5.50556 16.5 6.33398 16.5Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.334 16.5C13.1624 16.5 13.834 15.8284 13.834 15C13.834 14.1716 13.1624 13.5 12.334 13.5C11.5056 13.5 10.834 14.1716 10.834 15C10.834 15.8284 11.5056 16.5 12.334 16.5Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.834 9V10.5H14.584C14.1715 10.5 13.834 10.1625 13.834 9.75V7.5C13.834 7.0875 14.1715 6.75 14.584 6.75H15.5515L16.834 9Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.83398 6H6.33398"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.83398 8.25H4.83398"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.83398 10.5H3.33398"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Seller List Icon Component
export const SellerIcon: React.FC<{
  isActive: boolean;
  isHovered: boolean;
}> = ({ isActive, isHovered }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="19"
    height="18"
    viewBox="0 0 19 18"
    fill="none"
  >
    <path
      d="M7.53594 8.1525C7.46094 8.145 7.37094 8.145 7.28844 8.1525C5.50344 8.0925 4.08594 6.63 4.08594 4.83C4.08594 2.9925 5.57094 1.5 7.41594 1.5C9.25344 1.5 10.7459 2.9925 10.7459 4.83C10.7384 6.63 9.32094 8.0925 7.53594 8.1525Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.9745 3C14.4295 3 15.5995 4.1775 15.5995 5.625C15.5995 7.0425 14.4745 8.1975 13.072 8.25C13.012 8.2425 12.9445 8.2425 12.877 8.25"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.78508 10.92C1.97008 12.135 1.97008 14.115 3.78508 15.3225C5.84758 16.7025 9.23008 16.7025 11.2926 15.3225C13.1076 14.1075 13.1076 12.1275 11.2926 10.92C9.23758 9.5475 5.85508 9.5475 3.78508 10.92Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.4219 15C14.9619 14.8875 15.4719 14.67 15.8919 14.3475C17.0619 13.47 17.0619 12.0225 15.8919 11.145C15.4794 10.83 14.9769 10.62 14.4444 10.5"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Wish List Icon Component
export const WishListIcon: React.FC<{
  isActive: boolean;
  isHovered: boolean;
}> = ({ isActive, isHovered }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
  >
    <path
      d="M9.465 15.6077C9.21 15.6977 8.79 15.6977 8.535 15.6077C6.36 14.8652 1.5 11.7677 1.5 6.5177C1.5 4.2002 3.3675 2.3252 5.67 2.3252C7.035 2.3252 8.2425 2.9852 9 4.0052C9.7575 2.9852 10.9725 2.3252 12.33 2.3252C14.6325 2.3252 16.5 4.2002 16.5 6.5177C16.5 11.7677 11.64 14.8652 9.465 15.6077Z"
      stroke={isActive || isHovered ? "#538E53" : "#2B2B2B"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const YellowStarIcon = ({ className = "" }: menuIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 15 15"
      fill="none"
      className={className}
    >
      <path
        d="M8.58058 2.19414L9.68058 4.39414C9.83058 4.70039 10.2306 4.99414 10.5681 5.05039L12.5618 5.38164C13.8368 5.59414 14.1368 6.51914 13.2181 7.43164L11.6681 8.98164C11.4056 9.24414 11.2618 9.75039 11.3431 10.1129L11.7868 12.0316C12.1368 13.5504 11.3306 14.1379 9.98683 13.3441L8.11808 12.2379C7.78058 12.0379 7.22433 12.0379 6.88058 12.2379L5.01183 13.3441C3.67433 14.1379 2.86183 13.5441 3.21183 12.0316L3.65558 10.1129C3.73683 9.75039 3.59308 9.24414 3.33058 8.98164L1.78058 7.43164C0.868083 6.51914 1.16183 5.59414 2.43683 5.38164L4.43058 5.05039C4.76183 4.99414 5.16183 4.70039 5.31183 4.39414L6.41183 2.19414C7.01183 1.00039 7.98683 1.00039 8.58058 2.19414Z"
        fill="#FFA500"
      />
    </svg>
  );
};

export const StarIcon = ({ className = "" }: menuIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 15 15"
      fill="none"
      className={className}
    >
      <g clipPath="url(#clip0_6176_95574)">
        <path
          d="M8.58058 2.19414L9.68058 4.39414C9.83058 4.70039 10.2306 4.99414 10.5681 5.05039L12.5618 5.38164C13.8368 5.59414 14.1368 6.51914 13.2181 7.43164L11.6681 8.98164C11.4056 9.24414 11.2618 9.75039 11.3431 10.1129L11.7868 12.0316C12.1368 13.5504 11.3306 14.1379 9.98683 13.3441L8.11808 12.2379C7.78058 12.0379 7.22433 12.0379 6.88058 12.2379L5.01183 13.3441C3.67433 14.1379 2.86183 13.5441 3.21183 12.0316L3.65558 10.1129C3.73683 9.75039 3.59308 9.24414 3.33058 8.98164L1.78058 7.43164C0.868083 6.51914 1.16183 5.59414 2.43683 5.38164L4.43058 5.05039C4.76183 4.99414 5.16183 4.70039 5.31183 4.39414L6.41183 2.19414C7.01183 1.00039 7.98683 1.00039 8.58058 2.19414Z"
          stroke="#2B2B2B"
          strokeWidth="1.66831"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_6176_95574">
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

interface WishIconProps {
  title: string;
  className?: string;
}

export const WishIcon = ({ title }: WishIconProps) => {
  const { isWished, toggleWish } = useWishlist();

  // Handle click to toggle wished state
  const handleWishToggle = () => {
    toggleWish(title);
  };

  return (
    <button
      type="button"
      aria-label={title}
      aria-pressed={isWished(title)}
      className="absolute top-2 right-2 bg-[#ffffff80] rounded-full p-1 cursor-pointer hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-[#538e53]"
      onClick={handleWishToggle}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="21"
        viewBox="0 0 22 21"
        fill={isWished(title) ? "#2A942A" : "none"}
      >
        <path
          d="M11.454 19.21C11.114 19.33 10.554 19.33 10.214 19.21C7.31398 18.22 0.833984 14.09 0.833984 7.09C0.833984 4 3.32398 1.5 6.39398 1.5C8.21398 1.5 9.82398 2.38 10.834 3.74C11.3478 3.04588 12.017 2.48173 12.788 2.09274C13.559 1.70376 14.4104 1.50076 15.274 1.5C18.344 1.5 20.834 4 20.834 7.09C20.834 14.09 14.354 18.22 11.454 19.21Z"
          stroke="#2A942A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export const WishIcon1 = ({ title, className = "" }: WishIconProps) => {
  const { isWished, toggleWish } = useWishlist();
  // Handle click to toggle wished state
  const handleWishToggle = () => {
    toggleWish(title);
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 22 21"
      fill={isWished(title) ? "#2A942A" : "none"}
      onClick={handleWishToggle}
      // An svg has no button semantics; give it the keyboard path a click has.
      role="button"
      tabIndex={0}
      aria-label={title}
      aria-pressed={isWished(title)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleWishToggle();
        }
      }}
      className={className}
    >
      <path
        d="M11.454 19.21C11.114 19.33 10.554 19.33 10.214 19.21C7.31398 18.22 0.833984 14.09 0.833984 7.09C0.833984 4 3.32398 1.5 6.39398 1.5C8.21398 1.5 9.82398 2.38 10.834 3.74C11.3478 3.04588 12.017 2.48173 12.788 2.09274C13.559 1.70376 14.4104 1.50076 15.274 1.5C18.344 1.5 20.834 4 20.834 7.09C20.834 14.09 14.354 18.22 11.454 19.21Z"
        stroke="#2A942A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LoaderIcon = () => {
  return (
    <svg
      className="animate-spin h-4 w-4 text-[#538E53]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export const InfoIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 8V13M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
        stroke="#538E53"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9951 16H12.0041"
        stroke="#538E53"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface videoIconProps {
  className: string;
}

export const PlayIcon = ({className}: videoIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="42"
      height="42"
      viewBox="0 0 52 52"
      fill="none"
      className={className}
    >
      <path
        d="M8.66602 26.0003V18.287C8.66602 8.71034 15.4477 4.78868 23.746 9.57701L30.441 13.4337L37.136 17.2903C45.4343 22.0787 45.4343 29.922 37.136 34.7103L30.441 38.567L23.746 42.4237C15.4477 47.212 8.66602 43.2903 8.66602 33.7137V26.0003Z"
        fill="#2B2B2B"
      />
    </svg>
  );
};


export const PauseIcon = ({className}: videoIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="45"
      height="45"
      viewBox="0 0 52 52"
      fill="none"
      className={className}
    >
      <rect x="15" y="10" width="6" height="32" fill="#2b2b2b" />
      <rect x="31" y="10" width="6" height="32" fill="#2b2b2b" />
    </svg>
  );
};

interface ArrowIconProps {
  className?: string;
  stroke?: string;
}

export const ArrowRightIcon = ({
  className = "",
  stroke = "#2b2b2b",
}: ArrowIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
};

export const ArrowLeftIcon = ({
  className = "",
  stroke = "#2b2b2b",
}: ArrowIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 9 18"
      fill="none"
      className={className}
    >
      <path
        d="M8.04883 1.07992L1.52883 7.59992C0.758828 8.36992 0.758828 9.62992 1.52883 10.3999L8.04883 16.9199"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ReplyIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="22"
      viewBox="0 0 21 22"
      fill="none"
    >
      <path
        d="M14.679 8.44389C14.679 11.7856 11.7777 14.4884 8.20279 14.4884L7.39974 15.4555L6.92481 16.0254C6.51897 16.509 5.74182 16.4053 5.47414 15.8268L4.31705 13.2795C2.74549 12.1742 1.72656 10.4213 1.72656 8.44389C1.72656 5.10216 4.62791 2.39941 8.20279 2.39941C10.8105 2.39941 13.0643 3.84145 14.0746 5.91385C14.4631 6.68236 14.679 7.53722 14.679 8.44389Z"
        stroke="#2B2B2B"
        strokeWidth="1.29525"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.04492 8.44508H10.3624M18.9974 11.7782C18.9974 13.7556 17.9784 15.5085 16.4069 16.6138L15.2498 19.1611C14.9821 19.7396 14.205 19.8519 13.7991 19.3597L12.5211 17.8227C10.4315 17.8227 8.56633 16.8987 7.40061 15.4567L8.20366 14.4896C11.7785 14.4896 14.6799 11.7868 14.6799 8.44508C14.6799 7.53841 14.464 6.68355 14.0754 5.91504C16.8991 6.56266 18.9974 8.94591 18.9974 11.7782Z"
        stroke="#2B2B2B"
        strokeWidth="1.29525"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LikeIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
    >
      <path
        d="M7.09082 16.5176L9.76766 18.59C10.1131 18.9354 10.8902 19.1081 11.4083 19.1081H14.6896C15.7258 19.1081 16.8483 18.331 17.1074 17.2948L19.1798 10.9912C19.6115 9.78235 18.8344 8.74616 17.5391 8.74616H14.0851C13.567 8.74616 13.1353 8.31441 13.2216 7.70996L13.6534 4.94677C13.8261 4.16962 13.308 3.30613 12.5309 3.04708C11.8401 2.78803 10.9766 3.13343 10.6312 3.65153L7.09082 8.91886"
        stroke="#2B2B2B"
        strokeWidth="1.29525"
        strokeMiterlimit="10"
      />
      <path
        d="M2.68652 16.518V8.05568C2.68652 6.84679 3.20462 6.41504 4.41352 6.41504H5.27701C6.48591 6.41504 7.00401 6.84679 7.00401 8.05568V16.518C7.00401 17.7268 6.48591 18.1586 5.27701 18.1586H4.41352C3.20462 18.1586 2.68652 17.7268 2.68652 16.518Z"
        stroke="#2B2B2B"
        strokeWidth="1.29525"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const AwardIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 17 17"
      fill="none"
    >
      <g clipPath="url(#clip0_6180_142292)">
        <path
          d="M2.88867 7.44433V10.7924C2.88867 12.0184 2.88867 12.0184 4.04735 12.7999L7.23373 14.6389C7.71203 14.9151 8.49346 14.9151 8.97176 14.6389L12.1581 12.7999C13.3168 12.0184 13.3168 12.0184 13.3168 10.7924V7.44433C13.3168 6.21828 13.3168 6.21828 12.1581 5.43685L8.97176 3.59777C8.49346 3.32158 7.71203 3.32158 7.23373 3.59777L4.04735 5.43685C2.88867 6.21828 2.88867 6.21828 2.88867 7.44433Z"
          stroke="#2B2B2B"
          strokeWidth="1.21257"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.8091 5.16083V3.38912C11.8091 2.04182 11.1355 1.36816 9.78815 1.36816H6.41988C5.07258 1.36816 4.39893 2.04182 4.39893 3.38912V5.11367M8.52842 7.4243L8.9124 8.02385C8.97303 8.11816 9.10776 8.21248 9.20881 8.23942L9.89593 8.41457C10.3203 8.52236 10.4349 8.88613 10.1587 9.22295L9.70731 9.76861C9.63994 9.85619 9.58605 10.0111 9.59279 10.1189L9.63321 10.8262C9.66015 11.2641 9.35027 11.4864 8.94608 11.3248L8.2859 11.062C8.1657 11.0216 8.03559 11.0216 7.91539 11.062L7.25521 11.3248C6.85102 11.4864 6.54114 11.2574 6.56809 10.8262L6.60851 10.1189C6.61524 10.0111 6.56135 9.84945 6.49399 9.76861L6.04264 9.22295C5.76644 8.88613 5.88096 8.52236 6.30536 8.41457L6.99249 8.23942C7.10027 8.21248 7.235 8.11143 7.2889 8.02385L7.67288 7.4243C7.91539 7.06053 8.29264 7.06053 8.52842 7.4243Z"
          stroke="#2B2B2B"
          strokeWidth="1.21257"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_6180_142292">
          <rect
            width="16.1677"
            height="16.1677"
            fill="white"
            transform="translate(0.0209961 0.0205078)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export const FilterIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M18.6001 21.9004L5.4001 21.9004C4.3001 21.9004 3.4001 21.0004 3.4001 19.9004V17.7004C3.4001 16.9004 3.9001 15.9004 4.4001 15.4004L8.7001 11.6004C9.3001 11.1004 9.7001 10.1004 9.7001 9.30039V5.00039C9.7001 4.40039 10.1001 3.60039 10.6001 3.30039L12.0001 2.40039C13.3001 1.60039 15.1001 2.50039 15.1001 4.10039V9.40039C15.1001 10.1004 15.5001 11.0004 15.9001 11.5004L19.7001 15.5004C20.2001 16.0004 20.6001 16.9004 20.6001 17.5004V19.8004C20.6001 21.0004 19.7001 21.9004 18.6001 21.9004Z"
        stroke="#808080"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.07 21.9004L18 14.0004"
        stroke="#808080"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface ArrowUpIconProps {
  onClick?: () => void;
  className?: string;
  stroke?: string;
}

export const ArrowUpIcon = ({
  onClick,
  className,
  stroke = "#292d32",
}: ArrowUpIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      <path
        d="M19.9201 15.0496L13.4001 8.52965C12.6301 7.75965 11.3701 7.75965 10.6001 8.52965L4.08008 15.0496"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ArrowDownIcon = ({
  onClick,
  className,
  stroke = "#292d32",
}: ArrowUpIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      <path
        d="M19.9201 8.95043L13.4001 15.4704C12.6301 16.2404 11.3701 16.2404 10.6001 15.4704L4.08008 8.95043"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
