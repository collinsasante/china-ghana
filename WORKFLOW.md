# AFREQ System Workflow

This document explains the complete flow of how the AFREQ Delivery Tracking System works from item receipt in China to delivery in Ghana.

## 📊 High-Level Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   CHINA     │ -> │  IN TRANSIT  │ -> │   GHANA     │ -> │   CUSTOMER   │
│  WAREHOUSE  │    │   (SHIPPING) │    │  WAREHOUSE  │    │   PICKUP     │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

---

## 🔄 Complete System Flow

### **Phase 1: China Operations** 🇨🇳

#### Step 1.1: Container Setup
**Who:** China Team
**When:** New shipment arrives
**Where:** China Team Dashboard

**Actions:**
1. Create new container record in Airtable
2. Set container number (e.g., `CONT-2025-001`)
3. Set receiving date
4. Set expected arrival date to Ghana

**Data Stored:**
```javascript
Container {
  containerNumber: "CONT-2025-001",
  receivingDate: "2025-01-15",
  expectedArrivalGhana: "2025-02-15",
  status: "china_warehouse"
}
```

---

#### Step 1.2: Bulk Image Upload
**Who:** China Team
**Page:** `/china/receiving`

**Flow:**
```
┌─────────────────┐
│ Select Files    │ ──> Multiple images selected
└─────────────────┘
         │
         v
┌─────────────────┐
│ Enter Metadata  │ ──> Date: 2025-01-15
└─────────────────┘      Container: CONT-2025-001
         │
         v
┌─────────────────┐
│ Upload to       │ ──> Cloudinary folder:
│ Cloudinary      │      afreq/2025-01-15/CONT-2025-001/
└─────────────────┘
         │
         v
┌─────────────────┐
│ Display Grid    │ ──> Image thumbnails shown
└─────────────────┘
```

**Code Flow:**
```typescript
// 1. User selects files
const files = event.target.files;

// 2. Upload to Cloudinary
const results = await uploadBulkImages(
  files,
  '2025-01-15',
  'CONT-2025-001',
  (fileIndex, progress) => {
    updateProgressBar(fileIndex, progress.percentage);
  }
);

// 3. Display in grid
results.forEach(result => {
  displayImageCard(result.secure_url);
});
```

**Result:**
- ✅ Images stored in Cloudinary
- ✅ Organized in folders by date/container
- ✅ URLs saved for later use

---

#### Step 1.3: Item Data Entry
**Who:** China Team
**Trigger:** Click on uploaded image

**Flow:**
```
┌─────────────────┐
│ Click Image     │ ──> Opens modal form
└─────────────────┘
         │
         v
┌─────────────────────────────┐
│ Fill Item Details           │
│ - Item Name                 │
│ - Tracking Number           │
│ - Customer (dropdown)       │
│ - Dimensions (L×W×H)        │
│ - Unit (inches/cm)          │
│ - Weight                    │
│ - USD Cost                  │
└─────────────────────────────┘
         │
         v
┌─────────────────┐
│ Auto-Calculate  │ ──> CBM calculated
│ CBM             │      USD → Cedis converted
└─────────────────┘
         │
         v
┌─────────────────┐
│ Save to         │ ──> Creates record in Airtable
│ Airtable        │      Items table
└─────────────────┘
```

**Code Flow:**
```typescript
// When user clicks image
const handleImageClick = (imageUrl) => {
  openModal({
    imageUrl,
    onSubmit: async (formData) => {
      // Calculate CBM
      const cbm = calculateCBM(
        formData.length,
        formData.width,
        formData.height,
        formData.dimensionUnit
      );

      // Create item in Airtable
      const item = await createItem({
        name: formData.name,
        trackingNumber: formData.trackingNumber,
        customerId: formData.customerId,
        containerNumber: 'CONT-2025-001',
        photos: [imageUrl],
        length: formData.length,
        width: formData.width,
        height: formData.height,
        dimensionUnit: formData.dimensionUnit,
        cbm: cbm,
        weight: formData.weight,
        costUSD: formData.costUSD,
        costCedis: formData.costUSD * 15, // Exchange rate
        status: 'china_warehouse',
        receivingDate: '2025-01-15',
        isDamaged: false,
        isMissing: false,
      });

      closeModal();
      showSuccess('Item created!');
    }
  });
};
```

**Result:**
- ✅ Item stored in Airtable
- ✅ Linked to customer
- ✅ Photos linked
- ✅ CBM calculated
- ✅ Status: `china_warehouse`

---

