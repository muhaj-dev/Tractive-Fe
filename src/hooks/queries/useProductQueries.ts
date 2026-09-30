import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productService,
  CreateProductData,
  UpdateProductData,
  ApiProduct,
  ProductsResponse,
  SearchFilters,
} from "@/services/productService";
import { toast } from "sonner";

// Query key factory for products
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  similar: (id: string) => [...productKeys.detail(id), "similar"] as const,
};

/**
 * Hook to fetch all products
 * Intelligently routes to /api/products/out-of-stock if status is 'out_of_stock'
 * otherwise uses standard /api/products
 */
export const useProducts = (filters: SearchFilters = {}) => {
  return useQuery({
    queryKey: productKeys.list(filters as Record<string, unknown>),
    queryFn: () => {
      // If asking specifically for out_of_stock, use the dedicated endpoint
      if (filters.status === "out_of_stock") {
        // Create a copy of filters but remove 'status' as the endpoint implies it
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status, ...rest } = filters;
        return productService.getOutOfStockProducts(rest);
      }
      return productService.getProducts(filters);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    placeholderData: (previousData: any) => previousData,
  });
};

/**
 * Hook to fetch single product details
 */
export const useProduct = (id: string | null) => {
  return useQuery({
    queryKey: productKeys.detail(id || ""),
    queryFn: () => productService.getProduct(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch similar products
 */
export const useSimilarProducts = (id: string | null) => {
  return useQuery({
    queryKey: productKeys.similar(id || ""),
    queryFn: () => productService.getSimilarProducts(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch top selling products
 */
export const useGetTopSellingProducts = () => {
  return useQuery({
    queryKey: [...productKeys.all, "topSelling"],
    queryFn: () => productService.getTopSellingProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch recommendations for buyers
 */
export const useGetRecommendations = () => {
  return useQuery({
    queryKey: [...productKeys.all, "recommendations"],
    queryFn: () => productService.getRecommendations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch recommendations for a specific seller store
 */
export const useGetSellerRecommendations = (sellerId: string) => {
  return useQuery({
    queryKey: [...productKeys.all, "sellerRecommendations", sellerId],
    queryFn: () => productService.getSellerRecommendations(sellerId),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => productService.createProduct(data),
    onSuccess: () => {
      // Invalidate and immediately refetch all active product list queries
      // (covers any filter combination the ProductTable may be using)
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
        refetchType: "active",
      });

      toast.success("Product uploaded successfully!");
    },
    onError: (error: Error) => {
      const message = error?.message || "Failed to create product";
      toast.error(message);
    },
  });
};

/**
 * Hook to update product details (Price & Quantity)
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // `existing` is the product as the server last returned it. It is merged
    // under the edited fields so the request carries the product's full state
    // — see buildFullProductPayload / item 21 in docs/API-FIXES-REQUIRED.md.
    mutationFn: ({
      id,
      data,
      existing,
    }: {
      id: string;
      data: UpdateProductData;
      existing?: ApiProduct | null;
    }) => productService.updateProduct(id, data, existing),
    onSuccess: async (updatedProduct, { id }) => {
      // The edit modal reads this product's detail query. A GET started before
      // the save can still be in flight and would land with the pre-save
      // values, so cancel it and store what the server just returned.
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });
      queryClient.setQueryData(
        productKeys.detail(id),
        (old: ApiProduct | undefined) =>
          old ? { ...old, ...updatedProduct } : updatedProduct,
      );

      // Invalidate relevant queries to ensure consistency
      // Ideally we updates cache manually for perfect optimistic UI, but for edit details invalidation is often acceptable
      // However, let's try to update the cache for better UX
      const status = updatedProduct.status || "available";
      const listKey = productKeys.list({ status });

      queryClient.setQueryData(
        listKey,
        (oldData: ProductsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            products: oldData.products.map((p) =>
              p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p,
            ),
          };
        },
      );

      toast.success("Product updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update product");
    },
  });
};

/**
 * Hook to update product status (optimistic)
 */
export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      existing,
    }: {
      id: string;
      status: "available" | "out_of_stock" | "discontinued";
      // Current server state, resent with the status so the change cannot wipe
      // the category (item 21). Falls back to whatever the loaded lists hold.
      existing?: ApiProduct | null;
    }) => productService.updateProductStatus(id, status, existing),
    onMutate: async ({ id, status }) => {
      // Cancel queries to avoid overwrites
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      const targetStatus = status;

      // We need to find where the product currently is (available or out_of_stock)
      // We check all list queries
      const queries = queryClient.getQueriesData<ProductsResponse>({
        queryKey: productKeys.lists(),
      });

      let movedProduct: ApiProduct | undefined;
      const previousDataMap = new Map(); // To store previous data for rollback

      queries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;

        previousDataMap.set(queryKey, oldData);

        const productIndex = oldData.products.findIndex((p) => p.id === id);

        // If found in this list
        if (productIndex !== -1) {
          const product = oldData.products[productIndex];
          movedProduct = { ...product, status: targetStatus };

          const newTotal = Math.max(0, oldData.total - 1);

          // Remove from this list (it's moving)
          queryClient.setQueryData(queryKey, {
            ...oldData,
            products: oldData.products.filter((p) => p.id !== id),
            pagination: {
              ...oldData.pagination,
              total: newTotal,
            },
            total: newTotal,
          });
        }
      });

      // If we found the product and we have a target list loaded, add it there
      if (movedProduct) {
        // We only add to a list if we have a specific query for that status key
        // e.g., if we are moving to 'discontinued', we might not show that list, so we don't add it anywhere.
        const targetListKey = productKeys.list({ status: targetStatus });
        const targetListData =
          queryClient.getQueryData<ProductsResponse>(targetListKey);

        if (targetListData) {
          const newTotal = targetListData.total + 1;
          queryClient.setQueryData(targetListKey, {
            ...targetListData,
            products: [movedProduct, ...targetListData.products],
            pagination: {
              ...targetListData.pagination,
              total: newTotal,
            },
            total: newTotal,
          });
        }
      }

      return { previousDataMap };
    },
    onError: (err, newTodo, context) => {
      // Rollback
      if (context?.previousDataMap) {
        context.previousDataMap.forEach((data, key) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error("Failed to update status");
    },
    onSuccess: () => {
      // A status change moves the product between the Active and Out of Stock
      // lists (two separate server queries), so the optimistic in-place edit is
      // not enough — without this the row stays in the wrong tab until reload.
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

/**
 * Hook to delete product (optimistic)
 * Uses POST /api/products/bulk/delete with single ID as per requirements
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.deleteMultipleProducts([id]),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      const queries = queryClient.getQueriesData<ProductsResponse>({
        queryKey: productKeys.lists(),
      });

      queries.forEach(([key, oldData]) => {
        if (oldData) {
          const newTotal = Math.max(0, oldData.total - 1);
          queryClient.setQueryData(key, {
            ...oldData,
            products: oldData.products.filter((p) => p.id !== id),
            pagination: {
              ...oldData.pagination,
              total: newTotal,
            },
            total: newTotal,
          });
        }
      });

      return { queries };
    },
    onError: (err, id, context) => {
      // Rollback
      context?.queries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error("Failed to delete product");
    },
    onSuccess: () => {
      // Reconcile tab counts / pagination totals with the server.
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product deleted");
    },
  });
};

/**
 * Hook for bulk delete
 */
export const useBulkDeleteProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productService.deleteMultipleProducts(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      const queries = queryClient.getQueriesData<ProductsResponse>({
        queryKey: productKeys.lists(),
      });

      queries.forEach(([key, oldData]) => {
        if (oldData) {
          const countToRemove = oldData.products.filter((p) =>
            ids.includes(p.id),
          ).length;
          const newTotal = Math.max(0, oldData.total - countToRemove); // Better accuracy than just substracting ids.length if not all are here
          queryClient.setQueryData(key, {
            ...oldData,
            products: oldData.products.filter((p) => !ids.includes(p.id)),
            pagination: {
              ...oldData.pagination,
              total: newTotal,
            },
            total: newTotal,
          });
        }
      });
      return { queries };
    },
    onSuccess: () => {
      // Reconcile tab counts / pagination totals with the server.
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: () => toast.error("Failed to delete products"),
  });
};

// There is deliberately no bulk status-update hook. One request covering many
// ids cannot carry each product's own fields, so every product it touched lost
// its category (item 21 in docs/API-FIXES-REQUIRED.md). Delete is the only bulk
// action; status changes go through useUpdateProductStatus one product at a
// time, which resends the full product payload.
