import { useState, useEffect } from 'react';
import { getAllItems, getAllCustomers, updateItem } from '../../services/airtable';
import { getFirstPhotoUrl } from '../../utils/photos';
import type { Item, User, ShipmentStatus } from '../../types/index';

export default function SortingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, customersData] = await Promise.all([
        getAllItems(),
        getAllCustomers(),
      ]);
      // Sort items by date descending (newest first)
      const sortedItems = itemsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.receivingDate).getTime();
        const dateB = new Date(b.createdAt || b.receivingDate).getTime();
        return dateB - dateA;
      });
      setItems(sortedItems);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    // customerId might be an array (linked record from Airtable)
    const actualId = Array.isArray(customerId) ? customerId[0] : customerId;
    const customer = customers.find((c) => c.id === actualId);
    return customer?.name || 'Unknown Customer';
  };

  const filteredItems = items.filter((item) => {
    // Status filter
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const customerName = getCustomerName(item.customerId).toLowerCase();
      return (
        item.trackingNumber.toLowerCase().includes(query) ||
        customerName.includes(query) ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.containerNumber && item.containerNumber.toLowerCase().includes(query)) ||
        (item.cartonNumber && item.cartonNumber.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: ShipmentStatus) => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item.');
      return;
    }

    if (!window.confirm(`Update ${selectedItems.size} item(s) to status: ${newStatus}?`)) {
      return;
    }

    setIsUpdating(true);

    try {
      const updatePromises = Array.from(selectedItems).map((itemId) =>
        updateItem(itemId, { status: newStatus })
      );

      await Promise.all(updatePromises);

      alert(`✅ Successfully updated ${selectedItems.size} item(s) to ${newStatus}!`);

      // Reload data
      await loadData();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to update items:', error);
      alert('Failed to update items. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDamagedMissing = async (itemId: string, type: 'damaged' | 'missing') => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const field = type === 'damaged' ? 'isDamaged' : 'isMissing';
    const currentValue = item[field];

    if (!window.confirm(`Mark item ${item.trackingNumber} as ${type}?`)) {
      return;
    }

    try {
      await updateItem(itemId, { [field]: !currentValue });
      alert(`✅ Item marked as ${type}!`);
      await loadData();
    } catch (error) {
      console.error(`Failed to mark item as ${type}:`, error);
      alert(`Failed to mark item as ${type}. Please try again.`);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const statusConfig: Record<ShipmentStatus, { class: string; label: string }> = {
      china_warehouse: { class: 'badge-light-info', label: 'China Warehouse' },
      in_transit: { class: 'badge-light-primary', label: 'In Transit' },
      arrived_ghana: { class: 'badge-light-warning', label: 'Arrived Ghana' },
      ready_for_pickup: { class: 'badge-light-success', label: 'Ready for Pickup' },
      delivered: { class: 'badge-success', label: 'Delivered' },
      picked_up: { class: 'badge-success', label: 'Picked Up' },
    };

    const config = statusConfig[status];
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getStatusCounts = () => {
    return {
      total: items.length,
      china_warehouse: items.filter((i) => i.status === 'china_warehouse').length,
      in_transit: items.filter((i) => i.status === 'in_transit').length,
      arrived_ghana: items.filter((i) => i.status === 'arrived_ghana').length,
      ready_for_pickup: items.filter((i) => i.status === 'ready_for_pickup').length,
      delivered: items.filter((i) => i.status === 'delivered').length,
      damaged: items.filter((i) => i.isDamaged).length,
      missing: items.filter((i) => i.isMissing).length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Sorting & Scanning
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Ghana Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Sorting</li>
            </ul>
          </div>

          {selectedItems.size > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-primary fs-6">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Stats Cards */}
          <div className="row g-5 mb-5">
            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-6 text-gray-400">Total Items</div>
                  <div className="fs-2x fw-bold text-gray-800">{counts.total}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-6 text-warning">Arrived Ghana</div>
                  <div className="fs-2x fw-bold text-warning">{counts.arrived_ghana}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-danger">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-6 text-danger">Damaged</div>
                  <div className="fs-2x fw-bold text-danger">{counts.damaged}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-dark">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-6 text-dark">Missing</div>
                  <div className="fs-2x fw-bold text-dark">{counts.missing}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card mb-5">
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by tracking number, customer, carton number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Status Filter</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
                  >
                    <option value="all">All Statuses ({counts.total})</option>
                    <option value="china_warehouse">China Warehouse ({counts.china_warehouse})</option>
                    <option value="in_transit">In Transit ({counts.in_transit})</option>
                    <option value="arrived_ghana">Arrived Ghana ({counts.arrived_ghana})</option>
                    <option value="ready_for_pickup">Ready for Pickup ({counts.ready_for_pickup})</option>
                    <option value="delivered">Delivered ({counts.delivered})</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button className="btn btn-light w-100" onClick={() => loadData()}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="card mb-5">
              <div className="card-header">
                <h3 className="card-title">Bulk Actions ({selectedItems.size} items selected)</h3>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-3">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleBulkStatusUpdate('in_transit')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-truck me-1"></i>
                    Mark as In Transit
                  </button>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => handleBulkStatusUpdate('arrived_ghana')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-geo-alt me-1"></i>
                    Mark as Arrived Ghana
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleBulkStatusUpdate('ready_for_pickup')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Mark as Ready for Pickup
                  </button>
                  <button
                    className="btn btn-sm btn-dark"
                    onClick={() => handleBulkStatusUpdate('delivered')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-box-seam me-1"></i>
                    Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Items ({filteredItems.length})
              </h3>
              {filteredItems.length > 0 && (
                <div className="card-toolbar">
                  <button className="btn btn-sm btn-light" onClick={selectAll}>
                    {selectedItems.size === filteredItems.length ? (
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
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading items...</div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  No items found matching your filters.
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
                              checked={selectedItems.size === filteredItems.length}
                              onChange={selectAll}
                            />
                          </div>
                        </th>
                        <th>Photo</th>
                        <th>Tracking #</th>
                        <th>Customer</th>
                        <th>Carton #</th>
                        <th>Container #</th>
                        <th>Status</th>
                        <th>CBM</th>
                        <th>Cost</th>
                        <th>Flags</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="form-check form-check-sm form-check-custom">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItemSelection(item.id)}
                              />
                            </div>
                          </td>
                          <td>
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={getFirstPhotoUrl(item.photos) || ''}
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
                            {item.name && (
                              <div className="text-muted fs-7">{item.name}</div>
                            )}
                          </td>
                          <td>{getCustomerName(item.customerId)}</td>
                          <td>
                            {item.cartonNumber ? (
                              <span className="badge badge-light">{item.cartonNumber}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {item.containerNumber ? (
                              <span className="badge badge-light-info">{item.containerNumber}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>
                            {item.cbm ? (
                              <span className="badge badge-light">{item.cbm.toFixed(6)} m³</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div>${item.costUSD ? item.costUSD.toFixed(2) : '0.00'}</div>
                            <div className="text-muted fs-7">₵{item.costCedis ? item.costCedis.toFixed(2) : '0.00'}</div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {item.isDamaged && (
                                <span className="badge badge-danger">Damaged</span>
                              )}
                              {item.isMissing && (
                                <span className="badge badge-dark">Missing</span>
                              )}
                              {!item.isDamaged && !item.isMissing && (
                                <span className="text-muted">-</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-light btn-icon"
                                data-bs-toggle="dropdown"
                              >
                                <i className="bi bi-three-dots-vertical"></i>
                              </button>
                              <div className="dropdown-menu">
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleMarkDamagedMissing(item.id, 'damaged')}
                                >
                                  <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                                  {item.isDamaged ? 'Unmark' : 'Mark'} as Damaged
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleMarkDamagedMissing(item.id, 'missing')}
                                >
                                  <i className="bi bi-x-circle me-2 text-dark"></i>
                                  {item.isMissing ? 'Unmark' : 'Mark'} as Missing
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
