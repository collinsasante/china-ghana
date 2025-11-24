# Troubleshooting Guide

## Common Issues and Solutions

### ✅ Fixed: Module Import Errors

**Issue:** `The requested module '/src/types/index.ts' does not provide an export named 'User'`

**Solution:** All type imports now use the `type` keyword and explicit path:
```typescript
// ✅ Correct
import type { User, UserRole } from '../types/index';

// ❌ Wrong
import { User, UserRole } from '../types';
```

**Files fixed:**
- `src/context/AuthContext.tsx`
- `src/components/common/ProtectedRoute.tsx`
- `src/utils/helpers.ts`

---

### ✅ Fixed: Missing Dependencies

**Issue:** `Failed to resolve import "@popperjs/core"`

**Solution:** Installed required dependencies:
```bash
npm install @popperjs/core bootstrap
```

These are required by the Keen template's JavaScript bundles.

---

### Port Already in Use

**Issue:** Port 5173 is in use

**Solution:** Vite automatically tries the next available port (5174, 5175, etc.). No action needed.

---

### Styles Not Loading

**Issue:** Page looks unstyled

**Check:**
1. Ensure `index.html` has these lines:
```html
<link href="/src/assets/plugins/global/plugins.bundle.css" rel="stylesheet" />
<link href="/src/assets/css/style.bundle.css" rel="stylesheet" />
```

2. Verify assets exist:
```bash
ls frontend/src/assets/css/style.bundle.css
ls frontend/src/assets/plugins/global/plugins.bundle.css
```

---

### TypeScript Errors

**Issue:** Type errors in IDE

**Solution:**
1. Restart TypeScript server in your IDE
2. Ensure all imports use `type` keyword for type-only imports
3. Check `tsconfig.json` is properly configured

---

### React Hot Reload Not Working

**Issue:** Changes don't reflect in browser

**Solution:**
1. Check browser console for errors
2. Restart dev server: `npm run dev`
3. Clear browser cache
4. Ensure files are saved

---

### Authentication Not Working

**Issue:** Can't login

**Current State:** Authentication is mock/demo only. Any email/password combination works for these demo accounts:
- `customer@afreq.com`
- `china@afreq.com`
- `ghana@afreq.com`
- `admin@afreq.com`

**Future:** Replace with real API in `src/context/AuthContext.tsx`

---

### Route Not Found

**Issue:** 404 or blank page

**Check:**
1. Is route defined in `src/App.tsx`?
2. Is component imported correctly?
3. Is route protected and user has correct role?
4. Check browser console for routing errors

---

### Build Errors

**Issue:** `npm run build` fails

**Common Causes:**
1. **Unused imports:** Remove unused imports
2. **Type errors:** Fix TypeScript errors
3. **Missing files:** Ensure all imported files exist

**Solution:**
```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

### Assets Not Loading in Production

**Issue:** Images/CSS missing after build

**Solution:**
Ensure asset paths use correct format:
```typescript
// ✅ Correct
<img src="/src/assets/media/logos/logo.png" />

// ❌ Wrong
<img src="./assets/media/logos/logo.png" />
```

---

## Development Tips

### Quick Fixes

**Clear everything and restart:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

**Check for console errors:**
Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for failed requests
- Sources tab for module loading issues

---

### Debugging TypeScript

**Enable verbose TypeScript errors:**
```bash
# In package.json, modify build script:
"build": "tsc -b --verbose && vite build"
```

**Check TypeScript version:**
```bash
npx tsc --version  # Should be ~5.9.3
```

---

### VSCode Issues

**ESLint not working:**
1. Install ESLint extension
2. Reload window: Cmd+Shift+P → "Reload Window"
3. Check `.vscode/settings.json` if you have custom settings

**IntelliSense not working:**
1. Cmd+Shift+P → "TypeScript: Restart TS Server"
2. Check `tsconfig.json` includes your files

---

## Getting Help

1. **Check existing documentation:**
   - [README.md](README.md)
   - [QUICKSTART.md](QUICKSTART.md)
   - [ROADMAP.md](ROADMAP.md)
   - [CLAUDE.md](CLAUDE.md)

2. **Check browser console** for specific errors

3. **Verify dependencies:**
   ```bash
   npm list react react-dom react-router-dom @popperjs/core bootstrap
   ```

4. **Check file structure:**
   ```bash
   tree -L 3 frontend/src
   ```

---

## Clean Slate Reset

If all else fails, start fresh:

```bash
# 1. Backup your changes (if any)
git status  # Check what you've changed

# 2. Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. Restart dev server
npm run dev
```

---

## Known Limitations

1. **Authentication:** Currently mock/demo only - needs backend integration
2. **Data:** All data is hardcoded - needs API integration
3. **File uploads:** Not implemented - needs backend storage
4. **Email:** Support requests don't send emails yet

These will be addressed in later development phases. See [ROADMAP.md](ROADMAP.md) for implementation plan.
