# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image storage in the AFREQ Delivery Tracking System.

## 📋 Table of Contents

1. [Create Cloudinary Account](#create-cloudinary-account)
2. [Get API Credentials](#get-api-credentials)
3. [Create Upload Preset](#create-upload-preset)
4. [Configure Application](#configure-application)
5. [Test Upload](#test-upload)

---

## 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Fill in your details or sign up with Google/GitHub
4. Verify your email
5. Complete the onboarding (select "Developer" as your role)

**Free Tier Includes:**
- 25 GB storage
- 25 GB bandwidth/month
- Unlimited transformations
- Perfect for development and small production apps!

---

## 2. Get API Credentials

1. After logging in, go to your **Dashboard**
2. You'll see your credentials in the "Account Details" section:

```
Cloud Name: your_cloud_name
API Key: 123456789012345
API Secret: *********************  (keep this secret!)
```

3. **Copy these values** - you'll need them for configuration

---

## 3. Create Upload Preset

Upload presets define settings for your uploads (folder structure, transformations, etc.)

### Steps:

1. Go to **Settings** (gear icon in top right)
2. Click **Upload** tab
3. Scroll down to **Upload presets**
4. Click **Add upload preset**

### Configuration:

**Preset Name:** `afreq_uploads`

**Signing Mode:**
- Select **Unsigned** (allows uploads from browser without API secret)

**Folder:**
- Leave empty or set to `afreq/` (we'll set folders dynamically in code)

**Access Mode:**
- Select **Public** (images will be publicly accessible)

**Allowed formats:**
- `jpg, png, jpeg, webp, heic`

**Maximum file size:**
- `10 MB` (adjust as needed)

**Transformations (Optional):**
- Auto orientation: **Yes**
- Auto tagging: **Yes** (AI-powered tags)

5. Click **Save**

6. **Copy the preset name** (e.g., `afreq_uploads`)

---

## 4. Configure Application

1. Open `/Users/breezyyy/Downloads/Afreq/frontend/.env`

2. Add your Cloudinary credentials:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=afreq_uploads
VITE_CLOUDINARY_API_KEY=123456789012345
```

3. Save the file

4. Restart the dev server:
```bash
npm run dev
```

---

## 5. Test Upload

### Quick Test with Browser Console

1. Open your app: `http://localhost:5174`
2. Open DevTools Console (F12)
3. Run this test code:

```javascript
// Create a test file (you can skip this and use a real file)
const testUpload = async () => {
  const formData = new FormData();

  // You'd normally get this from an <input type="file">
  // For now, let's just log the config
  console.log('Cloudinary Config:', {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  });
};

testUpload();
```

### Full Upload Test

Create a simple test component to upload an image:

```tsx
import { uploadImage } from './services/cloudinary';

function TestUpload() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImage(file, 'test');
      console.log('Upload successful!', result);
      alert('Image uploaded: ' + result.secure_url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleUpload} />
    </div>
  );
}
```

---

## 📁 Folder Structure

The app automatically organizes uploads:

```
afreq/
├── 2025-01-15/          # Date folder
│   └── CONT-2025-001/   # Container number
│       ├── item1.jpg
│       ├── item2.jpg
│       └── item3.jpg
├── test/                # Test uploads
└── general/             # General uploads
```

**Bulk Upload Example:**
```typescript
import { uploadBulkImages } from './services/cloudinary';

const files = [...]; // Array of File objects
const date = '2025-01-15';
const containerNumber = 'CONT-2025-001';

const results = await uploadBulkImages(files, date, containerNumber, (fileIndex, progress) => {
  console.log(`File ${fileIndex}: ${progress.percentage}%`);
});
```

---

## 🎨 Image Transformations

Cloudinary provides powerful on-the-fly transformations:

### Get Thumbnail
```typescript
import { getThumbnailUrl } from './services/cloudinary';

const thumbnailUrl = getThumbnailUrl(publicId, 200); // 200x200 thumbnail
```

### Custom Transformations
```typescript
import { getImageUrl } from './services/cloudinary';

const url = getImageUrl(publicId, {
  width: 800,
  height: 600,
  crop: 'fill',
  quality: 'auto',
  format: 'webp',
});
```

**Available Options:**
- `width`: Image width
- `height`: Image height
- `crop`: `fill`, `fit`, `scale`, `thumb`
- `quality`: `auto` or 1-100
- `format`: `auto`, `jpg`, `png`, `webp`

---

## 🔐 Security Best Practices

### DO:
✅ Use unsigned upload presets for browser uploads
✅ Set file size limits
✅ Restrict allowed formats
✅ Use folders to organize images
✅ Keep API secret on backend only

### DON'T:
❌ Never expose API secret in frontend code
❌ Don't allow unlimited file sizes
❌ Don't skip format validation
❌ Don't upload sensitive data without encryption

---

## 📊 Monitoring Usage

1. Go to Cloudinary Dashboard
2. Check **Usage** tab
3. Monitor:
   - Storage used
   - Bandwidth used
   - Number of transformations
   - API requests

**Free Tier Limits:**
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: Unlimited
- Credits: 25 units/month

---

## 🆘 Troubleshooting

### Upload fails with CORS error
**Solution:** Check upload preset is set to "Unsigned"

### "Invalid upload preset" error
**Solution:**
- Verify preset name matches exactly
- Check preset is saved in Cloudinary dashboard

### "File size too large" error
**Solution:**
- Check file size limit in upload preset
- Compress images before upload

### Images not displaying
**Solution:**
- Verify `secure_url` from upload response
- Check image format is supported
- Ensure image is public (not private)

### Slow uploads
**Solution:**
- Use progress callback to show upload status
- Consider image compression
- Check internet connection

---

## 🚀 Advanced Features

### Auto-Tagging
Enable AI-powered automatic tagging in upload preset:
- Settings → Upload → Upload Preset → Auto Tagging

### Face Detection
For future features like user avatars:
```typescript
const url = getImageUrl(publicId, {
  width: 200,
  height: 200,
  crop: 'thumb',
  gravity: 'face', // Centers on detected faces
});
```

### Responsive Images
Generate multiple sizes:
```typescript
const sizes = [400, 800, 1200];
const urls = sizes.map(size =>
  getImageUrl(publicId, { width: size, quality: 'auto' })
);
```

---

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [DAM (Digital Asset Management)](https://cloudinary.com/documentation/dam)

---

## 💡 Pro Tips

1. **Use transformations** instead of uploading multiple sizes
2. **Enable auto-format** to serve WebP to supported browsers
3. **Use quality: 'auto'** for automatic optimization
4. **Organize with folders** for easy management
5. **Set up webhooks** for upload notifications (advanced)

---

## Next Steps

After setup:
1. Test image upload with the test component
2. Verify images appear in Cloudinary Media Library
3. Check folder structure is correct
4. Test image transformations
5. Integrate bulk upload in China Team module

Ready to build the bulk upload interface! 🎉