#### Step 1.4: Packaging & Consolidation
**Who:** China Team
**Page:** `/china/packaging`

**Flow:**
```
┌─────────────────┐
│ Select Customer │ ──> Load customer's items
└─────────────────┘
         │
         v
┌─────────────────┐
│ View Items      │ ──> List of all customer items
└─────────────────┘      in this container
         │
         v
┌─────────────────┐
│ Select Items    │ ──> Check multiple items
│ to Package      │      to pack together
└─────────────────┘
         │
         v
┌─────────────────┐
│ Generate        │ ──> Auto-generate carton number
│ Carton Number   │      e.g., CTN-2025-001-A
└─────────────────┘
         │
         v
┌─────────────────┐
│ Update Items    │ ──> Assign carton number to items
└─────────────────┘      Print carton label
```

**Code Flow:**
```typescript
const handlePackage = async (selectedItems, customerId) => {
  // Generate carton number
  const cartonNumber = generateCartonNumber();

  // Update all selected items
  for (const itemId of selectedItems) {
    await updateItem(itemId, {
      cartonNumber: cartonNumber,
    });
  }

  // Print label
  printCartonLabel(cartonNumber, selectedItems);
};
```

---

#### Step 1.5: Shipment Preparation
**Who:** China Team
**Action:** Update container status

**Code:**
```typescript
await updateContainer(containerId, {
  status: 'in_transit',
  actualDepartureDate: new Date().toISOString(),
});

// Update all items in container
const items = await getItemsByContainerNumber('CONT-2025-001');
for (const item of items) {
  await updateItem(item.id, {
    status: 'in_transit',
  });
}
```

**Result:**
- ✅ Container status: `in_transit`
- ✅ All items status: `in_transit`
- ✅ Customers can now see "In Transit" on their dashboard

---

### **Phase 2: Customer Tracking** 👤

#### Step 2.1: View Status
**Who:** Customer
**Page:** `/status`

**Flow:**
```
┌─────────────────┐
│ Login           │ ──> customer@afreq.com
└─────────────────┘
         │
         v
┌─────────────────┐
│ Fetch Items     │ ──> getItemsByCustomerId(userId)
└─────────────────┘
         │
         v
┌─────────────────────────────┐
│ Display Table               │
│ Track# | Name | Status      │
│ AFQ123 | Laptop | In Transit│
│ AFQ124 | Phone | In Transit │
└─────────────────────────────┘
```

**Code:**
```typescript
function StatusPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (user) {
      getItemsByCustomerId(user.id).then(setItems);
    }
  }, [user]);

  return (
    <table>
      {items.map(item => (
        <tr key={item.id}>
          <td>{item.trackingNumber}</td>
          <td>{item.name}</td>
          <td>
            <StatusBadge status={item.status} />
          </td>
        </tr>
      ))}
    </table>
  );
}
```

---

#### Step 2.2: View Item Details
**Who:** Customer
**Page:** `/items`

**Flow:**
```
┌─────────────────┐
│ Browse Items    │ ──> Grid view with photos
└─────────────────┘
         │
         v
┌─────────────────┐
│ Click Item      │ ──> Open detail modal
└─────────────────┘
         │
         v
┌─────────────────────────────┐
│ Show Details                │
│ - Photo gallery (Cloudinary)│
│ - Dimensions                │
│ - CBM                       │
│ - Weight                    │
│ - Cost                      │
│ - Status                    │
└─────────────────────────────┘
```

**Code:**
```typescript
function ItemDetailModal({ item }) {
  return (
    <div className="modal">
      {/* Photo Gallery */}
      <div className="photos">
        {item.photos.map(photoUrl => (
          <img
            src={getThumbnailUrl(photoUrl, 400)}
            onClick={() => openLightbox(photoUrl)}
          />
        ))}
      </div>

      {/* Details */}
      <div className="details">
        <p>Dimensions: {item.length} × {item.width} × {item.height} {item.dimensionUnit}</p>
        <p>CBM: {item.cbm}</p>
        <p>Weight: {item.weight} {item.weightUnit}</p>
        <p>Cost: {formatCedis(item.costCedis)}</p>
      </div>
    </div>
  );
}
```

---

### **Phase 3: Ghana Operations** 🇬🇭

#### Step 3.1: Container Arrival
**Who:** Ghana Team
**Page:** `/ghana/sorting`

