# China Team Usage Guide

## 🇨🇳 Complete Guide for China Operations

This guide explains how to use the China Team module for receiving items and preparing them for shipment to Ghana.

---

## 📋 Overview

The China Team is responsible for:
1. **Receiving items** at the China warehouse
2. **Uploading photos** of each item
3. **Recording item details** (dimensions, weight, cost)
4. **Packaging items** for shipping
5. **Preparing shipment** to Ghana

---

## 🚀 Getting Started

### Login
1. Go to the AFREQ system
2. Login with your China Team credentials
   - Email: `china@afreq.com` (or your assigned email)
   - Password: (your password)

### Navigation
After login, you'll see the China Team menu:
- **Item Receiving** - Add new items
- **Packaging** - Consolidate items for shipping

---

## 📦 Item Receiving Workflow

### **Step 1: Enter Container Information**

When a new shipment arrives:

1. Go to **China Team → Item Receiving**
2. Enter the **Container Number**
   - Example: `CONT-2025-001`
   - Use a unique identifier for each container
3. Select the **Receiving Date**
   - Defaults to today's date
   - Change if items were received on a different date

**Important:** This information will be used to organize photos in Cloudinary!

---

### **Step 2: Upload Item Photos**

#### Method 1: Drag & Drop
1. Drag image files from your computer
2. Drop them onto the upload area
3. Images will appear in a preview

#### Method 2: Click to Browse
1. Click on the upload area
2. Select multiple images from your computer
3. Click "Open"

**Tips:**
- ✅ Upload multiple images at once
- ✅ Maximum 10MB per image
- ✅ Supported formats: JPG, PNG, JPEG, WebP, HEIC
- ✅ You can remove images before uploading

**After selecting images:**
- You'll see a preview of all selected images
- Click **"Upload to Cloudinary"** button
- Wait for upload to complete (progress bar shown)

**What happens during upload:**
- Images are uploaded to Cloudinary
- Organized in folder: `afreq/[Date]/[Container]/`
- Example: `afreq/2025-01-15/CONT-2025-001/`
- Each image gets a unique URL

---

### **Step 3: Add Item Details**

After upload completes, you'll see an image grid.

**For each image:**

1. **Click the image** to open the item form
2. Fill in the following details:

#### Required Information:

**Item Name**
- Enter the item description
- Example: "Laptop Computer", "Samsung Phone", "Shoes"

**Tracking Number**
- Enter the tracking number
- Example: `AFQ17383721LPTO`
- This will be used by customers to track their item

**Customer ID**
- Enter the customer's ID
- Example: `rec123abc456def` (from Airtable)
- *TODO: Will be replaced with dropdown in future update*

**Dimensions (L × W × H)**
- Enter length, width, height
- Choose unit: **cm** or **inches**
- Example: `40 × 30 × 5 cm`

**CBM (Auto-Calculated)**
- Automatically calculated based on dimensions
- Formula:
  - If cm: `(L × W × H) / 1,000,000`
  - If inches: `(L × W × H) / 61,024`
- Shows in real-time as you type

**Weight**
- Enter the item weight
- Choose unit: **kg** or **lbs**
- Example: `2.5 kg`

**Cost (USD)**
- Enter the item cost in US Dollars
- Example: `500.00`
- Cedis equivalent is auto-calculated
- Exchange rate: 1 USD = 15 GHS (configurable)

3. **Review the information**
4. Click **"Save Item"**

**Result:**
- Item saved to Airtable
- Status set to "china_warehouse"
- Image marked as "Complete" ✅
- Customer can now see this item in their dashboard

---

### **Step 4: Repeat for All Images**

Continue clicking each image and adding details until all items are processed.

**Progress Tracking:**
- **Blue badge**: Shows uploaded images
- **Green badge**: Shows completed items
- Green checkmark on image = Done ✅
- Yellow warning on image = Add details needed ⚠️

---

## 📊 Image Status Guide

| Badge | Status | Action Needed |
|-------|--------|---------------|
| ⏰ Pending | Image selected, not uploaded | Wait for upload |
| ⚠️ Add Details | Image uploaded to Cloudinary | Click to add item data |
| ✅ Complete | Item data saved | Done! |

---

## 🎯 Best Practices

### Photo Quality
- ✅ Take clear, well-lit photos
- ✅ Show item from multiple angles if needed
- ✅ Include any labels or barcodes
- ✅ Ensure image is not blurry

