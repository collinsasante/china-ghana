# Airtable Fields Setup Guide

This guide lists all the fields you need to add to your Airtable tables for the implemented features to work correctly.

## 1. Users Table

### Required Fields for Password Reset Feature

| Field Name | Field Type | Description | Required |
|------------|-----------|-------------|----------|
| `isFirstLogin` | Checkbox | Flags accounts created by Ghana team that need password reset | ✅ Yes |
| `passwordChangedAt` | Date | Timestamp of when user last changed their password | ✅ Yes |
| `password` | Single line text | User's password (currently plain text - see security note) | ✅ Yes |

**Setup Instructions:**
1. Go to your Users table in Airtable
2. Add `isFirstLogin` field:
   - Click "+" to add field
   - Select "Checkbox" type
   - Name it: `isFirstLogin`
   - Set default value: unchecked/false

3. Add `passwordChangedAt` field:
   - Click "+" to add field
   - Select "Date" type
   - Name it: `passwordChangedAt`
   - Enable "Include time" option

4. Add `password` field (if not exists):
   - Click "+" to add field
   - Select "Single line text" type
   - Name it: `password`

**For Ghana Team Created Accounts:**
- Check the `isFirstLogin` box for any user created by the Ghana team
- This will trigger the password reset modal on their first login

**⚠️ SECURITY WARNING:**
Currently, passwords are stored as plain text. **Before production deployment**, you MUST:
```bash
npm install bcryptjs @types/bcryptjs
```

Then update the `updateUserPassword()` function in `frontend/src/services/airtable.ts` to hash passwords:
```typescript
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(newPassword, 10);
// Store hashedPassword instead of plain text
```

---

## 2. Items Table

### Required Fields for Image Ordering Feature

The photo field changes are **automatic** - the app now sends photo data as:
```json
[
  { "url": "https://cloudinary.com/photo1.jpg" },
  { "url": "https://cloudinary.com/photo2.jpg" }
]
```

**Note:** Airtable's Attachment field automatically handles the new format. The `order` metadata is used client-side only and gets stripped before saving to Airtable.

**No manual field changes required** - your existing `photos` field (Attachment type) will work as-is.

---

## 3. Support Requests Table

### Required Fields (Should Already Exist)

| Field Name | Field Type | Description | Required |
|------------|-----------|-------------|----------|
| `customerId` | Link to Users | Customer who submitted the request | ✅ Yes |
| `subject` | Single line text | Brief subject of the request | ✅ Yes |
| `description` | Long text | Detailed description | ✅ Yes |
| `message` | Long text | Alias for description | ✅ Yes |
| `category` | Single select | Options: missing_item, wrong_delivery, general | ✅ Yes |
| `status` | Single select | Options: open, in_progress, resolved, closed | ✅ Yes |
| `relatedTrackingNumber` | Single line text | Optional tracking number reference | No |

### Fields That Should NOT Be Manually Created

These are **auto-generated** by Airtable:
- ❌ `createdAt` - Airtable creates this automatically (Created time field)
- ❌ `updatedAt` - Airtable creates this automatically (Last modified time field)

### Lookup/Formula Fields (Optional)

If you want to display customer info in the support request view:
- `customerName` - Lookup field from Users table → name
- `customerEmail` - Lookup field from Users table → email

---

## 4. Items Table - Cedis Display

### Required Fields

| Field Name | Field Type | Description | Required |
|------------|-----------|-------------|----------|
| `costUSD` | Number (Currency - USD) | Cost in US Dollars | ✅ Yes |
| `costCedis` | Number (Currency - GHS) | Cost in Ghana Cedis | ✅ Yes |

**Current Exchange Rate:** 1 USD = 15 GHS
- This is configured in `frontend/src/components/ghana-team/ItemDetailsModal.tsx` (line 57)
- The Ghana team sets prices, and cedis are auto-calculated

**Setup Instructions:**
1. Ensure both fields exist in your Items table
2. Set `costUSD` to Currency format with $ symbol
3. Set `costCedis` to Currency format (or Number with 2 decimal places)

