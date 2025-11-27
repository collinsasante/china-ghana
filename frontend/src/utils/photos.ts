/**
 * Photo utility functions for handling ordered photo arrays
 */

export type Photo = string | { url: string; order: number };

/**
 * Sort photos by order number, maintaining upload sequence
 * Photos without order are placed at the end
 */
export function sortPhotosByOrder(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const orderA = typeof a === 'object' && a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b === 'object' && b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

/**
 * Extract URL from photo (handles both string and object formats)
 */
export function getPhotoUrl(photo: Photo): string {
  return typeof photo === 'string' ? photo : photo.url;
}

/**
 * Get the first photo URL from an array (after sorting by order)
 */
export function getFirstPhotoUrl(photos: Photo[]): string | undefined {
  if (!photos || photos.length === 0) return undefined;
  const sorted = sortPhotosByOrder(photos);
  return getPhotoUrl(sorted[0]);
}

/**
 * Convert photo array to ordered format
 * Adds order numbers to string photos based on array index
 */
export function convertToOrderedPhotos(photos: Photo[]): { url: string; order: number }[] {
  return photos.map((photo, index) => {
    if (typeof photo === 'string') {
      return { url: photo, order: index };
    }
    return photo;
  });
}

/**
 * Check if photos array contains multiple images (for grouping detection)
 */
export function hasMultiplePhotos(photos: Photo[]): boolean {
  return photos && photos.length > 1;
}
