export interface TruckItem {
  id: string;
  image: string;
  images?: string[];
  rating: string;
  truckName: string;
  amountPerKg: string;
  fullLoad: string;
  spaceRemaining: string;
  locationFrom: string;
  locationTo: string;
  fleetDescription?: string;
  model?: string;
  size?: string;
  plateNumber?: string;
  capacityKg?: number;
  capacity?: number;
  remainingCapacityKg?: number;
  pricePerKg?: number;
  totalPrice?: number;
  priceNegotiation?: boolean;
  /**
   * A whole-truck fleet is charged its flat `totalPrice` however much of it you fill —
   * which is what the backend bills. Without this flag the booking page quoted
   * `pricePerKg × weight`, so a 50 kg load on a ₦150 truck was quoted ₦0.5 and charged
   * ₦150.
   */
  wholeTruckOnly?: boolean;
  pricingModel?: string;
}

export const TruckData: TruckItem[] = [
  {
    id: "BookingCode1001",
    image: "/images/transportTruck.png",
    rating: "4.0",
    truckName: "Monster Truck",
    amountPerKg: "₦40",
    fullLoad: "₦100",
    spaceRemaining: "100 kg",
    locationFrom: "Lagos",
    locationTo: "Abuja",
  },
  {
    id: "BookingCode1002",
    image: "/images/transportTruck.png",
    rating: "4.5",
    truckName: "Heavy Duty Hauler",
    amountPerKg: "₦50",
    fullLoad: "₦150",
    spaceRemaining: "0 kg",
    locationFrom: "Kano",
    locationTo: "Ibadan",
  },
  {
    id: "BookingCode1003",
    image: "/images/transportTruck.png",
    rating: "4.2",
    truckName: "Freight Master",
    amountPerKg: "₦45",
    fullLoad: "₦120",
    spaceRemaining: "120 kg",
    locationFrom: "Jos",
    locationTo: "Enugu",
  },
  {
    id: "BookingCode1004",
    image: "/images/transportTruck.png",
    rating: "4.8",
    truckName: "Cargo King",
    amountPerKg: "₦60",
    fullLoad: "₦200",
    spaceRemaining: "500 kg",
    locationFrom: "Owerri",
    locationTo: "Kano",
  },
];
