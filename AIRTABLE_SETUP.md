# AFREQ Delivery Tracking System - Airtable Setup Guide

This guide will help you set up your Airtable base for the AFREQ Delivery Tracking System.

## 📋 Overview

You need to create **6 tables** in your Airtable base with specific fields. Each table serves a different purpose in the system.

---

## 🗂️ Table 1: Users

**Purpose:** Store customer and team member information

### Fields:

| Field Name | Type | Description | Required | Options/Notes |
|------------|------|-------------|----------|---------------|
| `name` | Single line text | User's full name | ✅ Yes | |
| `email` | Email | User's email address | ✅ Yes | Used for login |
| `password` | Single line text | User's password | ✅ Yes | Store hashed in production |
| `role` | Single select | User role type | ✅ Yes | Options: `customer`, `china_team`, `ghana_team`, `admin` |
| `phone` | Phone number | Contact phone number | ❌ No | |
| `address` | Long text | Physical address | ❌ No | |

### Sample Data:
```
Name: John Doe
Email: customer@example.com
Password: password123
Role: customer
Phone: +233-XXX-XXXX
Address: Accra, Ghana
```

---

## 📦 Table 2: Items

**Purpose:** Track individual items/packages received and shipped

### Fields:

| Field Name | Type | Description | Required | Notes |
|------------|------|-------------|----------|-------|
| `name` | Single line text | Item description | ❌ No | Optional item name |
| `trackingNumber` | Single line text | Unique tracking number | ✅ Yes | Primary identifier |
| `customerId_old` | Link to another record | Link to Users table | ✅ Yes | **CRITICAL: Must be named exactly `customerId_old`** |
| `containerNumber` | Single line text | Container assignment | ❌ No | Assigned when shipping to Ghana |
| `receivingDate` | Date | Date received in China | ✅ Yes | |
| `length` | Number | Length dimension | ✅ Yes | Decimal allowed |
| `width` | Number | Width dimension | ✅ Yes | Decimal allowed |
| `height` | Number | Height dimension | ✅ Yes | Decimal allowed |
| `dimensionUnit` | Single select | Unit of measurement | ✅ Yes | Options: `cm`, `inches` |
| `cbm` | Number | Cubic meters (auto-calculated) | ✅ Yes | Decimal, precision 4 |
| `shippingMethod` | Single select | Shipping type | ✅ Yes | Options: `sea`, `air` |
| `weight` | Number | Item weight | ❌ No | Required only for air shipping |
| `weightUnit` | Single select | Weight unit | ❌ No | Options: `kg`, `lbs` |
| `costUSD` | Currency | Cost in US Dollars | ✅ Yes | Auto-calculated |
| `costCedis` | Currency | Cost in Ghana Cedis | ✅ Yes | Auto-calculated (USD × 15) |
| `status` | Single select | Current status | ✅ Yes | Options: `china_warehouse`, `in_transit`, `arrived_ghana`, `ready_for_pickup`, `delivered` |
| `photos` | Multiple attachments | Item photos | ❌ No | From Cloudinary URLs |
| `isDamaged` | Checkbox | Item damaged flag | ✅ Yes | Default: false |
| `isMissing` | Checkbox | Item missing flag | ✅ Yes | Default: false |
| `cartonNumber` | Single line text | Carton/box number | ❌ No | |
| `createdAt` | Date | Record creation date | ✅ Yes | |
| `updatedAt` | Date | Last update date | ✅ Yes | |

### Cost Calculation Logic:
- **Sea Shipping:** Cost = CBM × $1000 per CBM
- **Air Shipping:** Cost = Weight (kg) × $5 per kg
- **Cedis Conversion:** Cost (GHS) = Cost (USD) × 15

### Sample Data:
```
Name: Electronics Package
Tracking Number: TRK123456
customerId_old: [Link to user record - Click to select from Users table]
Receiving Date: 2025-11-20
Length: 50, Width: 40, Height: 30
Dimension Unit: cm
CBM: 0.06
Shipping Method: sea
Cost USD: $60.00
Cost Cedis: ₵900.00
Status: china_warehouse
```

