import api from "@/lib/axios";
import axios from "axios";

export interface Owner {
  id: string;
  _id?: string;
  name: string;
  email: string;
  activeRole: string;
  country?: string;
  state?: string;
  phone?: string;
  address?: string;
  roles?: string[];
  isFollowing?: boolean;
  rating?: number;
  image?: string;
}


export interface Farmer {
  id: string;
  name: string;
  businessName?: string;
  phone?: string;
  country?: string;
  state?: string;
  address?: string;
  approvalStatus?: string;
  image?: string;
}

export interface ReviewSummary {
  count: number;
  averageRating: number;
}

export interface BidSummary {
  count: number;
  leadingBid?: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    buyer: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface LocalTransport {
  required: boolean;
  fee: number;
  from: string;
  to: string;
  note?: string;
}

export interface ApiProduct {
  _id?: string;
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categories: string[];
  category?: string;
  subcategory?: string;
  images: string[];
  videos?: string[];
  farmerId?: string;
  status: "available" | "out_of_stock" | "discontinued";
  createdAt?: string;
  updatedAt?: string;
  stock?: string;
  rating?: string;
  reviews?: number;
  unit?: string;
  unitWeightKg?: number | null;
  discount?: number;
  localTransport?: LocalTransport;
  owner?: Owner;
  farmer?: Farmer;
  reviewSummary?: ReviewSummary;
  bidSummary?: BidSummary;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentReviews?: any[];
  isWishlisted?: boolean;
  wishlisted?: boolean;
}

// ... (Product, PaginationMeta, ProductsResponse, SearchFilters interfaces remain the same)
export interface Product extends ApiProduct {
  checked: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ProductsResponse {
  products: ApiProduct[];
  pagination: PaginationMeta;
  total: number;
  page: number;
  limit: number;
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  ordersCount: number;
  totalQuantity: number;
  totalAmount: number;
  price: number;
  unit: string;
  image?: string;
  images?: string[];
  wishlisted?: boolean;
  isWishlisted?: boolean;
}

export interface TopSellingResponse {
  success: boolean;
  data: TopSellingProduct[];
}

export interface RecommendationProduct {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  owner?: Owner;
  farmer?: Farmer;
  quantity: number;
  unit?: string;
  wishlisted?: boolean;
  isWishlisted?: boolean;
  createdAt?: string;
}

export interface WishlistItem {
  _id: string;
  product: ApiProduct;
}

export interface RecommendationsResponse {
  success: boolean;
  data: ApiProduct[] | RecommendationProduct[];
}

export interface SearchFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "available" | "out_of_stock" | "discontinued";
  category?: string;
  farmer?: string;
  owner?: string;
  minPrice?: number;
  maxPrice?: number;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  full?: boolean;
  includeMedia?: boolean;
  year?: string;
  month?: string;
}

export interface LocalTransportData {
  required: boolean;
  fee: number;
  from: string;
  to: string;
  note?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  discount?: number;
  unit: string;
  unitWeightKg?: number | null;
  category: string;
  subcategory: string;
  categories: string[];
  images: string[];
  videos?: string[];
  farmer: string;
  localTransport?: LocalTransportData;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  images?: string[];
  videos?: string[];
}

export interface Bidder {
  id: string;
  name: string;
  avatar?: string;
  amount: number;
  timestamp?: string;
  isLeading?: boolean;
}

export interface BidRequest {
  amount: number;
  message: string;
}

export interface BidResponse {
  success: boolean;
  message: string;
  bid?: {
    id: string;
    amount: number;
    createdAt: string;
  };
}

// Handle API errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleApiError = (error: any, operation: string) => {
  console.error(`❌ Error ${operation}:`, error);

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Session expired or unauthorized");
      }
      throw new Error("Authentication failed");
    }

    if (error.response?.status === 403) {
      throw new Error("Permission denied");
    }

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
  }

  throw new Error(`Failed to ${operation}`);
};

