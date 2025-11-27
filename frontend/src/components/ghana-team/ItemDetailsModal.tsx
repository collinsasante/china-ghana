import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { calculateCBM } from '../../utils/calculations';
import { createUser } from '../../services/airtable';
import type { Item, User } from '../../types/index';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<Item>) => Promise<void>;
  item: Item;
  customers: User[];
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  type: NotificationType;
  title: string;
  message: string;
}

export default function ItemDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  customers,
}: ItemDetailsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    trackingNumber: '',
    customerId: '',
    quantity: '1',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'cm' as 'cm' | 'inches',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    shippingMethod: 'sea' as 'sea' | 'air',
    receivingDate: new Date().toISOString().split('T')[0],
  });

  const [cbm, setCbm] = useState<number>(0);
  const [calculatedCostUSD, setCalculatedCostUSD] = useState<number>(0);
  const [calculatedCostCedis, setCalculatedCostCedis] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [notification, setNotification] = useState<Notification | null>(null);

  const EXCHANGE_RATE = 15; // USD to GHS
  const CBM_RATE_SEA = 1000; // $1000 per CBM for sea shipping
  const WEIGHT_RATE_AIR = 5; // $5 per kg for air shipping

  // Show notification with optional longer duration
  const showNotification = (type: NotificationType, title: string, message: string, duration: number = 5000) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), duration);
  };

  // Pre-fill form with existing item data when modal opens
  useEffect(() => {
    if (isOpen && item) {
      const customerId = Array.isArray(item.customerId) ? item.customerId[0] : (item.customerId || '');
      setFormData({
        name: item.name || '',
        trackingNumber: item.trackingNumber || '',
        customerId,
        quantity: item.quantity?.toString() || '1',
        length: item.length?.toString() || '',
        width: item.width?.toString() || '',
        height: item.height?.toString() || '',
        dimensionUnit: item.dimensionUnit || 'cm',
        weight: item.weight?.toString() || '',
        weightUnit: item.weightUnit || 'kg',
        shippingMethod: item.shippingMethod || 'sea',
        receivingDate: item.receivingDate || new Date().toISOString().split('T')[0],
      });

    }
  }, [isOpen, item, customers]);

  // Calculate CBM when dimensions change
  useEffect(() => {
    const { length, width, height, dimensionUnit } = formData;
    if (length && width && height) {
      const calculatedCbm = calculateCBM(
        parseFloat(length),
        parseFloat(width),
        parseFloat(height),
        dimensionUnit
      );
      setCbm(calculatedCbm);
    } else {
      setCbm(0);
    }
  }, [formData.length, formData.width, formData.height, formData.dimensionUnit]);

  // Calculate cost based on shipping method
  useEffect(() => {
    let costUSD = 0;

    if (formData.shippingMethod === 'sea' && cbm > 0) {
      // Sea shipping: cost based on CBM
      costUSD = cbm * CBM_RATE_SEA;
    } else if (formData.shippingMethod === 'air' && formData.weight) {
      // Air shipping: cost based on weight
      costUSD = parseFloat(formData.weight) * WEIGHT_RATE_AIR;
    }

    setCalculatedCostUSD(costUSD);
    setCalculatedCostCedis(costUSD * EXCHANGE_RATE);
  }, [cbm, formData.weight, formData.shippingMethod]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.trackingNumber.trim()) {
      showNotification('warning', 'Missing Information', 'Please enter a tracking number');
      return;
    }
    if (!formData.customerId) {
      showNotification('warning', 'Missing Information', 'Please select a customer');
      return;
    }
    // Dimensions are only required for sea shipping
    if (formData.shippingMethod === 'sea' && (!formData.length || !formData.width || !formData.height)) {
      showNotification('warning', 'Missing Information', 'Please enter all dimensions (Length, Width, Height) for sea shipping');
      return;
    }
    // Weight is only required for air shipping
    if (formData.shippingMethod === 'air' && !formData.weight) {
      showNotification('warning', 'Missing Information', 'Please enter weight (required for air shipping)');
      return;
    }

    setIsSubmitting(true);

    try {
      const itemData: Partial<Item> = {
        name: formData.name.trim() || undefined,
        trackingNumber: formData.trackingNumber.trim(),
        customerId: formData.customerId,
        quantity: parseInt(formData.quantity) || 1,
        receivingDate: formData.receivingDate,
        shippingMethod: formData.shippingMethod,
        costUSD: calculatedCostUSD,
        costCedis: calculatedCostCedis,
        photos: item.photos, // Preserve existing photos
        status: 'china_warehouse',
      };

      // Only include dimensions for sea shipping
      if (formData.shippingMethod === 'sea') {
        itemData.length = parseFloat(formData.length);
        itemData.width = parseFloat(formData.width);
        itemData.height = parseFloat(formData.height);
        itemData.dimensionUnit = formData.dimensionUnit;
        itemData.cbm = cbm;
      }

      // Only include weight for air shipping
      if (formData.shippingMethod === 'air' && formData.weight) {
        itemData.weight = parseFloat(formData.weight);
        itemData.weightUnit = formData.weightUnit;
      }

      await onSubmit(itemData);

      // Get customer name for success message
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const customerName = selectedCustomer ? selectedCustomer.name : formData.customerId;

      showNotification(
        'success',
        'Item Details Saved!',
        `Tracking: ${formData.trackingNumber} (Qty: ${formData.quantity}) • Customer: ${customerName} • Cost: $${calculatedCostUSD.toFixed(2)}`
      );

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to update item:', error);

      let errorMessage = 'Failed to save item details. ';
      if (error.message) {
        errorMessage += error.message;
      } else if (error.error) {
        errorMessage += error.error;
      } else {
        errorMessage += 'Please check all fields and try again.';
      }

      showNotification('error', 'Save Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async () => {
    // Validation
    if (!newCustomerData.name.trim()) {
      showNotification('warning', 'Missing Information', 'Please enter customer name');
      return;
    }
    if (!newCustomerData.email.trim()) {
      showNotification('warning', 'Missing Information', 'Please enter customer email');
      return;
    }

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();

      const newCustomer = await createUser({
        name: newCustomerData.name.trim(),
        email: newCustomerData.email.trim(),
        phone: newCustomerData.phone.trim() || undefined,
        role: 'customer',
      });

      // Select the new customer
      setFormData(prev => ({ ...prev, customerId: newCustomer.id }));

      // Reset new customer form
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
      });

      setShowCreateCustomerModal(false);

      showNotification(
        'success',
        'Customer Account Created!',
        `Email: ${newCustomer.email} • Temp Password: ${tempPassword} (Copy this and send to customer)`,
        15000 // 15 seconds for password notification
      );

      // Note: In production, you would send an email here with the login details
      console.log('Send email to:', newCustomer.email, 'with password:', tempPassword);
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      showNotification('error', 'Creation Failed', error.message || 'Failed to create customer account. Please try again.');
    }
  };

  if (!isOpen) return null;

  // Get photo URL
  const photoUrl = item.photos && item.photos.length > 0
    ? (typeof item.photos[0] === 'string' ? item.photos[0] : (item.photos[0] as any)?.url)
    : '';

  return (
    <>
      <style>{`
        .hover-bg-light:hover {
          background-color: #f1faff;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .menu-item:hover .bi-chevron-right {
          transform: translateX(3px);
          transition: transform 0.15s ease;
        }
        .customer-dropdown-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .customer-dropdown-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .customer-dropdown-scroll::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .customer-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary">
            <h3 className="modal-title text-white">
              <i className="bi bi-pencil-square me-2"></i>
              Add Item Details
            </h3>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-light-info mb-5">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Ghana Team:</strong> Add complete item details including tracking number, dimensions, weight, costs, and customer assignment.
              </div>

              <div className="row">
                {/* Image Preview - LARGER */}
                <div className="col-md-5 mb-5">
                  <div className="card card-flush">
                    <div className="card-body p-3">
                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt="Item"
                            className="img-fluid rounded w-100 cursor-pointer"
                            style={{ minHeight: '400px', objectFit: 'contain' }}
                            onClick={() => window.open(photoUrl, '_blank')}
                          />
                          <div className="text-center mt-3 text-muted">
                            <small>
                              <i className="bi bi-arrows-fullscreen me-1"></i>
                              Click image to view full size
                            </small>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-10 text-muted">
                          <i className="bi bi-image fs-3x"></i>
                          <div className="mt-3">No photo available</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="col-md-7">
                  {/* Customer Search & Select */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label required mb-0">Customer</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-light-primary"
                        onClick={() => setShowCreateCustomerModal(true)}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Create New Customer
                      </button>
                    </div>

                    {/* Customer Dropdown */}
                    <select
                      name="customerId"
                      className="form-select form-select-lg"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a customer...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>

                    <div className="form-text">
                      {customers.length === 0 ? (
                        <span className="text-danger">
                          <i className="bi bi-exclamation-circle me-1"></i>
                          No customers found. Click "Create New Customer" to add one.
                        </span>
                      ) : (
                        <>
                          <i className="bi bi-info-circle me-1"></i>
                          {customers.length} customer{customers.length !== 1 ? 's' : ''} available
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tracking Number */}
                  <div className="mb-4">
                    <label className="form-label required">Tracking Number</label>
                    <input
                      type="text"
                      name="trackingNumber"
                      className="form-control form-control-lg"
                      placeholder="e.g., TRACK001"
                      value={formData.trackingNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="form-label required">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control form-control-lg"
                      placeholder="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      required
                    />
                    <div className="form-text">
                      Number of items with this tracking number
                    </div>
                  </div>

                  {/* Item Name - OPTIONAL */}
                  <div className="mb-4">
                    <label className="form-label">Item Name (Optional)</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-lg"
                      placeholder="e.g., Electronics, Furniture"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Receiving Date */}
                  <div className="mb-4">
                    <label className="form-label required">Receiving Date</label>
                    <input
                      type="date"
                      name="receivingDate"
                      className="form-control form-control-lg"
                      value={formData.receivingDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Shipping Method */}
                  <div className="mb-4">
                    <label className="form-label required">Shipping Method</label>
                    <div className="d-flex gap-4">
                      <div className="form-check form-check-custom form-check-solid">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="shippingMethod"
                          value="sea"
                          checked={formData.shippingMethod === 'sea'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">
                          <i className="bi bi-water text-primary me-2"></i>
                          <strong>Sea Shipping</strong>
                        </label>
                      </div>
                      <div className="form-check form-check-custom form-check-solid">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="shippingMethod"
                          value="air"
                          checked={formData.shippingMethod === 'air'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">
                          <i className="bi bi-airplane text-success me-2"></i>
                          <strong>Air Shipping</strong>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Dimensions - ONLY FOR SEA SHIPPING */}
                  {formData.shippingMethod === 'sea' && (
                    <>
                      <div className="mb-4">
                        <label className="form-label required">Dimensions (L × W × H)</label>
                        <div className="row g-2">
                          <div className="col-3">
                            <input
                              type="number"
                              name="length"
                              className="form-control form-control-lg"
                              placeholder="Length"
                              value={formData.length}
                              onChange={handleChange}
                              step="0.01"
                              required
                            />
                            <div className="form-text">L</div>
                          </div>
                          <div className="col-3">
                            <input
                              type="number"
                              name="width"
                              className="form-control form-control-lg"
                              placeholder="Width"
                              value={formData.width}
                              onChange={handleChange}
                              step="0.01"
                              required
                            />
                            <div className="form-text">W</div>
                          </div>
                          <div className="col-3">
                            <input
                              type="number"
                              name="height"
                              className="form-control form-control-lg"
                              placeholder="Height"
                              value={formData.height}
                              onChange={handleChange}
                              step="0.01"
                              required
                            />
                            <div className="form-text">H</div>
                          </div>
                          <div className="col-3">
                            <select
                              name="dimensionUnit"
                              className="form-select form-select-lg"
                              value={formData.dimensionUnit}
                              onChange={handleChange}
                            >
                              <option value="cm">cm</option>
                              <option value="inches">inches</option>
                            </select>
                            <div className="form-text">Unit</div>
                          </div>
                        </div>
                      </div>

                      {/* CBM (Auto-calculated) */}
                      {cbm > 0 && (
                        <div className="mb-4">
                          <div className="alert alert-light-success">
                            <strong>CBM (Auto-calculated):</strong> {cbm.toFixed(6)} m³
                            <div className="text-muted fs-7 mt-1">
                              Formula: (L × W × H) /{' '}
                              {formData.dimensionUnit === 'cm' ? '1,000,000' : '61,024'}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Weight - ONLY FOR AIR SHIPPING */}
                  {formData.shippingMethod === 'air' && (
                    <div className="mb-4">
                      <label className="form-label required">
                        Weight (Required for Air Shipping)
                      </label>
                      <div className="row g-2">
                        <div className="col-8">
                          <input
                            type="number"
                            name="weight"
                            className="form-control form-control-lg"
                            placeholder="Enter weight"
                            value={formData.weight}
                            onChange={handleChange}
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-4">
                          <select
                            name="weightUnit"
                            className="form-select form-select-lg"
                            value={formData.weightUnit}
                            onChange={handleChange}
                          >
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cost - AUTO-CALCULATED */}
                  <div className="mb-4">
                    <label className="form-label">
                      Cost (Auto-calculated based on{' '}
                      {formData.shippingMethod === 'sea' ? 'CBM' : 'Weight'})
                    </label>
                    <div className="card bg-light-success">
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold">USD:</span>
                          <span className="fs-3 fw-bolder text-success">
                            ${calculatedCostUSD.toFixed(2)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Cedis:</span>
                          <span className="fs-5 fw-bold text-success">
                            GH₵ {calculatedCostCedis.toFixed(2)}
                          </span>
                        </div>
                        <div className="separator my-3"></div>
                        <div className="text-muted fs-7">
                          {formData.shippingMethod === 'sea' ? (
                            <>
                              <i className="bi bi-water me-2"></i>
                              Sea: {cbm.toFixed(6)} CBM × ${CBM_RATE_SEA}/CBM
                            </>
                          ) : (
                            <>
                              <i className="bi bi-airplane me-2"></i>
                              Air: {formData.weight || 0} kg × ${WEIGHT_RATE_AIR}/kg
                            </>
                          )}
                        </div>
                        <div className="text-muted fs-7 mt-1">
                          Exchange Rate: 1 USD = {EXCHANGE_RATE} GHS
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="alert alert-light-info mt-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle fs-2 me-3"></i>
                  <div>
                    <strong>Item will be updated with:</strong>
                    <br />
                    Status: <span className="badge badge-light-primary">China Warehouse</span>
                    {' • '}
                    Received: {formData.receivingDate}
                    {cbm > 0 && ` • CBM: ${cbm.toFixed(6)}`}
                    {' • '}
                    Shipping: {formData.shippingMethod.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Save Item Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success">
                <h3 className="modal-title text-white">
                  <i className="bi bi-person-plus me-2"></i>
                  Create New Customer Account
                </h3>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateCustomerModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="alert alert-light-success mb-5">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Create a new customer account.</strong> A temporary password will be generated and shown to you. Send this to the customer via email/SMS so they can log in and complete their profile.
                </div>

                {/* Customer Name */}
                <div className="mb-4">
                  <label className="form-label required">Customer Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="e.g., John Doe"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="form-label required">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="e.g., john@example.com"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <div className="form-text">
                    Customer will use this email to log in
                  </div>
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    className="form-control form-control-lg"
                    placeholder="e.g., +233 XX XXX XXXX"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="alert alert-light-warning">
                  <i className="bi bi-shield-lock me-2"></i>
                  <strong>Security Note:</strong> A temporary password will be generated. Make sure to send it to the customer securely via email or SMS.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowCreateCustomerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleCreateCustomer}
                >
                  <i className="bi bi-person-check me-2"></i>
                  Create Customer Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999, marginTop: '70px' }}
        >
          <div
            className={`alert alert-dismissible fade show shadow-lg d-flex align-items-center ${
              notification.type === 'success' ? 'alert-success' :
              notification.type === 'error' ? 'alert-danger' :
              notification.type === 'warning' ? 'alert-warning' :
              'alert-info'
            }`}
            role="alert"
            style={{ minWidth: '400px', maxWidth: '500px' }}
          >
            <i className={`bi fs-2 me-3 ${
              notification.type === 'success' ? 'bi-check-circle-fill' :
              notification.type === 'error' ? 'bi-x-circle-fill' :
              notification.type === 'warning' ? 'bi-exclamation-triangle-fill' :
              'bi-info-circle-fill'
            }`}></i>
            <div className="flex-grow-1">
              <h5 className="alert-heading mb-1">{notification.title}</h5>
              <div className="mb-0">{notification.message}</div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotification(null)}
            ></button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