**Flow:**
```
┌─────────────────┐
│ Container       │ ──> CONT-2025-001 arrives
│ Arrives         │
└─────────────────┘
         │
         v
┌─────────────────┐
│ Update          │ ──> Set actualArrivalGhana date
│ Container       │      Status: arrived_ghana
└─────────────────┘
         │
         v
┌─────────────────┐
│ Update All      │ ──> All items in container
│ Items           │      Status: arrived_ghana
└─────────────────┘
```

**Code:**
```typescript
const handleContainerArrival = async (containerNumber) => {
  // Update container
  await updateContainer(containerId, {
    status: 'arrived_ghana',
    actualArrivalGhana: new Date().toISOString(),
  });

  // Update all items
  const items = await getItemsByContainerNumber(containerNumber);
  for (const item of items) {
    await updateItem(item.id, {
      status: 'arrived_ghana',
    });
  }
};
```

---

#### Step 3.2: Scanning & Sorting
**Who:** Ghana Team
**Page:** `/ghana/sorting`

**Flow:**
```
┌─────────────────┐
│ Scan Item       │ ──> Barcode/QR or manual entry
│ (Tracking #)    │      AFQ12345
└─────────────────┘
         │
         v
┌─────────────────┐
│ Fetch Item      │ ──> getItemByTrackingNumber()
│ Details         │
└─────────────────┘
         │
         v
┌─────────────────────────────┐
│ Display Item Info           │
│ - Photo                     │
│ - Customer name             │
│ - Item details              │
└─────────────────────────────┘
         │
         v
┌─────────────────┐
│ Verify Status   │ ──> Check if damaged/missing
└─────────────────┘
         │
         ├──> [Damaged] ──> Mark isDamaged = true
         │                   Create support ticket
         │
         ├──> [Missing] ──> Mark isMissing = true
         │                   Notify customer
         │
         └──> [OK] ─────> Confirm arrival
                          Status: ready_for_pickup
```

**Code:**
```typescript
const handleScan = async (trackingNumber) => {
  // Fetch item
  const item = await getItemByTrackingNumber(trackingNumber);

  if (!item) {
    showError('Item not found');
    return;
  }

  // Display item info
  displayItemInfo(item);

  // Actions
  const action = await askUser('Item condition?', [
    'OK',
    'Damaged',
    'Missing'
  ]);

  switch (action) {
    case 'OK':
      await updateItem(item.id, {
        status: 'ready_for_pickup',
      });
      break;

    case 'Damaged':
      await updateItem(item.id, {
        isDamaged: true,
      });
      await createSupportRequest({
        customerId: item.customerId,
        type: 'wrong_delivery',
        description: `Item ${trackingNumber} is damaged`,
        relatedTrackingNumbers: [trackingNumber],
      });
      break;

    case 'Missing':
      await updateItem(item.id, {
        isMissing: true,
      });
      break;
  }
};
```

---

#### Step 3.3: Customer Notification
**When:** Item ready for pickup
**How:** Email/SMS (future feature)

**Flow:**
```
Item status → ready_for_pickup
    │
    v
Trigger notification
    │
    v
Email/SMS to customer
    │
    v
Customer sees on dashboard
```

---

#### Step 3.4: Delivery/Pickup
**Who:** Ghana Team
**Page:** `/ghana/delivery`

**Flow:**
```
┌─────────────────┐
│ Customer        │ ──> Customer arrives for pickup
│ Arrives         │
└─────────────────┘
         │
         v
┌─────────────────┐
│ Verify Identity │ ──> Check ID, phone number
└─────────────────┘
         │
         v
┌─────────────────┐
│ Show Items      │ ──> Display all customer items
│ for Pickup      │      Status: ready_for_pickup
└─────────────────┘
         │
         v
┌─────────────────┐
│ Hand Over Items │ ──> Customer receives items
└─────────────────┘
         │
         v
┌─────────────────┐
│ Capture         │ ──> Digital signature
│ Signature       │
└─────────────────┘
         │
         v
┌─────────────────┐
│ Update Status   │ ──> Status: picked_up
└─────────────────┘      recordPickupDate
         │
         v
┌─────────────────┐
│ Print Receipt   │ ──> Receipt for customer
└─────────────────┘
```

**Code:**
```typescript
const handlePickup = async (customerId) => {
  // Get items ready for pickup
  const items = await getItemsByCustomerId(customerId);
  const readyItems = items.filter(
    item => item.status === 'ready_for_pickup'
  );

  // Show items to verify
  displayItemList(readyItems);

  // Capture signature
  const signature = await captureSignature();

  // Update all items
  for (const item of readyItems) {
    await updateItem(item.id, {
      status: 'picked_up',
      pickupDate: new Date().toISOString(),
      signature: signature,
    });
  }

  // Generate receipt
  printReceipt(customerId, readyItems);
};
```

