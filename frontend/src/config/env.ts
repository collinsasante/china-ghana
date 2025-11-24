/**
 * Environment Configuration
 * All environment variables are prefixed with VITE_ to be accessible in the browser
 */

export const config = {
  // Airtable Configuration
  airtable: {
    apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || '',
    baseId: import.meta.env.VITE_AIRTABLE_BASE_ID || '',
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
  },

  // App Configuration
  app: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
};

// Validation function to check if all required env vars are set
export function validateConfig(): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!config.airtable.apiKey) missing.push('VITE_AIRTABLE_API_KEY');
  if (!config.airtable.baseId) missing.push('VITE_AIRTABLE_BASE_ID');
  if (!config.cloudinary.cloudName) missing.push('VITE_CLOUDINARY_CLOUD_NAME');
  if (!config.cloudinary.uploadPreset) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');

  return {
    isValid: missing.length === 0,
    missing,
  };
}
