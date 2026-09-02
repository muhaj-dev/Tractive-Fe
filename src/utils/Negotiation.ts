export interface NegotiationProps {
  id: string;
  /** Fleet the bid was placed on — the respond endpoint is keyed by both ids. */
  fleetId?: string;
  /** The bid amount as sent, kept for the accept/reject payload. */
  originalPayloadAmount?: number;
  image: string;
  name: string;
  description: string;
  negotiator: string;
  amount: number;
  KG: number;
  location: string;
  date: string;
  checked: boolean;
}

export const negotiations: NegotiationProps[] = [
  {
    id: "neg001",
    image: "/images/truckcontainer.png",
    name: "StarFreight",
    description: "40 ft container",
    negotiator: "Chinedu Okeke",
    amount: 150000,
    KG: 20000,
    location: "Lagos - Abia",
    date: "2025-07-20",
    checked: false,
  },
  {
    id: "neg002",
    image: "/images/truckcontainer.png",
    name: "BlueWave",
    description: "40 ft container",
    negotiator: "Amaka Nwosu",
    amount: 165000,
    KG: 20000,
    location: "Abuja - Enugu",
    date: "2025-07-20",
    checked: false,
  },
  {
    id: "neg003",
    image: "/images/truckcontainer.png",
    name: "SwiftCargo",
    description: "40 ft container",
    negotiator: "Ifeanyi Eze",
    amount: 145000,
    KG: 20000,
    location: "Kano - Port Harcourt",
    date: "2025-07-20",
    checked: false,
  },
  {
    id: "neg004",
    image: "/images/truckcontainer.png",
    name: "OceanicTrans",
    description: "40 ft container",
    negotiator: "Ngozi Adebayo",
    amount: 170000,
    KG: 20000,
    location: "Ibadan - Calabar",
    date: "2025-07-20",
    checked: false,
  },
  {
    id: "neg005",
    image: "/images/truckcontainer.png",
    name: "PrimeLogistics",
    description: "40 ft container",
    negotiator: "Tunde Bakare",
    amount: 155000,
    KG: 20000,
    location: "Benin - Kaduna",
    date: "2025-07-20",
    checked: false,
  },
  {
    id: "neg006",
    image: "/images/truckcontainer.png",
    name: "GlobalHaul",
    description: "40 ft container",
    negotiator: "Fatima Yusuf",
    amount: 160000,
    KG: 20000,
    location: "Jos - Owerri",
    date: "2025-07-20",
    checked: false,
  },
  {
    id: "neg007",
    image: "/images/truckcontainer.png",
    name: "NexusFreight",
    description: "40 ft container",
    negotiator: "Emeka Obi",
    amount: 152000,
    KG: 20000,
    location: "Onitsha - Sokoto",
    date: "2025-07-20",
    checked: false,
  },
];