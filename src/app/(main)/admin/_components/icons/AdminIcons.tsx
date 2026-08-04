import React from "react";

interface AdminIconProps {
  className?: string;
  onClick?: () => void;
  stroke?: string;
  fill?: string;
}

export const OverviewIcon = ({
  stroke = "#2b2b2b",
  fill = "#2b2b2b",
}: AdminIconProps) => {
  return (
    <div className="flex flex-col items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="5"
        viewBox="0 0 19 5"
        fill="none"
      >
        <rect width="19" height="0.95" rx="0.475" fill={fill} />
        <rect
          y="3.16699"
          width="4.43333"
          height="0.95"
          rx="0.475"
          fill={fill}
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="13"
        viewBox="0 0 16 17"
        fill="none"
      >
        <path
          d="M9.40078 4.06602H13.2008M9.40078 5.96602H11.3008M13.8341 8.18268C13.8341 11.5077 11.1424 14.1993 7.81745 14.1993C4.49245 14.1993 1.80078 11.5077 1.80078 8.18268C1.80078 4.85768 4.49245 2.16602 7.81745 2.16602M14.4674 14.8327L13.2008 13.566"
          stroke={stroke}
          strokeWidth="0.95"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="5"
        viewBox="0 0 19 5"
        fill="none"
      >
        <rect
          y="0.199219"
          width="4.43333"
          height="0.95"
          rx="0.475"
          fill={fill}
        />
        <rect y="3.68359" width="19" height="0.95" rx="0.475" fill={fill} />
      </svg>
    </div>
  );
};

