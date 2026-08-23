export type UserRole = 'CUSTOMER' | 'STORE_OWNER' | 'ADMIN';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  /** Short marketing line shown on the category page header. */
  tagline: string;
  description?: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  cover: string;
  location: string;
  rating: number;
  deliveryTime: string;
  description: string;
  phone?: string;
  email?: string;
  isVerified?: boolean;
  productCount?: number;
  totalSales?: number;
}

export interface StoreProductListing {
  storeId: string;
  storeName: string;
  storeSlug: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  rating: number;
  deliveryTime: string;
  available: boolean;
  expiresAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  /** Category slug — see `categories`. */
  category: string;
  categoryName?: string;
  brand?: string;
  /** Store display name, denormalised for fast rendering on cards. */
  store: string;
  storeId: string;
  storeSlug: string;
  image: string;
  gallery: string[];
  /** Current selling price in BDT. */
  price: number;
  /** Price before discount in BDT. Equal to `price` when there is no offer. */
  originalPrice: number;
  /** Whole-number percentage, 0 when there is no offer. */
  discount: number;
  rating: number;
  reviews: number;
  unit: string;
  description: string;
  tags: string[];
  available: boolean;
  popular: boolean;
  stock?: number;
  /** Multi-store price comparison listings */
  storeListings?: StoreProductListing[];
  bestDealStore?: string;
  maxSavings?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  store: string;
  storeId: string;
  unit: string;
  price: number;
  originalPrice: number;
  quantity: number;
  maxStock?: number;
}

export interface Address {
  id: string;
  userId?: string;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  area: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  address?: string;
  addresses?: Address[];
  createdAt: string;
  assignedStoreId?: string;
  assignedStoreName?: string;
}

export type SubscriptionStatus = 'none' | 'trial' | 'expired' | 'active';

export interface Subscription {
  status: SubscriptionStatus;
  /** ISO timestamp when the 1-day trial started. */
  trialStartedAt: string | null;
  /** ISO timestamp when the trial ends. */
  trialEndsAt: string | null;
  /** ISO timestamp of the demo paid subscription. */
  subscribedAt: string | null;
  pricePerMonth: number;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'cod' | 'card' | 'mobile';

export type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REFUNDED';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  area: string;
  note?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  changedBy?: string;
}

export interface StoreSubOrder {
  storeId: string;
  storeName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  status: OrderStatus;
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  items: CartItem[];
  storeOrders?: StoreSubOrder[];
  delivery: DeliveryDetails;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  couponCode?: string;
  couponDiscount?: number;
  total: number;
  placedAt: string;
  senderNumber?: string;
  transactionId?: string;
  paymentProofUrl?: string;
  statusHistory?: OrderStatusHistoryItem[];
}

export interface PaymentSubmission {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  method: 'bkash' | 'nagad' | 'rocket';
  amount: number;
  senderNumber: string;
  transactionId: string;
  proofUrl?: string;
  status: PaymentStatus;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type: 'order' | 'payment' | 'system' | 'promo';
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: 'order' | 'product' | 'announcement';
  isRead: boolean;
  createdAt: string;
}

export interface RecommendationItem {
  product: Product;
  score: number;
  reason: string;
  category: string;
}

export interface SmartBudgetResult {
  budget: number;
  items: (Product & { selectedStore: string; quantity: number })[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  remainingBudget: number;
  estimatedSavings: number;
  coverageRatio: number;
  explanation: string;
  storesInvolved: string[];
}

export type OptimizationMode =
  | 'cheapest'
  | 'single-store'
  | 'best-rated'
  | 'fastest'
  | 'balanced';

export interface StoreSwitchSuggestion {
  productName: string;
  fromStore: string;
  toStore: string;
  oldPrice: number;
  newPrice: number;
  savings: number;
}

export interface BasketOptimizationResult {
  mode: OptimizationMode;
  currentTotal: number;
  optimizedTotal: number;
  potentialSavings: number;
  currentDelivery: number;
  optimizedDelivery: number;
  recommendedItems: CartItem[];
  switches: StoreSwitchSuggestion[];
  explanation: string;
  participatingStores: string[];
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  status?: 'approved' | 'pending' | 'hidden';
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumOrder: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
  usageCount: number;
}

export type SortOption =
  | 'popular'
  | 'price-asc'
  | 'price-desc'
  | 'discount'
  | 'rating';