// Map backend product to frontend format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBackendToFrontendProduct = (backendProduct: any): ApiProduct => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapOwner = (owner: any): Owner | undefined => {
    if (!owner) return undefined;
    return {
      id: owner._id || owner.id,
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      activeRole: owner.activeRole,
      country: owner.country,
      state: owner.state,
      phone: owner.phone,
      address: owner.address,
      roles: owner.roles,
      isFollowing: owner.isFollowing,
    };

  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFarmer = (farmer: any): Farmer | undefined => {
    if (!farmer) return undefined;
    return {
      id: farmer._id || farmer.id,
      name: farmer.name,
      businessName: farmer.businessName,
      phone: farmer.phone,
      country: farmer.country,
      state: farmer.state,
      address: farmer.address,
      approvalStatus: farmer.approvalStatus,
    };
  };

  return {
    id: backendProduct._id || backendProduct.id,
    name: backendProduct.name || "",
    description: backendProduct.description || "",
    price: backendProduct.price || 0,
    quantity: backendProduct.quantity || 0,
    categories: backendProduct.categories || [],
    images: backendProduct.images || [],
    videos: backendProduct.videos || [],
    farmerId:
      backendProduct.owner?._id ||
      backendProduct.farmer?._id ||
      backendProduct.farmerId,
    status:
      backendProduct.status === "active"
        ? "available"
        : backendProduct.status || "available",
    createdAt: backendProduct.createdAt,
    updatedAt: backendProduct.updatedAt,
    stock: backendProduct.quantity?.toString() || "0",
    rating: backendProduct.reviewSummary?.averageRating?.toString() || "0",
    reviews: backendProduct.reviewSummary?.count || 0,
    unit: backendProduct.unit || "",
    unitWeightKg: backendProduct.unitWeightKg ?? null,
    discount: backendProduct.discount,
    category: backendProduct.category,
    subcategory: backendProduct.subcategory,
    localTransport: backendProduct.localTransport,
    owner: mapOwner(backendProduct.owner),
    farmer: mapFarmer(backendProduct.farmer),
    reviewSummary: backendProduct.reviewSummary,
    bidSummary: backendProduct.bidSummary,
    recentReviews: backendProduct.recentReviews,
    isWishlisted: backendProduct.isWishlisted ?? backendProduct.wishlisted,
  };
};

