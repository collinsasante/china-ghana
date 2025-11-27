export type UserRole = 'customer' | 'china_team' | 'ghana_team' | 'admin';

export type ShipmentStatus =
  | 'china_warehouse'
  | 'in_transit'
  | 'arrived_ghana'
  | 'ready_for_pickup'
  | 'delivered'
  | 'picked_up';

export type SupportRequestType = 'missing_item' | 'wrong_delivery' | 'general';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  password?: string; // User's password (temp password for Ghana team created accounts)
  isFirstLogin?: boolean; // Flag for first-time login (Ghana team created accounts)
  passwordChangedAt?: string; // Timestamp of last password change
}

export interface Item {
  id: string;
  name?: string; // Optional - item name
  trackingNumber: string;
  customerId: string;
  containerNumber?: string; // Optional - assigned when shipping to Ghana
  receivingDate: string;
  quantity?: number; // Number of items with same tracking number (default: 1)

  // Dimensions
  length: number;
  width: number;
  height: number;
  dimensionUnit: 'inches' | 'cm';
  cbm: number; // Auto-calculated

  // Shipping Method
  shippingMethod: 'sea' | 'air';

  // Weight (only for air shipping)
  weight?: number;
  weightUnit?: 'kg' | 'lbs';

  // Pricing (auto-calculated based on CBM for sea, weight for air)
  costUSD: number;
  costCedis: number;

  // Status
  status: ShipmentStatus;

  // Photos - can be simple strings (legacy) or objects with order
  photos: (string | { url: string; order: number })[];

  // Packaging
  cartonNumber?: string;

  // Flags
  isDamaged: boolean;
  isMissing: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  message: string; // Alias for content (used in customer pages)
  type: string; // Type: important, update, general, etc.
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  items: {
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  // Charges
  shippingCharge: number;
  handlingCharge: number;
  storageCharge: number;
  pickupCharge: number;

  subtotal: number;
  tax: number;
  total: number;
  totalAmount: number; // Alias for total (used in customer pages)

  currency: 'USD' | 'GHS';
  status: 'pending' | 'paid' | 'overdue';
  description: string; // Invoice description

  createdAt: string;
  issueDate: string; // Alias for createdAt
  dueDate: string;
  paidAt?: string;
  notes?: string; // Optional invoice notes
}

export interface SupportRequest {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  type?: SupportRequestType;
  subject: string;
  description: string;
  message: string; // Alias for description
  category: string; // Support category
  relatedTrackingNumbers?: string[];
  relatedTrackingNumber?: string; // Singular version (for forms)
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt?: string; // Last update timestamp
  resolvedAt?: string;
  adminResponse?: string; // Admin's response to the request
}

export interface Container {
  id: string;
  containerNumber: string;
  receivingDate: string;
  expectedArrivalGhana: string;
  estimatedArrival: string; // Alias for expectedArrivalGhana
  actualArrivalGhana?: string;
  status: ShipmentStatus;
  shippingMethod?: string; // sea or air
  departureDate?: string; // Departure date from China
  itemCount: number;
  photoFolderPath: string;
}

export interface BulkUploadFolder {
  date: string;
  containerNumber: string;
  path: string;
  photos: {
    id: string;
    filename: string;
    path: string;
    uploadedAt: string;
    hasItemData: boolean;
    itemId?: string;
  }[];
}
