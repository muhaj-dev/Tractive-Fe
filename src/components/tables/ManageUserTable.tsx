"use client";
import React, { useState } from "react";
import UserAvatar from "@/components/UserAvatar";

interface Table1Props {
  data: {
    id: string;
    fullName?: string;
    email?: string;
    image?: string;
    location?: string;
    profession?: "Farmer" | "Agent";
    mobileNumber?: string;
    status?: "Active" | "Suspended" | "All";
    date?: string;
    actionIcon?: React.ReactNode;
  }[];
  className?: string;
  checkboxClassName?: string;
  imageClassName?: string;
  nameClassName?: string;
  emailClassName?: string;
  locationClassName?: string;
  professionClassName?: string;
  mobileClassName?: string;
  statusClassName?: string;
  dateClassName?: string;
  actionClassName?: string;
}

export const ManageUserTable: React.FC<Table1Props> = ({
  data,
  className,
  checkboxClassName,
  imageClassName,
  nameClassName,
  emailClassName,
  locationClassName,
  professionClassName,
  mobileClassName,
  statusClassName,
  dateClassName,
  actionClassName,
}) => {
   const [selectedIds, setSelectedIds] = useState<string[]>([]);

   const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.checked) {
       setSelectedIds(data.map((item) => item.id));
     } else {
       setSelectedIds([]);
     }
   };

   const handleSelectRow = (id: string) => {
     setSelectedIds((prev) =>
       prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
     );
   };

   const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <table className={`table-auto w-full ${className}`}>
      <thead>
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className={checkboxClassName}
            />
          </th>
          <th className="px-4 py-2">Full Name</th>
          <th className="px-4 py-2">Location</th>
          <th className="px-4 py-2">Profession</th>
          <th className="px-4 py-2">Mobile Number</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            {/* Checkbox */}
            <td className="px-4 py-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => handleSelectRow(item.id)}
                className={checkboxClassName}
              />
            </td>

            {/* Full Name with Image and Email */}
            <td className="px-4 py-2">
              <div className="flex items-center">
                <UserAvatar
                  src={item.image}
                  name={item.fullName}
                  className={imageClassName || "w-10 h-10"}
                />
                <div className="ml-2">
                  <div className={nameClassName}>{item.fullName}</div>
                  <div className={emailClassName}>{item.email}</div>
                </div>
              </div>
            </td>

            {/* Location */}
            <td className="px-4 py-2">
              <div className={locationClassName}>{item.location}</div>
            </td>

            {/* Profession */}
            <td className="px-4 py-2">
              <div className={professionClassName}>{item.profession}</div>
            </td>

            {/* Mobile Number */}
            <td className="px-4 py-2">
              <div className={mobileClassName}>{item.mobileNumber}</div>
            </td>

            {/* Status */}
            <td className="px-4 py-2">
              <div className={statusClassName}>{item.status}</div>
            </td>

            {/* Date */}
            <td className="px-4 py-2">
              <div className={dateClassName}>{item.date}</div>
            </td>

            {/* Action */}
            <td className="px-4 py-2">
              <div className={actionClassName}>{item.actionIcon}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
