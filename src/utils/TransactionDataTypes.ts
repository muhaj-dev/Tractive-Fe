export interface Transaction {
  id: string;
  image: string;
  fullname: string;
  email: string;
  paidTo: string;
  paymentMethod: "Transfer" | "Credit Card";
  Amount: string;
  date: string;
  checked: boolean;
  // "Rejected" is an admin decision (`status: "rejected"`); "Failed" is kept
  // separate for a payment that failed, so the two are never shown as one.
  status: "Pending" | "Approved" | "Rejected" | "Failed" | "Refunded";
  productName?: string;
  productImage?: string;
  productCount?: number;
}

export const TransactionalData: Transaction[] = [
  {
    id: "4367554433",
    image: "/images/TopAgent.png",
    fullname: "Chidinma Nwachukwu",
    email: "chidinma.nwachukwu@example.com",
    paidTo: "Joseph Oyin",
    paymentMethod: "Transfer",
    Amount: "₦30,000",
    date: "12/20/2025",
    checked: false,
    status: "Pending",
  },
  {
    id: "8923445123",
    image: "/images/TopAgent.png",
    fullname: "Adebayo Ogunleye",
    email: "adebayo.ogunleye@example.com",
    paidTo: "Sarah Akintola",
    paymentMethod: "Credit Card",
    Amount: "₦15,500",
    date: "11/15/2025",
    checked: true,
    status: "Approved",
  },
  {
    id: "1278904567",
    image: "/images/TopAgent.png",
    fullname: "Fatima Bello",
    email: "fatima.bello@example.com",
    paidTo: "Emeka Chukwu",
    paymentMethod: "Transfer",
    Amount: "₦8,750",
    date: "10/05/2025",
    checked: false,
    status: "Failed",
  },
  {
    id: "3456789012",
    image: "/images/TopAgent.png",
    fullname: "Olumide Akinsanya",
    email: "olumide.akinsanya@example.com",
    paidTo: "Grace Okonkwo",
    paymentMethod: "Credit Card",
    Amount: "₦22,300",
    date: "09/25/2025",
    checked: true,
    status: "Approved",
  },
  {
    id: "6789012345",
    image: "/images/TopAgent.png",
    fullname: "Ngozi Eze",
    email: "ngozi.eze@example.com",
    paidTo: "Ahmed Yusuf",
    paymentMethod: "Transfer",
    Amount: "₦5,000",
    date: "08/10/2025",
    checked: false,
    status: "Refunded",
  },
  {
    id: "9012345678",
    image: "/images/TopAgent.png",
    fullname: "Tunde Adesina",
    email: "tunde.adesina@example.com",
    paidTo: "Chioma Okeke",
    paymentMethod: "Credit Card",
    Amount: "₦42,100",
    date: "07/30/2025",
    checked: true,
    status: "Approved",
  },
  {
    id: "2345678901",
    image: "/images/TopAgent.png",
    fullname: "Aisha Mohammed",
    email: "aisha.mohammed@example.com",
    paidTo: "David Okafor",
    paymentMethod: "Transfer",
    Amount: "₦12,900",
    date: "06/15/2025",
    checked: false,
    status: "Pending",
  },
];