export const Profile2User = ({ stroke = "#292d32" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M6.86992 8.1525C6.79492 8.145 6.70492 8.145 6.62242 8.1525C4.83742 8.0925 3.41992 6.63 3.41992 4.83C3.41992 2.9925 4.90492 1.5 6.74992 1.5C8.58742 1.5 10.0799 2.9925 10.0799 4.83C10.0724 6.63 8.65492 8.0925 6.86992 8.1525Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3084 3C13.7634 3 14.9334 4.1775 14.9334 5.625C14.9334 7.0425 13.8084 8.1975 12.4059 8.25C12.3459 8.2425 12.2784 8.2425 12.2109 8.25"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.11906 10.92C1.30406 12.135 1.30406 14.115 3.11906 15.3225C5.18156 16.7025 8.56406 16.7025 10.6266 15.3225C12.4416 14.1075 12.4416 12.1275 10.6266 10.92C8.57156 9.5475 5.18906 9.5475 3.11906 10.92Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.7559 15C14.2959 14.8875 14.8059 14.67 15.2259 14.3475C16.3959 13.47 16.3959 12.0225 15.2259 11.145C14.8134 10.83 14.3109 10.62 13.7784 10.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const moneyChange = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M1.5 8.25V6.75C1.5 4.125 3 3 5.25 3H12.75C15 3 16.5 4.125 16.5 6.75V11.25C16.5 13.875 15 15 12.75 15H9"
        stroke="#2B2B2B"
        strokeWidth="1.35"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.875 7.125V10.875M1.5 11.625H5.505C5.985 11.625 6.375 12.015 6.375 12.495V13.455M9 10.875C9.49728 10.875 9.97419 10.6775 10.3258 10.3258C10.6775 9.97419 10.875 9.49728 10.875 9C10.875 8.50272 10.6775 8.02581 10.3258 7.67417C9.97419 7.32254 9.49728 7.125 9 7.125C8.50272 7.125 8.02581 7.32254 7.67417 7.67417C7.32254 8.02581 7.125 8.50272 7.125 9C7.125 9.49728 7.32254 9.97419 7.67417 10.3258C8.02581 10.6775 8.50272 10.875 9 10.875Z"
        stroke="#2B2B2B"
        strokeWidth="1.35"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.415 10.7109L1.5 11.6259L2.415 12.5409M6.375 15.5859H2.37C1.89 15.5859 1.5 15.1959 1.5 14.7159V13.7559"
        stroke="#2B2B2B"
        strokeWidth="1.35"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.46094 16.4941L6.37594 15.5791L5.46094 14.6641"
        stroke="#2B2B2B"
        strokeWidth="1.35"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const UserIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M9 9C11.0711 9 12.75 7.32107 12.75 5.25C12.75 3.17893 11.0711 1.5 9 1.5C6.92893 1.5 5.25 3.17893 5.25 5.25C5.25 7.32107 6.92893 9 9 9Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4416 16.5C15.4416 13.5975 12.5541 11.25 8.99914 11.25C5.44414 11.25 2.55664 13.5975 2.55664 16.5"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const userRemoveIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="19"
      viewBox="0 0 18 19"
      fill="none"
    >
      <path
        d="M3.17578 16.6422C3.17578 13.8558 5.94778 11.6022 9.36058 11.6022C10.0518 11.6022 10.7214 11.6958 11.3478 11.8686M9.36058 9.44219C10.3154 9.44219 11.231 9.0629 11.9062 8.38777C12.5813 7.71264 12.9606 6.79697 12.9606 5.84219C12.9606 4.88741 12.5813 3.97173 11.9062 3.2966C11.231 2.62147 10.3154 2.24219 9.36058 2.24219C8.4058 2.24219 7.49013 2.62147 6.815 3.2966C6.13987 3.97173 5.76058 4.88741 5.76058 5.84219C5.76058 6.79697 6.13987 7.71264 6.815 8.38777C7.49013 9.0629 8.4058 9.44219 9.36058 9.44219Z"
        stroke="#2B2B2B"
        strokeWidth="1.08"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4224 12.9996L12.9032 14.5188M12.9176 13.014L14.444 14.5332M16.5608 13.7628C16.5608 13.9932 16.532 14.2164 16.4744 14.4324C16.4096 14.7204 16.2944 15.0012 16.1432 15.246C15.8894 15.6726 15.5288 16.0257 15.0971 16.2707C14.6653 16.5156 14.1772 16.6438 13.6808 16.6428C12.9719 16.6449 12.2882 16.3802 11.7656 15.9012C11.5496 15.714 11.3624 15.4908 11.2184 15.246C10.9443 14.7999 10.7997 14.2864 10.8008 13.7628C10.8003 13.3845 10.8745 13.0098 11.019 12.6601C11.1636 12.3105 11.3757 11.9928 11.6433 11.7253C11.9108 11.4578 12.2285 11.2456 12.5781 11.1011C12.9277 10.9565 13.3024 10.8823 13.6808 10.8828C14.5304 10.8828 15.3008 11.25 15.8192 11.8404C16.28 12.3516 16.5608 13.0284 16.5608 13.7628Z"
        stroke="#2B2B2B"
        strokeWidth="1.08"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const UserTickIcons = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M10.8301 14.2884L11.9701 15.4284L14.2501 13.1484"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.11995 8.1525C9.04495 8.145 8.95495 8.145 8.87245 8.1525C7.08745 8.0925 5.66995 6.63 5.66995 4.83C5.66245 2.9925 7.15495 1.5 8.99245 1.5C10.83 1.5 12.3225 2.9925 12.3225 4.83C12.3225 6.63 10.8974 8.0925 9.11995 8.1525Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.9918 16.3553C7.6268 16.3553 6.2693 16.0103 5.2343 15.3203C3.4193 14.1053 3.4193 12.1253 5.2343 10.9178C7.2968 9.53781 10.6793 9.53781 12.7418 10.9178"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const userMinusIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M9 9C11.0711 9 12.75 7.32107 12.75 5.25C12.75 3.17893 11.0711 1.5 9 1.5C6.92893 1.5 5.25 3.17893 5.25 5.25C5.25 7.32107 6.92893 9 9 9Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.55664 16.5C2.55664 13.5975 5.44416 11.25 8.99916 11.25C9.71916 11.25 10.4167 11.3475 11.0692 11.5275"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 13.5C16.5 13.74 16.47 13.9725 16.41 14.1975C16.3425 14.4975 16.2225 14.79 16.065 15.045C15.5475 15.915 14.595 16.5 13.5 16.5C12.7275 16.5 12.03 16.2075 11.505 15.7275C11.28 15.5325 11.085 15.3 10.935 15.045C10.6575 14.595 10.5 14.0625 10.5 13.5C10.5 12.69 10.8225 11.9475 11.3475 11.4075C11.895 10.845 12.66 10.5 13.5 10.5C14.385 10.5 15.1875 10.8825 15.7275 11.4975C16.2075 12.03 16.5 12.735 16.5 13.5Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.6178 13.4844H12.3828"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MessageQuestionIcon: React.FC<AdminIconProps> = ({
  stroke = "#292d32",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      className="w-[14px] h-[14px] lg:w-[18px] lg:h-[18px] "
    >
      <path
        d="M13.1016 14.2064H10.0182L6.58802 16.488C6.47226 16.5652 6.33772 16.6095 6.19875 16.6162C6.05979 16.6229 5.92161 16.5918 5.79896 16.5261C5.67631 16.4604 5.57379 16.3627 5.50233 16.2433C5.43088 16.1239 5.39317 15.9874 5.39323 15.8483V14.2064C3.08073 14.2064 1.53906 12.6647 1.53906 10.3522V5.72721C1.53906 3.41471 3.08073 1.87305 5.39323 1.87305H13.1016C15.4141 1.87305 16.9557 3.41471 16.9557 5.72721V10.3522C16.9557 12.6647 15.4141 14.2064 13.1016 14.2064Z"
        stroke={stroke}
        strokeWidth="1.15625"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.24833 8.75684V8.59496C9.24833 8.07079 9.57208 7.79329 9.89583 7.56975C10.2119 7.35392 10.5279 7.07642 10.5279 6.56767C10.5279 5.8585 9.9575 5.28809 9.24833 5.28809C8.53917 5.28809 7.96875 5.8585 7.96875 6.56767M9.24448 10.5991H9.25219"
        stroke={stroke}
        strokeWidth="1.15625"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MessageIcon: React.FC<AdminIconProps> = ({
  stroke = "#292d32",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M6.375 14.25H6C3 14.25 1.5 13.5 1.5 9.75V6C1.5 3 3 1.5 6 1.5H12C15 1.5 16.5 3 16.5 6V9.75C16.5 12.75 15 14.25 12 14.25H11.625C11.3925 14.25 11.1675 14.3625 11.025 14.55L9.9 16.05C9.405 16.71 8.595 16.71 8.1 16.05L6.975 14.55C6.855 14.385 6.5775 14.25 6.375 14.25Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9978 8.25H12.0046"
        stroke="#292D32"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.99783 8.25H9.00457"
        stroke="#292D32"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.99588 8.25H6.00262"
        stroke="#292D32"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MessagesIcon: React.FC<AdminIconProps> = ({
  stroke = "#292d32",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <g clipPath="url(#clip0_11153_78165)">
        <path
          d="M12.75 6.75C12.75 9.6525 10.23 12 7.125 12L6.4275 12.84L6.015 13.335C5.6625 13.755 4.9875 13.665 4.755 13.1625L3.75 10.95C2.385 9.99 1.5 8.4675 1.5 6.75C1.5 3.8475 4.02 1.5 7.125 1.5C9.39 1.5 11.3475 2.7525 12.225 4.5525C12.5625 5.22 12.75 5.9625 12.75 6.75Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.25 6.75219H9M16.5 9.64719C16.5 11.3647 15.615 12.8872 14.25 13.8472L13.245 16.0597C13.0125 16.5622 12.3375 16.6597 11.985 16.2322L10.875 14.8972C9.06 14.8972 7.44 14.0947 6.4275 12.8422L7.125 12.0022C10.23 12.0022 12.75 9.65469 12.75 6.75219C12.75 5.96469 12.5625 5.22219 12.225 4.55469C14.6775 5.11719 16.5 7.18719 16.5 9.64719Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_11153_78165">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const Bag2Icon = ({ stroke = "#2b2b2b" }: AdminIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M5.6256 5.75399V5.02648C5.6256 3.33898 6.9831 1.68148 8.6706 1.52398C9.13948 1.47792 9.61281 1.53053 10.0601 1.67844C10.5075 1.82635 10.9189 2.06627 11.2678 2.38277C11.6168 2.69927 11.8957 3.08533 12.0865 3.51611C12.2773 3.94689 12.3758 4.41285 12.3756 4.88399V5.91898M6.7506 16.5015H11.2506C14.2656 16.5015 14.8056 15.294 14.9631 13.824L15.5256 9.32398C15.7281 7.49398 15.2031 6.00148 12.0006 6.00148H6.0006C2.7981 6.00148 2.2731 7.49398 2.4756 9.32398L3.0381 13.824C3.1956 15.294 3.7356 16.5015 6.7506 16.5015Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6211 9H11.6286M6.37109 9H6.37709"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SettingIcon = ({ stroke = "#2b2b2b" }: AdminIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 9.66V8.34C1.5 7.56 2.1375 6.915 2.925 6.915C4.2825 6.915 4.8375 5.955 4.155 4.7775C3.765 4.1025 3.9975 3.225 4.68 2.835L5.9775 2.0925C6.57 1.74 7.335 1.95 7.6875 2.5425L7.77 2.685C8.445 3.8625 9.555 3.8625 10.2375 2.685L10.32 2.5425C10.6725 1.95 11.4375 1.74 12.03 2.0925L13.3275 2.835C14.01 3.225 14.2425 4.1025 13.8525 4.7775C13.17 5.955 13.725 6.915 15.0825 6.915C15.8625 6.915 16.5075 7.5525 16.5075 8.34V9.66C16.5075 10.44 15.87 11.085 15.0825 11.085C13.725 11.085 13.17 12.045 13.8525 13.2225C14.2425 13.905 14.01 14.775 13.3275 15.165L12.03 15.9075C11.4375 16.26 10.6725 16.05 10.32 15.4575L10.2375 15.315C9.5625 14.1375 8.4525 14.1375 7.77 15.315L7.6875 15.4575C7.335 16.05 6.57 16.26 5.9775 15.9075L4.68 15.165C3.9975 14.775 3.765 13.8975 4.155 13.2225C4.8375 12.045 4.2825 11.085 2.925 11.085C2.1375 11.085 1.5 10.44 1.5 9.66Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LogoutIcon: React.FC<AdminIconProps> = ({
  stroke = "#292d32",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="w-[14px] h-[14px] lg:w-[18px] lg:h-[18px] "
    >
      <path
        d="M13.0803 10.965L15.0003 9.045L13.0803 7.125M7.32031 9.045H14.9478M8.82031 15C5.50531 15 2.82031 12.75 2.82031 9C2.82031 5.25 5.50531 3 8.82031 3"
        stroke={stroke}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const EyeIcon = ({ stroke = "#2b2b2b" }: AdminIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M11.6845 8.9975C11.6845 10.4825 10.4845 11.6825 8.99945 11.6825C7.51445 11.6825 6.31445 10.4825 6.31445 8.9975C6.31445 7.5125 7.51445 6.3125 8.99945 6.3125C10.4845 6.3125 11.6845 7.5125 11.6845 8.9975Z"
        stroke={stroke}
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.99891 15.2016C11.6464 15.2016 14.1139 13.6416 15.8314 10.9416C16.5064 9.88406 16.5064 8.10656 15.8314 7.04906C14.1139 4.34906 11.6464 2.78906 8.99891 2.78906C6.35141 2.78906 3.88391 4.34906 2.16641 7.04906C1.49141 8.10656 1.49141 9.88406 2.16641 10.9416C3.88391 13.6416 6.35141 15.2016 8.99891 15.2016Z"
        stroke={stroke}
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MoneyReceived: React.FC<AdminIconProps> = ({
  stroke = "#292d32",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="w-[14px] h-[14px] lg:w-[18px] lg:h-[18px] "
    >
      <path
        d="M7.125 10.3122C7.125 11.0397 7.68751 11.6247 8.37751 11.6247H9.78749C10.3875 11.6247 10.875 11.1147 10.875 10.4772C10.875 9.79468 10.575 9.54719 10.1325 9.38969L7.875 8.60218C7.4325 8.44468 7.13251 8.20469 7.13251 7.51469C7.13251 6.88469 7.61999 6.36719 8.21999 6.36719H9.63C10.32 6.36719 10.8825 6.95219 10.8825 7.67969"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 5.625V12.375"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.75 2.25V5.25H15.75"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 1.5L12.75 5.25"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