export const productService = {
  // GET /api/products - Get products with filters
  getProducts: async (
    filters: SearchFilters = {},
  ): Promise<ProductsResponse> => {
    try {
      console.log("🚀 Fetching products with filters:", filters);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...filters,
      };

      const response = await api.get("/api/products", {
        params,
      });

      console.log("✅ Products fetched successfully:", response.data);

      let mappedProducts: ApiProduct[] = [];
      const data = response.data.data || [];
      const pagination = response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
      };

      if (Array.isArray(data)) {
        mappedProducts = data.map(mapBackendToFrontendProduct);
      }

      return {
        products: mappedProducts,
        pagination,
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
      };
    } catch (error) {
      return handleApiError(error, "fetch products");
    }
  },

  // GET /api/products/:id - Get single product
  getProduct: async (id: string): Promise<ApiProduct> => {
    try {
      console.log(`🚀 Fetching product details for ${id}`);

      const response = await api.get(`/api/products/${id}`);

      console.log("✅ Product details fetched:", response.data);
      const productData =
        response.data.data || response.data.product || response.data;
      return mapBackendToFrontendProduct(productData);
    } catch (error) {
      return handleApiError(error, "fetch product details");
    }
  },

  // GET /api/product/:id/similar - Get similar products
  getSimilarProducts: async (id: string): Promise<ApiProduct[]> => {
    try {
      console.log(`🚀 Fetching similar products for ${id}`);

      const response = await api.get(`/api/products/${id}/similar`);

      console.log("✅ Similar products fetched:", response.data);
      let mappedProducts: ApiProduct[] = [];
      const data = response.data.data || response.data.products || response.data || [];
      
      if (Array.isArray(data)) {
        mappedProducts = data.map(mapBackendToFrontendProduct);
      }
      
      return mappedProducts;
    } catch (error) {
      console.error("Failed to fetch similar products:", error);
      return []; // Return empty array to not break UI on error
    }
  },

  // Get Pending Products. `/api/farmers/products/pending` never existed (404) —
  // `/api/products/pending` is the only path. It currently answers with an empty
  // array plus a message: products are available / out_of_stock / discontinued,
  // so nothing is ever pending until a pending status is introduced.
  getPendingProducts: async (): Promise<ProductsResponse> => {
    try {
      const response = await api.get("/api/products/pending");
      return response.data;
    } catch (error) {
      console.error("Error fetching pending products:", error);
      throw error;
    }
  },

  // Get Top Selling Products
  getTopSellingProducts: async (): Promise<TopSellingResponse> => {
    try {
      const response = await api.get("/api/buyers/top-selling");
      return response.data;
    } catch (error) {
      console.error("Error fetching top selling products:", error);
      throw error;
    }
  },

  // Get Recommendations
  getRecommendations: async (): Promise<RecommendationsResponse> => {
    try {
      const response = await api.get("/api/buyers/recommendations");
      return response.data;
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw error;
    }
  },

  // Get Seller Recommendations
  getSellerRecommendations: async (
    sellerId: string,
  ): Promise<RecommendationsResponse> => {
    try {
      const response = await api.get(`/api/sellers/${sellerId}/recommendations`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching recommendations for seller ${sellerId}:`, error);
      throw error;
    }
  },

  // GET /api/products/out-of-stock - Get out-of-stock products
  getOutOfStockProducts: async (
    filters: Omit<SearchFilters, "status"> = {},
  ): Promise<ProductsResponse> => {
    try {
      console.log("Fetching out-of-stock products:", filters);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...filters,
      };

      const response = await api.get("/api/products/out-of-stock", {
        params,
      });

//       {
//   "fleetName": "North Route Fleet",
//   "fleetNumber": "ABC-123",
//   "iot": "IOT-TRK-001",
//   "model": "Volvo",
//   "size": "20 tons",
//   "price": 250000,
//   "priceNegotiation": true,
//   "images": [
//     "https://example.com/truck1.jpg"
//   ],
//   "fleetDescription": "Primary interstate fleet",
//   "fleetStates": "Active",
//   "route": {
//     "fromState": "Kaduna",
//     "toState": "Lagos"
//   }
// }


      console.log("✅ Out-of-stock products fetched:", response.data);

      let mappedProducts: ApiProduct[] = [];
      const data =
        response.data.data || response.data.products || response.data;
      const pagination = response.data.pagination || {
        page: 1,
        limit: 10,
        total: Array.isArray(data) ? data.length : 0,
      };

      if (Array.isArray(data)) {
        mappedProducts = data.map(mapBackendToFrontendProduct);
      }

      return {
        products: mappedProducts,
        pagination,
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
      };
    } catch (error) {
      return handleApiError(error, "fetch out-of-stock products");
    }
  },

  // POST /api/products - Create product
  createProduct: async (
    productData: CreateProductData,
  ): Promise<ApiProduct> => {
    try {
      console.log("🚀 Creating product:", productData);

      const response = await api.post("/api/products", productData);

      console.log("✅ Product created:", response.data);
      return mapBackendToFrontendProduct(
        response.data.product || response.data,
      );
    } catch (error) {
      return handleApiError(error, "create product");
    }
  },

  // PATCH /api/products/:id/status - Update product status
  updateProductStatus: async (
    id: string,
    status: "available" | "out_of_stock" | "discontinued",
  ): Promise<ApiProduct> => {
    try {
      console.log(`🚀 Updating product ${id} status to:`, status);

      // Changed to PATCH as requested
      const response = await api.patch(`/api/products/${id}`, {
        status,
      });

      console.log("✅ Product status updated:", response.data);
      return mapBackendToFrontendProduct(
        response.data.product || response.data,
      );
    } catch (error) {
      return handleApiError(error, "update product status");
    }
  },

  // PUT /api/products/:id - Update product (Full Update)
  updateProduct: async (
    id: string,
    data: UpdateProductData,
  ): Promise<ApiProduct> => {
    try {
      console.log(`🚀 Updating product ${id} (PUT):`, data);

      const response = await api.put(`/api/products/${id}`, data);

      console.log("✅ Product updated:", response.data);
      const updated =
        response.data.data || response.data.product || response.data;
      return mapBackendToFrontendProduct(updated);
    } catch (error) {
      return handleApiError(error, "update product");
    }
  },

  // DELETE /api/products/:id - Delete product
  deleteProduct: async (id: string): Promise<void> => {
    try {
      console.log(`🚀 Deleting product ${id}`);

      await api.delete(`/api/products/${id}`);

      console.log("✅ Product deleted successfully");
    } catch (error) {
      return handleApiError(error, "delete product");
    }
  },

  // POST /api/products/bulk/delete
  deleteMultipleProducts: async (ids: string[]): Promise<void> => {
    try {
      console.log(`🚀 Bulk deleting ${ids.length} products`);

      await api.post("/api/products/bulk/delete", { productIds: ids });

      console.log("✅ All products deleted successfully");
    } catch (error) {
      return handleApiError(error, "bulk delete products");
    }
  },

  // PATCH /api/products/bulk/status
  // The backend only registers PATCH here (PUT and POST return 405), and the id
  // array must be keyed `productIds` — matching bulk/delete. `products` 400s.
  updateMultipleProductsStatus: async (
    ids: string[],
    status: "available" | "out_of_stock" | "discontinued",
  ): Promise<void> => {
    try {
      await api.patch("/api/products/bulk/status", { productIds: ids, status });
    } catch (error) {
      return handleApiError(error, "bulk update product status");
    }
  },

  // GET /api/buyers/biddings - Get all buyers bidding on a product
  getBidders: async (productId: string): Promise<Bidder[]> => {
    try {
      console.log(`🚀 Fetching bidders for product ${productId}`);
      // Assuming productId is passed as a query param or part of the path.
      // The prompt says: GET /api/buyers/biddings
      // Be safer to send it as query param
      const response = await api.get("/api/buyers/biddings", {
        params: { productId },
      });

      console.log("✅ Bidders fetched:", response.data);
      return response.data.data || response.data || [];
    } catch (error) {
      // Return empty list instead of throwing to avoid breaking the UI for this section
      console.error("Failed to fetch bidders", error);
      return [];
    }
  },

  // GET /api/buyers/biddings/won - Get winning/leading bidder
  getWinningBidder: async (productId: string): Promise<Bidder | null> => {
    try {
      console.log(`🚀 Fetching winning bidder for product ${productId}`);
      const response = await api.get("/api/buyers/biddings/won", {
        params: { productId },
      });

      console.log("✅ Winning bidder fetched:", response.data);
      return response.data.data || response.data || null;
    } catch {
      // It's okay if there is no winner yet
      return null;
    }
  },

  // POST /api/buyers/products/:id/bid - Place a bid
  placeBid: async (
    productId: string,
    data: BidRequest,
  ): Promise<BidResponse> => {
    try {
      console.log(`🚀 Placing bid for product ${productId}:`, data);
      const response = await api.post(
        `/api/buyers/products/${productId}/bid`,
        data,
      );

      console.log("✅ Bid placed successfully:", response.data);
      return {
        success: true,
        message: response.data.message || "Bid placed successfully",
        bid: response.data.bid,
      };
    } catch (error) {
      return handleApiError(error, "place bid");
    }
  },
};
