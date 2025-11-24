import { useState, useEffect } from 'react';
import { getAllCustomers, getItemsByCustomerId, updateItem } from '../../services/airtable';
import type { User, Item } from '../../types/index';

export default function PackagingPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [cartonNumber, setCartonNumber] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Load items when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerItems(selectedCustomer.id);
    } else {
      setItems([]);
      setSelectedItemIds(new Set());
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const customersList = await getAllCustomers();
      setCustomers(customersList);
    } catch (error) {
      console.error('Failed to load customers:', error);
      alert('Failed to load customers. Please refresh the page.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadCustomerItems = async (customerId: string) => {
    try {
      setLoadingItems(true);
      const customerItems = await getItemsByCustomerId(customerId);

      // Filter items that are in china_warehouse and don't have a carton number yet
      const availableItems = customerItems.filter(
        (item) => item.status === 'china_warehouse' && !item.cartonNumber
      );

      setItems(availableItems);
      setSelectedItemIds(new Set());
    } catch (error) {
      console.error('Failed to load items:', error);
      alert('Failed to load items. Please try again.');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    const customer = customers.find((c) => c.id === customerId) || null;
    setSelectedCustomer(customer);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  const selectAll = () => {
    if (selectedItemIds.size === items.length) {
      // Deselect all
      setSelectedItemIds(new Set());
    } else {
      // Select all
      setSelectedItemIds(new Set(items.map((item) => item.id)));
    }
  };

  const generateCartonNumber = () => {
    // Generate carton number format: CTN-YYYYMMDD-XXX
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    const generated = `CTN-${dateStr}-${randomNum}`;
    setCartonNumber(generated);
  };

  const handlePackageItems = async () => {
    if (selectedItemIds.size === 0) {
      alert('Please select at least one item to package.');
      return;
    }

    if (!cartonNumber.trim()) {
      alert('Please generate or enter a carton number.');
      return;
    }

    if (!window.confirm(`Package ${selectedItemIds.size} item(s) with carton number ${cartonNumber}?`)) {
      return;
    }

    setIsPackaging(true);

    try {
      // Update all selected items with the carton number
      const updatePromises = Array.from(selectedItemIds).map((itemId) =>
        updateItem(itemId, { cartonNumber })
      );

      await Promise.all(updatePromises);

      alert(
        `✅ Successfully packaged ${selectedItemIds.size} item(s)!\n\n` +
          `📦 Carton Number: ${cartonNumber}\n` +
          `👤 Customer: ${selectedCustomer?.name}\n\n` +
          `Next Steps:\n` +
          `1. Print the carton label\n` +
          `2. Attach label to the package\n` +
          `3. Store package in warehouse\n` +
          `4. When ready to ship, assign to container`
      );

      // Reload items to refresh the list
      if (selectedCustomer) {
        await loadCustomerItems(selectedCustomer.id);
      }

      // Clear selections
      setSelectedItemIds(new Set());
      setCartonNumber('');
    } catch (error) {
      console.error('Failed to package items:', error);
      alert('Failed to package items. Please try again.');
    } finally {
      setIsPackaging(false);
    }
  };

  const handlePrintLabel = () => {
    if (!cartonNumber.trim()) {
      alert('Please generate or enter a carton number first.');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select a customer first.');
      return;
    }

    // Create a printable label
    const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
    const totalCBM = selectedItems.reduce((sum, item) => sum + item.cbm, 0);
    const totalCost = selectedItems.reduce((sum, item) => sum + item.costUSD, 0);

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Carton Label - ${cartonNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .label {
                border: 3px solid #000;
                padding: 30px;
                margin-bottom: 20px;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .carton-number {
                font-size: 36px;
                font-weight: bold;
                margin: 10px 0;
              }
              .barcode {
                font-family: 'Courier New', monospace;
                font-size: 24px;
                letter-spacing: 2px;
                margin: 10px 0;
              }
              .section {
                margin: 15px 0;
                padding: 10px;
                background: #f5f5f5;
              }
              .section-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 5px;
              }
              .section-content {
                font-size: 16px;
              }
              .items-list {
                margin-top: 20px;
              }
              .items-list table {
                width: 100%;
                border-collapse: collapse;
              }
              .items-list th,
              .items-list td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                font-size: 12px;
              }
              .items-list th {
                background-color: #000;
                color: white;
              }
              @media print {
                body {
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="header">
                <h1>AFREQ LOGISTICS</h1>
                <div class="carton-number">${cartonNumber}</div>
                <div class="barcode">||||| ${cartonNumber} |||||</div>
              </div>

              <div class="section">
                <div class="section-title">CUSTOMER INFORMATION</div>
                <div class="section-content">
                  <strong>Name:</strong> ${selectedCustomer.name}<br>
                  <strong>Email:</strong> ${selectedCustomer.email}<br>
                  ${selectedCustomer.phone ? `<strong>Phone:</strong> ${selectedCustomer.phone}<br>` : ''}
                  ${selectedCustomer.address ? `<strong>Address:</strong> ${selectedCustomer.address}<br>` : ''}
                </div>
              </div>

              <div class="section">
                <div class="section-title">PACKAGE SUMMARY</div>
                <div class="section-content">
                  <strong>Number of Items:</strong> ${selectedItems.length}<br>
                  <strong>Total CBM:</strong> ${totalCBM.toFixed(6)} m³<br>
                  <strong>Total Cost:</strong> $${totalCost.toFixed(2)} USD<br>
                  <strong>Packaged Date:</strong> ${new Date().toLocaleDateString()}<br>
                  <strong>Status:</strong> China Warehouse
                </div>
              </div>

              <div class="items-list">
                <div class="section-title">ITEMS IN THIS CARTON</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tracking Number</th>
                      <th>Item Name</th>
                      <th>Dimensions</th>
                      <th>CBM</th>
                      <th>Cost USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedItems
                      .map(
                        (item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.trackingNumber}</td>
                        <td>${item.name || 'N/A'}</td>
                        <td>${item.length} × ${item.width} × ${item.height} ${item.dimensionUnit}</td>
                        <td>${item.cbm.toFixed(6)}</td>
                        <td>$${item.costUSD.toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; text-align: center; font-size: 12px;">
                <strong>AFREQ Delivery Tracking System</strong> | China to Ghana Logistics
              </div>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                Print Label
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
                Close
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const calculateTotals = () => {
    const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
    return {
      count: selectedItems.length,
      totalCBM: selectedItems.reduce((sum, item) => sum + item.cbm, 0),
      totalCostUSD: selectedItems.reduce((sum, item) => sum + item.costUSD, 0),
      totalCostCedis: selectedItems.reduce((sum, item) => sum + item.costCedis, 0),
    };
  };

  const totals = calculateTotals();

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Packaging & Consolidation
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">China Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Packaging</li>
            </ul>
          </div>

          {selectedItemIds.size > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-primary fs-6">
                {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Step 1: Select Customer */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">Step 1: Select Customer</h3>
            </div>
            <div className="card-body">
              {loadingCustomers ? (
                <div className="d-flex align-items-center">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  <span className="text-muted">Loading customers...</span>
                </div>
              ) : (
                <>
                  <label className="form-label required">Customer</label>
                  <select
                    className="form-select form-select-lg"
                    value={selectedCustomer?.id || ''}
                    onChange={handleCustomerChange}
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
          </div>

          {/* Step 2: Select Items */}
          {selectedCustomer && (
            <div className="card mb-5">
              <div className="card-header">
                <h3 className="card-title">
                  Step 2: Select Items to Package
                </h3>
                {items.length > 0 && (
                  <div className="card-toolbar">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={selectAll}
                    >
                      {selectedItemIds.size === items.length ? (
                        <>
                          <i className="bi bi-x-square me-1"></i>
                          Deselect All
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-square me-1"></i>
                          Select All
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body">
                {loadingItems ? (
                  <div className="text-center py-10">
                    <span className="spinner-border spinner-border-lg me-2"></span>
                    <div className="mt-3 text-muted">Loading items...</div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    No items available for packaging. All items for this customer either:
                    <ul className="mt-2 mb-0">
                      <li>Have already been packaged (have carton numbers)</li>
                      <li>Are not in the China warehouse yet</li>
                    </ul>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-row-bordered table-row-gray-300 gy-4">
                      <thead>
                        <tr className="fw-bold text-muted bg-light">
                          <th className="w-25px">
                            <div className="form-check form-check-sm form-check-custom">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedItemIds.size === items.length}
                                onChange={selectAll}
                              />
                            </div>
                          </th>
                          <th>Photo</th>
                          <th>Tracking Number</th>
                          <th>Item Name</th>
                          <th>Dimensions</th>
                          <th>CBM</th>
                          <th>Shipping</th>
                          <th>Cost USD</th>
                          <th>Cost Cedis</th>
                          <th>Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="form-check form-check-sm form-check-custom">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedItemIds.has(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                />
                              </div>
                            </td>
                            <td>
                              {item.photos && item.photos.length > 0 ? (
                                <img
                                  src={item.photos[0]}
                                  alt="Item"
                                  className="rounded"
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-light rounded d-flex align-items-center justify-content-center"
                                  style={{ width: '50px', height: '50px' }}
                                >
                                  <i className="bi bi-image text-muted"></i>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="fw-bold">{item.trackingNumber}</span>
                            </td>
                            <td>{item.name || <span className="text-muted">N/A</span>}</td>
                            <td>
                              <span className="text-muted">
                                {item.length} × {item.width} × {item.height} {item.dimensionUnit}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-light">{item.cbm.toFixed(6)} m³</span>
                            </td>
                            <td>
                              <span className={`badge badge-light-${item.shippingMethod === 'sea' ? 'info' : 'primary'}`}>
                                {item.shippingMethod.toUpperCase()}
                              </span>
                            </td>
                            <td>${item.costUSD.toFixed(2)}</td>
                            <td>₵{item.costCedis.toFixed(2)}</td>
                            <td className="text-muted">
                              {new Date(item.receivingDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Generate Carton Number & Package */}
          {selectedCustomer && items.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Step 3: Generate Carton Number & Package</h3>
              </div>
              <div className="card-body">
                <div className="row g-5">
                  {/* Carton Number */}
                  <div className="col-lg-6">
                    <label className="form-label required">Carton Number</label>
                    <div className="input-group input-group-lg">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="CTN-YYYYMMDD-XXX"
                        value={cartonNumber}
                        onChange={(e) => setCartonNumber(e.target.value)}
                      />
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={generateCartonNumber}
                      >
                        <i className="bi bi-magic me-1"></i>
                        Generate
                      </button>
                    </div>
                    <div className="form-text">
                      Auto-generate or manually enter a unique carton number
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="col-lg-6">
                    <label className="form-label">Package Summary</label>
                    <div className="bg-light p-4 rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Selected Items:</span>
                        <strong>{totals.count}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total CBM:</span>
                        <strong>{totals.totalCBM.toFixed(6)} m³</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Cost USD:</span>
                        <strong>${totals.totalCostUSD.toFixed(2)}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Total Cost Cedis:</span>
                        <strong>₵{totals.totalCostCedis.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="separator my-6"></div>

                <div className="d-flex justify-content-end gap-3">
                  <button
                    className="btn btn-light btn-lg"
                    onClick={handlePrintLabel}
                    disabled={selectedItemIds.size === 0 || !cartonNumber.trim()}
                  >
                    <i className="bi bi-printer me-2"></i>
                    Preview Label
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handlePackageItems}
                    disabled={isPackaging || selectedItemIds.size === 0 || !cartonNumber.trim()}
                  >
                    {isPackaging ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Packaging...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-seam me-2"></i>
                        Package {selectedItemIds.size} Item{selectedItemIds.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
