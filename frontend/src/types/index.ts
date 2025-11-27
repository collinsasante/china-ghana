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

  // Photos
  photos: string[];

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

  currency: 'USD' | 'GHS';
  status: 'pending' | 'paid' | 'overdue';

  createdAt: string;
  dueDate: string;
  paidAt?: string;
}

export interface SupportRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: SupportRequestType;
  subject: string;
  description: string;
  relatedTrackingNumbers?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
}

export interface Container {
  id: string;
  containerNumber: string;
  receivingDate: string;
  expectedArrivalGhana: string;
  actualArrivalGhana?: string;
  status: ShipmentStatus;
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
