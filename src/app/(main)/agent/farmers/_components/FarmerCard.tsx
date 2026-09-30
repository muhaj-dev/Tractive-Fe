import React from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Farmer } from "@/services/FarmerService";

interface FarmerCardProps {
  farmer: Farmer;
  onEdit?: (id: string) => void;
}

export const FarmerCard: React.FC<FarmerCardProps> = ({ farmer, onEdit }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar
          src={farmer.image}
          name={farmer.name !== "-" ? farmer.name : undefined}
          size={40}
        />
        <div>
          <h3 className="font-medium text-gray-900">{farmer.name}</h3>
          <p className="text-xs text-gray-500">{farmer.state}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div>
          <span className="text-xs text-gray-400 block">Mobile</span>
          {farmer.mobile}
        </div>
        <div>
          <span className="text-xs text-gray-400 block">Revenue</span>
          {farmer.revenue}
        </div>
      </div>

      {onEdit && (
        <button
          onClick={() => onEdit(farmer.id)}
          className="w-full py-1.5 text-sm text-[#538e53] border border-[#538e53] rounded hover:bg-[#538e53] hover:text-white transition-colors"
        >
          Edit
        </button>
      )}
    </div>
  );
};