---

## 🚢 Table 3: Containers

**Purpose:** Track shipping containers from China to Ghana

### Fields:

| Field Name | Type | Description | Required | Notes |
|------------|------|-------------|----------|-------|
| `containerNumber` | Single line text | Unique container ID | ✅ Yes | e.g., CONT-2025-001 |
| `shippingMethod` | Single select | Transport type | ✅ Yes | Options: `sea`, `air` |
| `departureDate` | Date | Departure from China | ✅ Yes | |
| `estimatedArrival` | Date | Expected arrival in Ghana | ✅ Yes | |
| `actualArrival` | Date | Actual arrival date | ❌ No | |
| `status` | Single select | Container status | ✅ Yes | Options: `at_origin`, `in_transit`, `arrived`, `customs_clearance`, `ready_for_distribution` |
| `receivingDate` | Date | Date container received | ❌ No | |
| `notes` | Long text | Additional information | ❌ No | |

### Sample Data:
```
Container Number: CONT-2025-001
Shipping Method: sea
Departure Date: 2025-11-15
Estimated Arrival: 2025-12-20
Status: in_transit
```

---

## 🧾 Table 4: Invoices

**Purpose:** Track customer invoices and payments

### Fields:

| Field Name | Type | Description | Required | Notes |
|------------|------|-------------|----------|-------|
| `customerId` | Link to another record | Link to Users table | ✅ Yes | **Must link to Users table** |
| `invoiceNumber` | Single line text | Unique invoice ID | ✅ Yes | e.g., INV-2025-001 |
| `issueDate` | Date | Invoice creation date | ✅ Yes | |
| `dueDate` | Date | Payment due date | ✅ Yes | |
| `totalAmount` | Currency | Total invoice amount | ✅ Yes | USD |
| `status` | Single select | Payment status | ✅ Yes | Options: `pending`, `paid`, `overdue`, `cancelled` |
| `description` | Long text | Invoice description | ✅ Yes | Services/items description |
| `notes` | Long text | Additional notes | ❌ No | Payment terms, etc. |
| `createdAt` | Date | Record creation | ✅ Yes | |

### Sample Data:
```
Customer ID: [Link to user record]
Invoice Number: INV-2025-001
Issue Date: 2025-11-20
Due Date: 2025-12-05
Total Amount: $250.00
Status: pending
Description: Shipping charges for 5 items (Container CONT-2025-001)
```

---

## 💬 Table 5: SupportRequests

**Purpose:** Handle customer support tickets

### Fields:

| Field Name | Type | Description | Required | Notes |
|------------|------|-------------|----------|-------|
| `customerId` | Link to another record | Link to Users table | ✅ Yes | **Must link to Users table** |
| `subject` | Single line text | Request title | ✅ Yes | Brief description |
| `description` | Long text | Detailed explanation | ✅ Yes | |
| `category` | Single select | Request type | ✅ Yes | Options: `missing_item`, `wrong_delivery`, `general` |
| `priority` | Single select | Urgency level | ✅ Yes | Options: `low`, `medium`, `high` |
| `status` | Single select | Current status | ✅ Yes | Options: `open`, `in_progress`, `resolved`, `closed` |
| `relatedTrackingNumber` | Single line text | Associated tracking # | ❌ No | Optional |
| `adminResponse` | Long text | Response from staff | ❌ No | |
| `createdAt` | Date | Request creation | ✅ Yes | |
| `updatedAt` | Date | Last update | ✅ Yes | |

### Sample Data:
```
Customer ID: [Link to user record]
Subject: Missing item in container
Description: One of my packages is not in the delivered container
Category: missing_item
Priority: high
Status: open
Related Tracking Number: TRK123456
Created At: 2025-11-24
```

---

## 📢 Table 6: Announcements

**Purpose:** System-wide announcements visible to customers

### Fields:

