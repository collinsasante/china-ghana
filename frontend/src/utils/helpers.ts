import type { ShipmentStatus } from '../types/index';

/**
 * Get status label for display
 */
export function getStatusLabel(status: ShipmentStatus): string {
  const labels: Record<ShipmentStatus, string> = {
    china_warehouse: 'At China Warehouse',
    in_transit: 'In Transit',
    arrived_ghana: 'Arrived Ghana',
    ready_for_pickup: 'Ready for Pickup',
    delivered: 'Delivered',
    picked_up: 'Picked Up',
  };

  return labels[status];
}

/**
 * Get status badge class for Bootstrap badge styling
 */
export function getStatusBadgeClass(status: ShipmentStatus): string {
  const classes: Record<ShipmentStatus, string> = {
    china_warehouse: 'badge-light-info',
    in_transit: 'badge-light-primary',
    arrived_ghana: 'badge-light-warning',
    ready_for_pickup: 'badge-light-success',
    delivered: 'badge-light-success',
    picked_up: 'badge-light-success',
  };

  return classes[status];
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate tracking number
 */
export function generateTrackingNumber(): string {
  const prefix = 'AFQ';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString().slice(2, 6);
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