---

## 5. Quick Setup Checklist

### For Password Reset Feature:
- [ ] Add `isFirstLogin` checkbox field to Users table
- [ ] Add `passwordChangedAt` date field to Users table
- [ ] Ensure `password` field exists in Users table
- [ ] Check `isFirstLogin` box for Ghana team created accounts
- [ ] ⚠️ **Before production:** Implement bcrypt password hashing

### For Support Requests:
- [ ] Verify all required fields exist in Support Requests table
- [ ] Ensure `category` has correct options: missing_item, wrong_delivery, general
- [ ] Ensure `status` has correct options: open, in_progress, resolved, closed
- [ ] Add `createdAt` as "Created time" field (if not exists)
- [ ] Add `updatedAt` as "Last modified time" field (if not exists)

### For Cedis Display:
- [ ] Verify `costUSD` field exists in Items table
- [ ] Verify `costCedis` field exists in Items table
- [ ] Both should be Number fields with 2 decimal places

### For Image Ordering:
- [ ] ✅ No changes needed - existing `photos` Attachment field works

---

## 6. Testing Your Setup

### Test Password Reset:
1. Create a test user in Airtable
2. Check the `isFirstLogin` box for that user
3. Log in with that user's credentials
4. Modal should appear forcing password change
5. Set new password
6. Verify `isFirstLogin` becomes unchecked
7. Verify `passwordChangedAt` is populated

### Test Support Requests:
1. Log in as a customer
2. Go to Support page
3. Submit a new support request
4. Check Airtable - request should appear with:
   - Correct customer linked
   - Status = "open"
   - Created time auto-populated
5. No 422 errors should occur

### Test Cedis Display:
1. Log in as Ghana team
2. Tag an item with costs
3. Enter USD amount
4. Cedis should auto-calculate (USD × 15)
5. View item in customer dashboard
6. Both USD and cedis should display

---

## 7. Common Issues & Solutions

### Issue: Support requests fail with 422 error
**Solution:**
- Don't manually create `createdAt` or `updatedAt` as regular fields
- Use Airtable's built-in "Created time" and "Last modified time" field types instead

### Issue: Password reset modal doesn't appear
**Solution:**
- Ensure `isFirstLogin` field exists and is a Checkbox type
- Verify the user has `isFirstLogin` checked in Airtable
- Check browser console for errors

### Issue: Photos don't preserve order
**Solution:**
- This is automatic - no Airtable changes needed
- The order is managed client-side
- Airtable only stores the URLs

### Issue: Cedis not displaying
**Solution:**
- Ensure `costCedis` field exists in Items table
- Verify Ghana team is setting both USD and cedis values
- Check that exchange rate is configured (line 57 in ItemDetailsModal.tsx)

---

## 8. Field Summary Table

| Table | Field Name | Type | Auto-Generated | Required |
|-------|-----------|------|----------------|----------|
| Users | isFirstLogin | Checkbox | No | Yes |
| Users | passwordChangedAt | Date | No | Yes |
| Users | password | Single line text | No | Yes |
| Items | costUSD | Number/Currency | No | Yes |
| Items | costCedis | Number/Currency | No | Yes |
| Items | photos | Attachment | No | Yes |
| Support Requests | customerId | Link to Users | No | Yes |
| Support Requests | subject | Single line text | No | Yes |
| Support Requests | description | Long text | No | Yes |
| Support Requests | message | Long text | No | Yes |
| Support Requests | category | Single select | No | Yes |
| Support Requests | status | Single select | No | Yes |
| Support Requests | relatedTrackingNumber | Single line text | No | No |
| Support Requests | createdAt | Created time | Yes | Yes |
| Support Requests | updatedAt | Last modified time | Yes | Yes |

---

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify field names match exactly (case-sensitive)
3. Ensure field types are correct
4. Check that linked record fields point to correct tables

**Note:** All field names are case-sensitive and must match exactly as shown in this guide.
