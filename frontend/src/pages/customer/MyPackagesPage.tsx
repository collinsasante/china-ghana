import { useState, useEffect } from 'react';
import { getItemsByCustomerId } from '../../services/airtable';
import type { Item, ShipmentStatus } from '../../types/index';

// This would normally come from auth context
const CURRENT_USER_ID = 'rec_customer_001'; // Placeholder

export default function MyPackagesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await getItemsByCustomerId(CURRENT_USER_ID);
      // Sort by date descending (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.receivingDate).getTime();
        const dateB = new Date(b.createdAt || b.receivingDate).getTime();
        return dateB - dateA;
      });
      setItems(sortedData);
    } catch (error) {
      console.error('Failed to load packages:', error);
      alert('Failed to load your packages. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.trackingNumber.toLowerCase().includes(query) ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.containerNumber && item.containerNumber.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getStatusBadge = (status: ShipmentStatus) => {
    const config: Record<ShipmentStatus, { class: string; label: string; icon: string }> = {
      china_warehouse: { class: 'badge-light-warning', label: 'In China Warehouse', icon: 'bi-building' },
      in_transit: { class: 'badge-light-info', label: 'In Transit to Ghana', icon: 'bi-truck' },
      arrived_ghana: { class: 'badge-light-primary', label: 'Arrived in Ghana', icon: 'bi-geo-alt' },
      ready_for_pickup: { class: 'badge-light-success', label: 'Ready for Pickup', icon: 'bi-box-seam' },
      delivered: { class: 'badge-success', label: 'Delivered', icon: 'bi-check-circle' },
      picked_up: { class: 'badge-success', label: 'Picked Up', icon: 'bi-check-circle-fill' },
    };

    const statusConfig = config[status];
    return (
      <span className={`badge ${statusConfig.class}`}>
        <i className={`bi ${statusConfig.icon} me-1`}></i>
        {statusConfig.label}
      </span>
    );
  };

  const getStatusCounts = () => {
    return {
      total: items.length,
      china_warehouse: items.filter((i) => i.status === 'china_warehouse').length,
      in_transit: items.filter((i) => i.status === 'in_transit').length,
      arrived_ghana: items.filter((i) => i.status === 'arrived_ghana').length,
      ready_for_pickup: items.filter((i) => i.status === 'ready_for_pickup').length,
      delivered: items.filter((i) => i.status === 'delivered' || i.status === 'picked_up').length,
    };
  };

  const handleViewDetails = (item: Item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const counts = getStatusCounts();
  const totalValueUSD = items.reduce((sum, item) => sum + (item.costUSD || 0), 0);
  const totalValueCedis = items.reduce((sum, item) => sum + (item.costCedis || 0), 0);
  // const totalCBM = items.reduce((sum, item) => sum + (item.cbm || 0), 0); // Unused for now

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Dashboard
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Customer</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Dashboard</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-light-primary"
              onClick={loadPackages}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Overview Stats */}
          <div className="row g-5 g-xl-8 mb-5">
            <div className="col-xl-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-primary">
                        <i className="bi bi-box-seam fs-2x text-primary"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-gray-400">Total Packages</div>
                      <div className="fs-2x fw-bold text-gray-800">{counts.total}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3">
              <div className="card card-flush h-100 bg-light-info">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-info">
                        <i className="bi bi-truck fs-2x text-white"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-info">In Transit</div>
                      <div className="fs-2x fw-bold text-info">{counts.in_transit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3">
              <div className="card card-flush h-100 bg-light-success">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-success">
                        <i className="bi bi-check-circle fs-2x text-white"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-success">Ready to Pickup</div>
                      <div className="fs-2x fw-bold text-success">{counts.ready_for_pickup}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-dark">
                        <i className="bi bi-currency-dollar fs-2x text-dark"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-gray-400">Total Value</div>
                      <div className="fs-2x fw-bold text-gray-800">${totalValueUSD.toFixed(2)}</div>
                      <div className="fs-7 text-gray-600">₵{totalValueCedis.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Timeline */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">Shipping Timeline</h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-center flex-fill">
                  <div className={`symbol symbol-circle symbol-50px mx-auto mb-2 ${counts.china_warehouse > 0 ? 'bg-warning' : 'bg-light'}`}>
                    <i className={`bi bi-building fs-2x ${counts.china_warehouse > 0 ? 'text-white' : 'text-muted'}`}></i>
                  </div>
                  <div className="fw-bold">China Warehouse</div>
                  <div className="text-muted fs-7">{counts.china_warehouse} items</div>
                </div>

                <i className="bi bi-arrow-right fs-3 text-muted mx-3"></i>

                <div className="text-center flex-fill">
                  <div className={`symbol symbol-circle symbol-50px mx-auto mb-2 ${counts.in_transit > 0 ? 'bg-info' : 'bg-light'}`}>
                    <i className={`bi bi-truck fs-2x ${counts.in_transit > 0 ? 'text-white' : 'text-muted'}`}></i>
                  </div>
                  <div className="fw-bold">In Transit</div>
                  <div className="text-muted fs-7">{counts.in_transit} items</div>
                </div>

                <i className="bi bi-arrow-right fs-3 text-muted mx-3"></i>

                <div className="text-center flex-fill">
                  <div className={`symbol symbol-circle symbol-50px mx-auto mb-2 ${counts.arrived_ghana > 0 ? 'bg-primary' : 'bg-light'}`}>
                    <i className={`bi bi-geo-alt fs-2x ${counts.arrived_ghana > 0 ? 'text-white' : 'text-muted'}`}></i>
                  </div>
                  <div className="fw-bold">Arrived Ghana</div>
                  <div className="text-muted fs-7">{counts.arrived_ghana} items</div>
                </div>

                <i className="bi bi-arrow-right fs-3 text-muted mx-3"></i>

                <div className="text-center flex-fill">
                  <div className={`symbol symbol-circle symbol-50px mx-auto mb-2 ${counts.ready_for_pickup > 0 ? 'bg-success' : 'bg-light'}`}>
                    <i className={`bi bi-box-seam fs-2x ${counts.ready_for_pickup > 0 ? 'text-white' : 'text-muted'}`}></i>
                  </div>
                  <div className="fw-bold">Ready for Pickup</div>
                  <div className="text-muted fs-7">{counts.ready_for_pickup} items</div>
                </div>

                <i className="bi bi-arrow-right fs-3 text-muted mx-3"></i>

                <div className="text-center flex-fill">
                  <div className={`symbol symbol-circle symbol-50px mx-auto mb-2 ${counts.delivered > 0 ? 'bg-success' : 'bg-light'}`}>
                    <i className={`bi bi-check-circle-fill fs-2x ${counts.delivered > 0 ? 'text-white' : 'text-muted'}`}></i>
                  </div>
                  <div className="fw-bold">Delivered</div>
                  <div className="text-muted fs-7">{counts.delivered} items</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-5">
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label">Search</label>
                  <div className="position-relative">
                    <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
                    <input
                      type="text"
                      className="form-control ps-10"
                      placeholder="Search by tracking number, name, container..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Filter by Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
                  >
                    <option value="all">All Packages ({counts.total})</option>
                    <option value="china_warehouse">China Warehouse ({counts.china_warehouse})</option>
                    <option value="in_transit">In Transit ({counts.in_transit})</option>
                    <option value="arrived_ghana">Arrived Ghana ({counts.arrived_ghana})</option>
                    <option value="ready_for_pickup">Ready for Pickup ({counts.ready_for_pickup})</option>
                    <option value="delivered">Delivered ({counts.delivered})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Packages List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Packages ({filteredItems.length})</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading your packages...</div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="alert alert-info d-flex align-items-center">
                  <i className="bi bi-info-circle fs-2x me-3"></i>
                  <div>
                    <div className="fw-bold">No packages found</div>
                    <div className="text-muted fs-7">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : "You don't have any packages yet"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="row g-5">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="col-md-6 col-xl-4">
                      <div className="card card-flush border h-100 hover-elevate-up">
                        <div className="card-body">
                          {/* Package Photo */}
                          {item.photos && item.photos.length > 0 ? (
                            <img
                              src={
                                typeof item.photos[0] === 'string'
                                  ? item.photos[0]
                                  : (item.photos[0] as any)?.url
                              }
                              alt="Package"
                              className="w-100 rounded mb-4"
                              style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => handleViewDetails(item)}
                            />
                          ) : (
                            <div
                              className="bg-light rounded mb-4 d-flex align-items-center justify-content-center"
                              style={{ height: '200px' }}
                            >
                              <i className="bi bi-image fs-3x text-muted"></i>
                            </div>
                          )}

                          {/* Package Info */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <div className="text-gray-400 fs-7">Tracking Number</div>
                                <div className="fw-bold">{item.trackingNumber}</div>
                              </div>
                              {getStatusBadge(item.status)}
                            </div>

                            {item.name && (
                              <div className="mb-2">
                                <div className="text-gray-400 fs-7">Item Name</div>
                                <div className="text-gray-800">{item.name}</div>
                              </div>
                            )}

                            <div className="row g-2 mb-2">
                              <div className="col-6">
                                <div className="text-gray-400 fs-7">CBM</div>
                                <div className="text-gray-800 fw-bold">
                                  {item.cbm ? `${item.cbm.toFixed(4)} m³` : '-'}
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="text-gray-400 fs-7">Cost</div>
                                <div className="text-gray-800 fw-bold">
                                  ${item.costUSD?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-gray-600 fs-8">
                                  ₵{item.costCedis?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                            </div>

                            {item.containerNumber && (
                              <div className="mb-2">
                                <div className="text-gray-400 fs-7">Container</div>
                                <span className="badge badge-light-info">{item.containerNumber}</span>
                              </div>
                            )}

                            {item.cartonNumber && (
                              <div className="mb-2">
                                <div className="text-gray-400 fs-7">Carton Number</div>
                                <span className="badge badge-light">{item.cartonNumber}</span>
                              </div>
                            )}
                          </div>

                          {/* View Details Button */}
                          <button
                            className="btn btn-light-primary w-100"
                            onClick={() => handleViewDetails(item)}
                          >
                            <i className="bi bi-eye me-2"></i>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Package Details Modal */}
      {selectedItem && showDetailsModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Package Details</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Photos */}
                  <div className="col-md-5 mb-4">
                    {selectedItem.photos && selectedItem.photos.length > 0 ? (
                      <img
                        src={
                          typeof selectedItem.photos[0] === 'string'
                            ? selectedItem.photos[0]
                            : (selectedItem.photos[0] as any)?.url
                        }
                        alt="Package"
                        className="w-100 rounded"
                      />
                    ) : (
                      <div
                        className="bg-light rounded d-flex align-items-center justify-content-center"
                        style={{ height: '300px' }}
                      >
                        <i className="bi bi-image fs-3x text-muted"></i>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-md-7">
                    <div className="mb-4">
                      <h5 className="mb-3">Tracking Information</h5>
                      <table className="table table-row-bordered">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Tracking Number</td>
                            <td>{selectedItem.trackingNumber}</td>
                          </tr>
                          {selectedItem.name && (
                            <tr>
                              <td className="fw-bold">Item Name</td>
                              <td>{selectedItem.name}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="fw-bold">Status</td>
                            <td>{getStatusBadge(selectedItem.status)}</td>
                          </tr>
                          {selectedItem.containerNumber && (
                            <tr>
                              <td className="fw-bold">Container</td>
                              <td>
                                <span className="badge badge-light-info">
                                  {selectedItem.containerNumber}
                                </span>
                              </td>
                            </tr>
                          )}
                          {selectedItem.cartonNumber && (
                            <tr>
                              <td className="fw-bold">Carton Number</td>
                              <td>
                                <span className="badge badge-light">{selectedItem.cartonNumber}</span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-4">
                      <h5 className="mb-3">Dimensions & Cost</h5>
                      <table className="table table-row-bordered">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Dimensions</td>
                            <td>
                              {selectedItem.length} × {selectedItem.width} × {selectedItem.height}{' '}
                              {selectedItem.dimensionUnit}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">CBM</td>
                            <td>{selectedItem.cbm?.toFixed(6)} m³</td>
                          </tr>
                          {selectedItem.weight && (
                            <tr>
                              <td className="fw-bold">Weight</td>
                              <td>
                                {selectedItem.weight} {selectedItem.weightUnit}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td className="fw-bold">Shipping Method</td>
                            <td>
                              <span
                                className={`badge ${
                                  selectedItem.shippingMethod === 'sea'
                                    ? 'badge-light-info'
                                    : 'badge-light-primary'
                                }`}
                              >
                                {selectedItem.shippingMethod?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Cost (USD)</td>
                            <td className="fs-5 fw-bold text-primary">
                              ${selectedItem.costUSD?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Cost (GHS)</td>
                            <td className="fs-5 fw-bold text-success">
                              ₵{selectedItem.costCedis?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h5 className="mb-3">Dates</h5>
                      <table className="table table-row-bordered">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Receiving Date</td>
                            <td>{new Date(selectedItem.receivingDate).toLocaleDateString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