---

### **Phase 4: Invoicing & Payment** 💰

#### Step 4.1: Invoice Generation
**Who:** Admin
**When:** Items ready for pickup

**Flow:**
```
┌─────────────────┐
│ Calculate Fees  │
│ - Shipping      │ ──> Based on CBM
│ - Handling      │ ──> Per item
│ - Storage       │ ──> Days in storage
│ - Pickup        │ ──> Fixed fee
└─────────────────┘
         │
         v
┌─────────────────┐
│ Create Invoice  │ ──> Save to Airtable
└─────────────────┘
         │
         v
┌─────────────────┐
│ Customer Sees   │ ──> On /invoices page
│ Invoice         │
└─────────────────┘
```

**Code:**
```typescript
const generateInvoice = async (customerId) => {
  const items = await getItemsByCustomerId(customerId);

  // Calculate charges
  const shippingCharge = items.reduce(
    (sum, item) => sum + (item.cbm * 50), 0
  );
  const handlingCharge = items.length * 10;
  const storageCharge = calculateStorage(items);
  const pickupCharge = 20;

  const subtotal = shippingCharge + handlingCharge +
                   storageCharge + pickupCharge;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // Create invoice
  const invoice = await createInvoice({
    customerId,
    invoiceNumber: generateInvoiceNumber(),
    items: items.map(item => ({
      itemId: item.id,
      description: item.name,
      quantity: 1,
      unitPrice: item.costCedis,
      total: item.costCedis,
    })),
    shippingCharge,
    handlingCharge,
    storageCharge,
    pickupCharge,
    subtotal,
    tax,
    total,
    currency: 'GHS',
    status: 'pending',
    dueDate: addDays(new Date(), 7),
  });

  return invoice;
};
```

---

### **Phase 5: Support & Communication** 🆘

#### Step 5.1: Customer Support Request
**Who:** Customer
**Page:** `/support`

**Flow:**
```
┌─────────────────┐
│ Select Type     │ ──> Missing Item
└─────────────────┘      Wrong Delivery
         │               General
         v
┌─────────────────┐
│ Fill Form       │ ──> Subject, Description
└─────────────────┘      Related tracking numbers
         │
         v
┌─────────────────┐
│ Submit          │ ──> Save to Airtable
└─────────────────┘
         │
         v
┌─────────────────┐
│ Send Email      │ ──> Email to support team
└─────────────────┘      (Future integration)
         │
         v
┌─────────────────┐
│ Team Receives   │ ──> Admin dashboard shows
│ Notification    │      new request
└─────────────────┘
```

**Code:**
```typescript
const handleSupportSubmit = async (formData) => {
  const request = await createSupportRequest({
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    type: formData.type,
    subject: formData.subject,
    description: formData.description,
    relatedTrackingNumbers: formData.trackingNumbers,
    status: 'open',
  });

  // TODO: Send email to support team
  // await sendSupportEmail(request);

  showSuccess('Support request submitted');
};
```

---

## 🎯 Data Flow Summary

```
┌──────────────┐
│  CLOUDINARY  │ ──> Image Storage
└──────────────┘
       │
       │ Image URLs
       v
┌──────────────┐
│   AIRTABLE   │ ──> Database
└──────────────┘
       │
       │ Read/Write
       v
┌──────────────┐
│   FRONTEND   │ ──> React App
└──────────────┘
       │
       │ Display
       v
┌──────────────┐
│    USERS     │ ──> Customers, Teams
└──────────────┘
```

---

## 📋 Status Lifecycle

```
china_warehouse (China Team creates item)
      │
      v
in_transit (Container ships)
      │
      v
arrived_ghana (Container arrives)
      │
      v
ready_for_pickup (Ghana Team confirms item OK)
      │
      v
picked_up (Customer collects)
      or
delivered (Delivered to customer)
```

---

## 🔑 Key Integration Points

### 1. **Image Upload → Item Creation**
```
Upload to Cloudinary → Get URL → Save to Airtable with URL
```

### 2. **Item Tracking**
```
Customer views → Fetch from Airtable → Display with Cloudinary images
```

### 3. **Status Updates**
```
Team updates status → Write to Airtable → Customer sees update
```

### 4. **Search & Scan**
```
Scan tracking # → Query Airtable → Display item → Update status
```

---

This is the complete workflow! Each phase builds on the previous, creating a seamless tracking system from China to Ghana.
