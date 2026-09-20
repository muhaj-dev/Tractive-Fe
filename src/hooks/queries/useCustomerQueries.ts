import { useQuery } from "@tanstack/react-query";
import {
  CustomerService,
  type Customer,
  type GetCustomersParams,
} from "@/services/customerService";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params?: GetCustomersParams) =>
    [...customerKeys.lists(), params ?? {}] as const,
};

/**
 * The agent's customers. Cached and shared, because it is also the only way to
 * put a name to the buyer on an order: orders carry `buyer` as a bare id
 * string, `GET /api/orders/{id}` answers an agent with 403 "Buyer access
 * required", and `GET /api/orders/{id}/parties` answers 400 "Invalid order id"
 * for ids the orders list itself just returned. `/api/customers` is the one
 * route that reliably carries the buyer's name, phone and email.
 */
export const useCustomers = (
  params?: GetCustomersParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => CustomerService.getCustomers(params),
    // Customer records barely move; this is a lookup table, not a live feed.
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: { response?: { status?: number } }) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
};

/** One customer by id, resolved from the cached list. */
export const useCustomerById = (
  customerId: string | undefined,
  options?: { enabled?: boolean },
): Customer | undefined => {
  const { data } = useCustomers(
    { limit: 200 },
    { enabled: (options?.enabled ?? true) && Boolean(customerId) },
  );
  if (!customerId) return undefined;
  return data?.data.find((c) => c.id === customerId);
};
