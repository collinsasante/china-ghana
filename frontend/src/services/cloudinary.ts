import { config } from '../config/env';

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImage(
  file: File,
  folder: string = 'afreq',
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.cloudinary.uploadPreset);
  formData.append('folder', folder);
  formData.append('cloud_name', config.cloudinary.cloudName);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`);
    xhr.send(formData);
  });
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleImages(
  files: File[],
  folder: string = 'afreq',
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse[]> {
  const uploads = files.map((file, index) =>
    uploadImage(file, folder, (progress) => {
      if (onProgress) {
        onProgress(index, progress);
      }
    })
  );

  return Promise.all(uploads);
}

/**
 * Upload images organized by date
 * For China Team bulk upload feature
 */
export async function uploadBulkImages(
  files: File[],
  date: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse[]> {
  const folder = `afreq/${date}`;
  return uploadMultipleImages(files, folder, onProgress);
}

/**
 * Generate Cloudinary URL with transformations
 */
export function getImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  }
): string {
  const { cloudName } = config.cloudinary;
  const transformations: string[] = [];

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);

  const transformString = transformations.length > 0 ? transformations.join(',') + '/' : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
}

/**
 * Get thumbnail URL for an image
 */
export function getThumbnailUrl(publicId: string, size: number = 200): string {
  return getImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Delete an image from Cloudinary (requires API key and secret)
 * Note: This should ideally be done from a backend server
 */
export async function deleteImage(_publicId: string): Promise<void> {
  // This would require the API secret which should not be exposed in the frontend
  // Implement this on a backend server instead
  throw new Error('Delete operation must be performed from backend');
}
