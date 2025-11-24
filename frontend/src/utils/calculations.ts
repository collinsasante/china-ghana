/**
 * Calculate CBM (Cubic Meter) from dimensions
 * @param length - Length of the item
 * @param width - Width of the item
 * @param height - Height of the item
 * @param unit - Unit of measurement ('inches' or 'cm')
 * @returns CBM value
 */
export function calculateCBM(
  length: number,
  width: number,
  height: number,
  unit: 'inches' | 'cm'
): number {
  if (length <= 0 || width <= 0 || height <= 0) {
    return 0;
  }

  const volume = length * width * height;

  // CBM formula based on unit
  const cbm = unit === 'cm'
    ? volume / 1_000_000  // cm³ to m³
    : volume / 61_024;     // in³ to m³

  return Number(cbm.toFixed(6));
}

/**
 * Convert between weight units
 */
export function convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return value;

  if (from === 'kg' && to === 'lbs') {
    return Number((value * 2.20462).toFixed(2));
  }

  // lbs to kg
  return Number((value / 2.20462).toFixed(2));
}

/**
 * Convert between dimension units
 */
export function convertDimension(value: number, from: 'inches' | 'cm', to: 'inches' | 'cm'): number {
  if (from === to) return value;

  if (from === 'inches' && to === 'cm') {
    return Number((value * 2.54).toFixed(2));
  }

  // cm to inches
  return Number((value / 2.54).toFixed(2));
}

/**
 * Format currency in GHS (Ghanaian Cedis)
 */
export function formatCedis(amount: number): string {
  return `GH₵ ${amount.toFixed(2)}`;
}

/**
 * Format currency in USD
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
