/** Buyer or seller contact details, shown in the Buyer/Seller Info popups (A9). */
export interface OrderPartyInfo {
    id: string;
    name: string;
    businessName: string;
    email: string;
    phone: string;
    state: string;
    address: string;
    image: string;
}

export interface OrderData {
    id: string;
    image: string;
    title: string;
    description: string;
    buyerName: string;
    sellerName: string;
    amount: string;
    date: string;
    checked: boolean;
    // Party details carried from the list response so the info popups render
    // without a second request. Optional: absent on the legacy fixture rows.
    buyerInfo?: OrderPartyInfo;
    sellerInfos?: OrderPartyInfo[];
}

export interface orderDataProps {
  order: OrderData[];
  /**
   * Opening a row shows the buyer and the seller together. It replaces the
   * row menu's separate "Buyer Info" / "Seller Info" entries, which forced a
   * choice between two halves of the same order.
   */
  onRowClick: (id: string) => void;
  handleCheckboxChange: (id: string) => void;
  handleSelectAll: () => void;
  allChecked: boolean;
  // Filters are controlled by the page so they reach the API instead of only
  // filtering the rows already on screen.
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
}

export const TrackAgentData: OrderData[] = [
  {
    id: "1458372044",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Fresh yellow bell",
    buyerName: "John Doe",
    sellerName: "Jane Smith",
    amount: "₦1500",
    date: "2023-10-01",
    checked: false,
  },
  {
    id: "2458372045",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Fresh yellow bell",
    buyerName: "Alice Brown",
    sellerName: "Bob Johnson",
    amount: "₦800",
    date: "2023-10-02",
    checked: false,
  },
  {
    id: "3458372046",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Crisp yellow bell",
    buyerName: "Emma Wilson",
    sellerName: "Tom Davis",
    amount: "₦600",
    date: "2023-10-03",
    checked: false,
  },
  {
    id: "4458372047",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Organic yellow bell",
    buyerName: "Liam Taylor",
    sellerName: "Sarah Miller",
    amount: "₦1200",
    date: "2023-10-04",
    checked: false,
  },
  {
    id: "5458372048",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Fresh yellow bell",
    buyerName: "Olivia Lee",
    sellerName: "Michael Chen",
    amount: "₦2000",
    date: "2023-10-05",
    checked: false,
  },
  {
    id: "6458372049",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Sweet yellow bell",
    buyerName: "Noah Clark",
    sellerName: "Emily Adams",
    amount: "₦1800",
    date: "2023-10-06",
    checked: false,
  },
  {
    id: "7458372050",
    image: "/images/yellowPepper.png",
    title: "Yellow Pepper",
    description: "Ripe yellow bell",
    buyerName: "Sophia Harris",
    sellerName: "David Walker",
    amount: "₦900",
    date: "2023-10-07",
    checked: false,
  },
];