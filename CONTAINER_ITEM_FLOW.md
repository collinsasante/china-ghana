# Container and Item Flow Logic

## Current System Design

### Shipping Flow Overview

Items follow a specific flow based on whether they are being shipped (in containers) or being delivered to customers (as individual items).

```
China → Container Shipping → Ghana Arrival → Individual Item Scanning → Customer Delivery
```

## Detailed Flow

### Phase 1: Container-Based (China to Ghana)

**Status:** `china_warehouse` → `in_transit` → `arrived_ghana`

During this phase:
- **Items are grouped in containers**
- Items MUST have a `containerNumber` assigned
- Shipping is done by container, not individual items
- Items share the same container status
- Container management happens in ContainerManagementPage

**Key Points:**
1. Items uploaded in China are assigned to containers
2. All items in a container share the same shipping status
3. Tracking is done at the container level
4. Items cannot be individually scanned yet

### Phase 2: Individual Item Processing (Ghana)

**Status:** `arrived_ghana` → `ready_for_pickup` → `delivered`

When a container arrives in Ghana:
- **Container is "unpacked" logically**
- Items become individual units
- Each item can be scanned separately
- Items are sorted and assigned to customers
- Individual item tracking begins

**Key Points:**
1. Ghana team scans items individually (SortingPage)
2. Items are assigned to specific customers (TaggingPage)
3. Each item has its own delivery status
4. Items can be in different statuses even if from same container

## Implementation Logic

### Container Assignment (China Team)

```typescript
// Items MUST be in a container before shipping
item.containerNumber = "CONTAINER-001";
item.status = "china_warehouse"; // or "in_transit"
```

### Container Arrival (System Update)

```typescript
// When container arrives in Ghana
container.status = "arrived_ghana";
// All items in container get status update
items.where(containerNumber === container.number)
  .forEach(item => item.status = "arrived_ghana");
```

### Individual Processing (Ghana Team)

```typescript
// After arrival, items are processed individually
item.status = "ready_for_pickup"; // Can be set per item
item.customerId = "customer-123"; // Individual assignment
item.scannedAt = new Date(); // Individual scanning
```

## Data Requirements

### Container Table
- `containerNumber` (string, unique)
- `status` (matches container-level status only)
- `items` (array of item IDs)
- `totalCBM` (calculated)
- `totalValue` (calculated)
- `departureDate` (when shipped from China)
- `arrivalDate` (when arrived in Ghana)

### Item Table
- `containerNumber` (string, links to container)
- `status` (individual status after Ghana arrival)
- `customerId` (assigned in Ghana)
- `scannedAt` (timestamp of scanning)
- `deliveryStatus` (for final delivery tracking)

## Status Transitions

### Valid Transitions

```
china_warehouse → in_transit (Container shipped)
in_transit → arrived_ghana (Container arrived)
arrived_ghana → ready_for_pickup (Item scanned & sorted)
ready_for_pickup → delivered (Item delivered to customer)
```

### Container vs Item Status

| Container Status | Item Status | Notes |
|-----------------|-------------|-------|
| china_warehouse | china_warehouse | Items waiting for container assignment |
| in_transit | in_transit | All items in container are in transit |
| arrived_ghana | arrived_ghana | Container arrived, items can now be scanned |
| N/A | ready_for_pickup | Individual item ready for customer pickup |
| N/A | delivered | Individual item delivered to customer |

## UI/UX Considerations

### China Team View
- Focus on container management
- Bulk assignment of items to containers
- Container-level status updates
- Cannot modify individual item statuses after containerization

### Ghana Team View
- Scan containers upon arrival (marks all items as "arrived_ghana")
- Scan individual items for sorting
- Assign items to customers
- Update individual delivery statuses

### Customer View
- See container tracking until "arrived_ghana"
- See individual item tracking after Ghana arrival
- Receive notifications when:
  - Container arrives in Ghana
  - Their item is ready for pickup
  - Item is out for delivery

## Current Implementation Status

### ✅ Implemented
- Container management in ContainerManagementPage
- Item assignment to containers
- Container grouping and display
- Item tagging to customers

### 🚧 Needs Implementation
1. **Container-level status updates:**
   - Bulk update all items when container status changes
   - Prevent individual item status changes while in container

2. **Arrival scanning:**
   - Scan container QR code to mark all items as "arrived_ghana"
   - Automatic status propagation to all container items

3. **Individual item scanning:**
   - Generate unique QR codes for items after Ghana arrival
   - Scan items individually for customer assignment

4. **Status validation:**
   - Prevent skipping status steps
   - Validate transitions based on container/item state

## Recommended Next Steps

1. **Add Container Status Management:**
   ```typescript
   // ContainerManagementPage
   - Add "Mark as Shipped" button (china_warehouse → in_transit)
   - Add "Mark as Arrived" button (in_transit → arrived_ghana)
   ```

2. **Update SortingPage:**
   ```typescript
   - Add container scanning feature
   - Bulk update items when container is scanned
   - Show items grouped by container until scanned
   ```

3. **Add Status Validation:**
   ```typescript
   // In airtable.ts or item update functions
   function validateStatusTransition(currentStatus, newStatus, hasContainer) {
     // Validate based on container state and current status
   }
   ```

4. **Update Customer Dashboard:**
   ```typescript
   - Show container tracking for items in transit
   - Switch to item tracking after Ghana arrival
   - Different UI for container vs item tracking
   ```

## Benefits of This Approach

1. **Accurate Tracking:** Reflects real-world shipping process
2. **Efficiency:** Bulk operations for containers, individual for delivery
3. **Clarity:** Clear distinction between shipping and delivery phases
4. **Scalability:** Handles large shipments efficiently
5. **Customer Experience:** Appropriate level of detail at each stage
