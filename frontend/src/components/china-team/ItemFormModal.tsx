import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { calculateCBM } from '../../utils/calculations';
import { getAllCustomers } from '../../services/airtable';
import type { Item, User } from '../../types/index';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<Item>) => Promise<void>;
  imageUrl: string;
  receivingDate: string;
  onNotification?: (type: 'success'|'error'|'warning'|'info', title: string, message: string) => void;
}

export default function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  imageUrl,
  receivingDate,
  onNotification,
}: ItemFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    trackingNumber: '',
    customerId: '',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'cm' as 'cm' | 'inches',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    shippingMethod: 'sea' as 'sea' | 'air',
  });

  const [cbm, setCbm] = useState<number>(0);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [costCedis, setCostCedis] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const EXCHANGE_RATE = 15; // USD to GHS
  const CBM_RATE_SEA = 1000; // $1000 per CBM for sea shipping
  const WEIGHT_RATE_AIR = 5; // $5 per kg for air shipping

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomersList();
    }
  }, [isOpen]);

  const loadCustomersList = async () => {
    try {
      setLoadingCustomers(true);
      const customersList = await getAllCustomers();
      setCustomers(customersList);
    } catch (error) {
      console.error('Failed to load customers:', error);
      if (onNotification) {
        onNotification('error', 'Error', 'Failed to load customers. Please refresh the page.');
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

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

    setCalculatedCost(costUSD);
    setCostCedis(costUSD * EXCHANGE_RATE);
  }, [cbm, formData.weight, formData.shippingMethod]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemData: Partial<Item> = {
        name: formData.name || undefined, // Optional: only include if provided
        trackingNumber: formData.trackingNumber,
        customerId: formData.customerId,
        receivingDate,
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        dimensionUnit: formData.dimensionUnit,
        cbm,
        shippingMethod: formData.shippingMethod,
        costUSD: calculatedCost,
        costCedis,
        photos: [imageUrl],
        status: 'china_warehouse',
        isDamaged: false,
        isMissing: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only include weight for air shipping
      if (formData.shippingMethod === 'air' && formData.weight) {
        itemData.weight = parseFloat(formData.weight);
        itemData.weightUnit = formData.weightUnit;
      }

      await onSubmit(itemData);

      // Get customer name for success message
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const customerName = selectedCustomer ? selectedCustomer.name : formData.customerId;

      // Show success message with where item is saved
      if (onNotification) {
        onNotification('success', 'Item Saved!', `Item ${formData.trackingNumber} saved successfully for ${customerName}`);
      }

      // Reset form
      setFormData({
        name: '',
        trackingNumber: '',
        customerId: '',
        length: '',
        width: '',
        height: '',
        dimensionUnit: 'cm',
        weight: '',
        weightUnit: 'kg',
        shippingMethod: 'sea',
      });

      onClose();
    } catch (error: any) {
      console.error('Failed to submit item:', error);

      // Show detailed error message
      let errorMessage = 'Failed to create item. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check console for details.';
      }

      if (onNotification) {
        onNotification('error', 'Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Add Item Details</h3>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                {/* Image Preview - LARGER */}
                <div className="col-md-5 mb-5">
                  <div className="card card-flush">
                    <div className="card-body p-3">
                      <img
                        src={imageUrl}
                        alt="Item"
                        className="img-fluid rounded w-100 cursor-pointer"
                        style={{ minHeight: '400px', objectFit: 'contain' }}
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                      <div className="text-center mt-3 text-muted">
                        <small>
                          <i className="bi bi-arrows-fullscreen me-1"></i>
                          Click image to view full size
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="col-md-7">
                  {/* Item Name - OPTIONAL */}
                  <div className="mb-4">
                    <label className="form-label">Item Name (Optional)</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g., Laptop, Phone, Shoes (optional)"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <div className="form-text">
                      Leave blank if you don't know the item name
                    </div>
                  </div>

                  {/* Tracking Number */}
                  <div className="mb-4">
                    <label className="form-label required">Tracking Number</label>
                    <input
                      type="text"
                      name="trackingNumber"
                      className="form-control"
                      placeholder="AFQ12345678"
                      value={formData.trackingNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Customer Dropdown */}
                  <div className="mb-4">
                    <label className="form-label required">Customer</label>
                    {loadingCustomers ? (
                      <div className="d-flex align-items-center">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        <span className="text-muted">Loading customers...</span>
                      </div>
                    ) : (
                      <>
                        <select
                          name="customerId"
                          className="form-select"
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
                              No customers found. Please create customers in Airtable first.
                            </span>
                          ) : (
                            `${customers.length} customer${customers.length !== 1 ? 's' : ''} available`
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Shipping Method - NEW */}
                  <div className="mb-4">
                    <label className="form-label required">Shipping Method</label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
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
                          <div className="text-muted fs-7">
                            Cost calculated by CBM (${CBM_RATE_SEA}/CBM)
                          </div>
                        </label>
                      </div>
                      <div className="form-check">
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
                          <div className="text-muted fs-7">
                            Cost calculated by weight (${WEIGHT_RATE_AIR}/kg)
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="mb-4">
                    <label className="form-label required">Dimensions (L × W × H)</label>
                    <div className="row g-2">
                      <div className="col-3">
                        <input
                          type="number"
                          name="length"
                          className="form-control"
                          placeholder="Length"
                          value={formData.length}
                          onChange={handleChange}
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-3">
                        <input
                          type="number"
                          name="width"
                          className="form-control"
                          placeholder="Width"
                          value={formData.width}
                          onChange={handleChange}
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-3">
                        <input
                          type="number"
                          name="height"
                          className="form-control"
                          placeholder="Height"
                          value={formData.height}
                          onChange={handleChange}
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-3">
                        <select
                          name="dimensionUnit"
                          className="form-select"
                          value={formData.dimensionUnit}
                          onChange={handleChange}
                        >
                          <option value="cm">cm</option>
                          <option value="inches">inches</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CBM (Auto-calculated) */}
                  <div className="mb-4">
                    <label className="form-label">CBM (Auto-calculated)</label>
                    <input
                      type="text"
                      className="form-control bg-light fw-bold"
                      value={cbm.toFixed(6)}
                      readOnly
                    />
                    <div className="form-text">
                      Cubic Meter = (L × W × H) /{' '}
                      {formData.dimensionUnit === 'cm' ? '1,000,000' : '61,024'}
                    </div>
                  </div>

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
                            className="form-control"
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
                            className="form-select"
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
                            ${calculatedCost.toFixed(2)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Cedis:</span>
                          <span className="fs-5 fw-bold text-success">
                            GH₵ {costCedis.toFixed(2)}
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

              {/* Summary - NO CONTAINER NUMBER */}
              <div className="alert alert-light-info mt-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle fs-2 me-3"></i>
                  <div>
                    <strong>Item will be saved to:</strong>
                    <br />
                    Status: <span className="badge badge-light-primary">China Warehouse</span>
                    {' • '}
                    Received: {receivingDate}
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
                    Save Item to System
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