| Field Name | Type | Description | Required | Notes |
|------------|------|-------------|----------|-------|
| `title` | Single line text | Announcement title | ✅ Yes | |
| `message` | Long text | Full announcement text | ✅ Yes | |
| `type` | Single select | Announcement category | ✅ Yes | Options: `important`, `update`, `promotion`, `general` |
| `isActive` | Checkbox | Visible to customers | ✅ Yes | Default: true |
| `createdAt` | Date | Creation date | ✅ Yes | |

### Sample Data:
```
Title: Holiday Shipping Schedule
Message: Please note that shipping will be delayed during Chinese New Year (Feb 10-17, 2025). We apologize for any inconvenience.
Type: important
Is Active: ✅ true
Created At: 2025-11-24
```

---

## 🔑 Getting Your Airtable Credentials

### 1. Get Your API Key
1. Go to https://airtable.com/account
2. Click on **"Generate API key"** in the API section
3. Copy your Personal Access Token
4. Add to `.env` file:
   ```
   VITE_AIRTABLE_API_KEY=your_api_key_here
   ```

### 2. Get Your Base ID
1. Go to https://airtable.com/api
2. Click on your base
3. The Base ID is in the URL and introduction text (starts with `app`)
4. Add to `.env` file:
   ```
   VITE_AIRTABLE_BASE_ID=your_base_id_here
   ```

---

## 🔗 Important: Linked Records Setup

When creating linked record fields, make sure to:

1. **For Items table → `customerId_old` field**:
   - Type: "Link to another record"
   - Field name: **MUST be exactly `customerId_old`** (not `customerId`)
   - Link to: **Users** table
   - Allow linking to multiple records: **NO** (single link only)

2. **For Invoices and SupportRequests tables → `customerId` field**:
   - Type: "Link to another record"
   - Link to: **Users** table
   - Allow linking to multiple records: **NO** (single link only)

2. **Field names must match exactly** as shown in this guide (case-sensitive)

3. **Single select options must match exactly** (case-sensitive)

---

## 🧪 Test Data

Create at least one record in each table to test:

### Test User (Customer):
```
Name: Test Customer
Email: test@customer.com
Password: test123
Role: customer
```

### Test Item:
```
Tracking Number: TEST001
customerId_old: [Link to test customer - Click the field and select "Test Customer"]
Receiving Date: Today's date
Length: 50, Width: 40, Height: 30
Dimension Unit: cm
CBM: 0.06
Shipping Method: sea
Cost USD: 60.00
Cost Cedis: 900.00
Status: china_warehouse
isDamaged: false (unchecked)
isMissing: false (unchecked)
```

### Test Announcement:
```
Title: Welcome to AFREQ!
Message: Welcome to our delivery tracking system. Track your shipments easily!
Type: general
Is Active: true
```

---

## ✅ Verification Checklist

Before running the application, verify:

- [ ] All 6 tables created with correct names
- [ ] All required fields added with correct field types
- [ ] Linked record fields properly configured (customerId → Users)
- [ ] Single select options match exactly
- [ ] At least one test user created
- [ ] API key and Base ID added to `.env` file
- [ ] Test data added to verify connectivity

---

## 🚨 Common Issues

### Issue: "Customer not found with email"
**Solution:** The `customerId` field must be an Airtable record ID (starts with "rec") OR a valid email in the Users table.

### Issue: "INVALID_VALUE_FOR_COLUMN"
**Solution:** Linked record fields (like `customerId`) must be configured as "Link to another record" type, not text.

### Issue: Fields not showing up
**Solution:** Field names are case-sensitive. Ensure exact match (e.g., `trackingNumber` not `TrackingnNumber`).

---

## 📞 Need Help?

If you encounter issues:
1. Double-check field names and types match this guide exactly
2. Verify your API key and Base ID are correct
3. Ensure linked record fields point to the correct tables
4. Check that single select options match exactly (case-sensitive)

---

## 🎯 Next Steps

After setting up Airtable:
1. Add your credentials to `.env` file
2. Create test data in each table
3. Log in to the application with your test customer account
4. Verify data appears correctly in the dashboard

Good luck! 🚀