### Data Entry
- ✅ Double-check tracking numbers
- ✅ Measure dimensions accurately
- ✅ Use consistent units (all cm or all inches)
- ✅ Verify customer ID is correct
- ✅ Enter cost in USD (cedis auto-calculated)

### Organization
- ✅ Process one container at a time
- ✅ Complete all items before starting new container
- ✅ Use descriptive container numbers
- ✅ Keep photos organized by date

---

## 🔢 CBM Calculation Examples

### Example 1: Box in Centimeters
- Length: 40 cm
- Width: 30 cm
- Height: 20 cm
- **CBM = (40 × 30 × 20) / 1,000,000 = 0.024 m³**

### Example 2: Box in Inches
- Length: 15 inches
- Width: 12 inches
- Height: 8 inches
- **CBM = (15 × 12 × 8) / 61,024 = 0.0236 m³**

### Why CBM Matters
- Used to calculate shipping costs
- Helps determine container capacity
- Important for logistics planning

---

## ⚠️ Common Issues & Solutions

### Images won't upload
**Solution:**
- Check internet connection
- Verify Cloudinary is configured
- Check file size (max 10MB)
- Try fewer images at once

### Can't see container number input
**Solution:**
- Scroll to top of page
- It's in "Step 1: Container Information"

### Modal won't open when clicking image
**Solution:**
- Make sure images are uploaded first (blue button)
- Check that image has yellow "Add Details" badge
- Don't click images with green checkmark (already complete)

### CBM not calculating
**Solution:**
- Make sure all three dimensions are filled
- Use numbers only (no letters)
- Check that you selected a unit (cm or inches)

### Customer ID error
**Solution:**
- Get correct customer ID from Airtable
- Copy/paste to avoid typos
- Format: `recXXXXXXXXXXXXXX`

---

## 💡 Tips for Efficiency

1. **Batch Processing**
   - Upload all photos for one container at once
   - Process items systematically (top to bottom, left to right)

2. **Use Templates**
   - For similar items, copy previous dimensions
   - Keep a reference sheet of common measurements

3. **Quality Control**
   - Review completed items before moving to next container
   - Verify tracking numbers are unique
   - Check photos are clear and correct

4. **Communication**
   - Note any damaged items in item name
   - Flag unusual items for review
   - Coordinate with team on special cases

---

## 📤 After All Items Are Entered

Once all items in a container are processed:

1. **Verify Completion**
   - Check all images have green checkmarks ✅
   - Confirm item count matches actual items
   - Review for any errors

2. **Update Container Status**
   - Go to **Packaging** (future feature)
   - Or manually update in Airtable
   - Change status to "Ready for Packaging"

3. **Prepare for Shipment**
   - Package items securely
   - Update container status to "In Transit" when shipped
   - All customers will automatically see "In Transit" status

---

## 🔐 Data Security

- ✅ Never share customer information
- ✅ Keep login credentials secure
- ✅ Log out when leaving computer
- ✅ Verify customer IDs before assignment

---

## 📞 Need Help?

**Technical Issues:**
- Contact IT support
- Check TROUBLESHOOTING.md

**Process Questions:**
- Ask your supervisor
- Refer to training materials

**System Bugs:**
- Report to administrator
- Include screenshots if possible

---

## 🎓 Training Checklist

Before processing items independently, make sure you can:

- [ ] Login to the system
- [ ] Enter container information
- [ ] Upload multiple photos
- [ ] Add item details correctly
- [ ] Understand CBM calculation
- [ ] Verify data before saving
- [ ] Check upload progress
- [ ] Identify item statuses
- [ ] Remove incorrect photos
- [ ] Complete full container workflow

---

## 📈 Performance Metrics

Track your efficiency:
- **Items processed per hour**
- **Accuracy rate** (errors found)
- **Photos uploaded per day**
- **Containers completed per week**

---

## 🚀 Quick Reference Card

```
LOGIN → china@afreq.com

WORKFLOW:
1. Enter Container # + Date
2. Upload Photos (drag & drop)
3. Click "Upload to Cloudinary"
4. Click each image
5. Fill form (auto-calculates CBM)
6. Save item
7. Repeat for all images

UNITS:
• Dimensions: cm or inches
• Weight: kg or lbs
• Cost: USD (cedis auto-calculated)

STATUS BADGES:
⏰ Pending → ⚠️ Add Details → ✅ Complete
```

---

**Happy Processing! 📦**

Remember: Accuracy is more important than speed!
