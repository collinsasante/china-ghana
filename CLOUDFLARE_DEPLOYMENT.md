# Cloudflare Pages Deployment Guide

## Automatic Deployment from GitHub

Your AFREQ Delivery Tracking System is now configured for automatic deployment to Cloudflare Pages.

### Build Configuration

The following settings are automatically configured via `package.json` in the root:

- **Build Command**: `npm run build` (runs `cd frontend && npm install && npm run build`)
- **Build Output Directory**: `frontend/dist`
- **Node Version**: Latest (20.x recommended)

### Cloudflare Pages Dashboard Settings

If you need to manually configure in the Cloudflare Pages dashboard:

1. **Framework preset**: None (or Vite)
2. **Build command**: `npm run build`
3. **Build output directory**: `frontend/dist`
4. **Root directory**: Leave empty (or `/`)

### Environment Variables

You must add these environment variables in the Cloudflare Pages dashboard:

**Go to**: Your Project → Settings → Environment Variables

#### Required Variables:

```bash
# Airtable Configuration
VITE_AIRTABLE_API_KEY=your_airtable_api_key_here
VITE_AIRTABLE_BASE_ID=your_airtable_base_id_here

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset_here
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key_here
```

**Important**: Add these to **both** Production and Preview environments.

### Deployment Process

1. **Push to GitHub**: Any push to the `main` branch triggers automatic deployment
2. **Build Process**: Cloudflare Pages runs `npm run build`
3. **Deploy**: Built files from `frontend/dist` are deployed
4. **Live URL**: Your site will be available at `https://your-project.pages.dev`

### Troubleshooting

#### Build Fails with "Cannot find package.json"
- ✅ **Fixed**: Root `package.json` now present
- The build command now properly navigates to `frontend/` directory

#### Environment Variables Not Working
- Make sure all `VITE_*` variables are set in Cloudflare Pages dashboard
- Variables must be added to both Production and Preview environments
- Redeploy after adding environment variables

#### Build Succeeds but Site Shows Errors
- Check browser console for API errors
- Verify environment variables are correctly set
- Ensure Airtable and Cloudinary credentials are valid

### Manual Deployment

If you prefer manual deployment:

```bash
# Build locally
cd frontend
npm install
npm run build

# Deploy using Wrangler CLI
npx wrangler pages deploy dist --project-name=your-project-name
```

### Custom Domain

To add a custom domain:
1. Go to your project in Cloudflare Pages
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Follow the DNS configuration instructions

---

**Current Deployment Status**:
- Repository: https://github.com/collinsasante/china-ghana
- Branch: `main`
- Auto-deploy: ✅ Enabled
