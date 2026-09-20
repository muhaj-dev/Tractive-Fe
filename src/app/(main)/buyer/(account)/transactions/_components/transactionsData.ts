/**
 * A transaction's own status — not an order's.
 *
 * These rows come from `/api/transactions`, where a payment is either awaiting
 * admin approval (`pending`) or approved. The page previously listed orders and
 * carried order statuses here, so a settled payment matched no tab and the
 * screen read "No transactions to display" after a completed purchase.
 */
export type BuyerTransactionStatus = "pending" | "approved";

export interface BuyerTransactionRow {
  id: string;
  productId: string;
  item: string;
  image: string;
  quantity: string;
  amount: number;
  seller: string;
  method: string;
  date: string;
  status: BuyerTransactionStatus;
}
