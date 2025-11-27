import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getItemsByCustomerId, getInvoicesByCustomerId, getSupportRequestsByCustomerId, getActiveAnnouncements } from '../../services/airtable';
import { getFirstPhotoUrl } from '../../utils/photos';
import type { Item, Invoice, SupportRequest, Announcement } from '../../types/index';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [itemsData, invoicesData, requestsData, announcementsData] = await Promise.all([
        getItemsByCustomerId(user.id),
        getInvoicesByCustomerId(user.id),
        getSupportRequestsByCustomerId(user.id),
        getActiveAnnouncements(),
      ]);

      console.log('✅ Dashboard data loaded:', {
        items: itemsData.length,
        invoices: invoicesData.length,
        requests: requestsData.length,
        announcements: announcementsData.length
      });

      setItems(itemsData);
      setInvoices(invoicesData);
      setSupportRequests(requestsData);
      setAnnouncements(announcementsData);
    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: string) => {
    return items.filter(item => item.status === status).length;
  };

  const getPendingInvoiceAmount = () => {
    return invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const getPendingInvoiceAmountCedis = () => {
    const usdAmount = getPendingInvoiceAmount();
    return usdAmount * 15; // 1 USD = 15 GHS
  };

  const getRecentItems = () => {
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getOpenSupportRequests = () => {
    return supportRequests.filter(req => req.status === 'open' || req.status === 'in_progress').length;
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Dashboard
              </h1>
            </div>
          </div>
        </div>

        <div id="kt_app_content" className="app-content flex-column-fluid">
          <div id="kt_app_content_container" className="app-container container-xxl">
            <div className="card">
              <div className="card-body text-center py-20">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-gray-600 mt-5">Loading dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Dashboard
              </h1>
            </div>
          </div>
        </div>

        <div id="kt_app_content" className="app-content flex-column-fluid">
          <div id="kt_app_content_container" className="app-container container-xxl">
            <div className="card">
              <div className="card-body text-center py-20">
                <i className="bi bi-exclamation-triangle text-danger fs-3x mb-5"></i>
                <h3 className="text-danger mb-3">Error Loading Dashboard</h3>
                <p className="text-gray-600">{error}</p>
                <button className="btn btn-primary mt-5" onClick={loadDashboardData}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Welcome back, {user?.name}!
            </h1>
            <span className="text-muted fw-semibold fs-7 mt-1">
              Here's what's happening with your shipments
            </span>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Stats Overview */}
          <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="card card-flush h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center mb-5">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-primary">
                        <i className="ki-duotone ki-package fs-2x text-primary">
                          <span className="path1"></span>
                          <span className="path2"></span>
                          <span className="path3"></span>
                        </i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-2hx fw-bold text-gray-800">{items.length}</div>
                      <div className="fs-7 text-gray-600">Total Items</div>
                    </div>
                  </div>
                  <Link to="/items" className="btn btn-sm btn-light-primary">View Items</Link>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center mb-5">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-white">
                        <i className="ki-duotone ki-delivery-3 fs-2x text-warning">
                          <span className="path1"></span>
                          <span className="path2"></span>
                          <span className="path3"></span>
                        </i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-2hx fw-bold text-warning">{getStatusCount('in_transit')}</div>
                      <div className="fs-7 text-warning">In Transit</div>
                    </div>
                  </div>
                  <Link to="/status" className="btn btn-sm btn-light">Track Status</Link>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="card card-flush h-100 bg-light-success">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center mb-5">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-white">
                        <i className="ki-duotone ki-check-circle fs-2x text-success">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-2hx fw-bold text-success">{getStatusCount('ready_for_pickup')}</div>
                      <div className="fs-7 text-success">Ready for Pickup</div>
                    </div>
                  </div>
                  <Link to="/status" className="btn btn-sm btn-light">View Details</Link>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="card card-flush h-100 bg-light-danger">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center mb-5">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-white">
                        <i className="ki-duotone ki-bill fs-2x text-danger">
                          <span className="path1"></span>
                          <span className="path2"></span>
                          <span className="path3"></span>
                        </i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-2hx fw-bold text-danger">${getPendingInvoiceAmount().toFixed(2)}</div>
                      <div className="text-muted fs-7">₵{getPendingInvoiceAmountCedis().toFixed(2)} GHS</div>
                      <div className="fs-7 text-danger">Pending Payment</div>
                    </div>
                  </div>
                  <Link to="/invoices" className="btn btn-sm btn-light">Pay Now</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
            {/* Recent Items */}
            <div className="col-xl-8">
              <div className="card card-flush h-xl-100">
                <div className="card-header pt-7">
                  <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-800">Recent Items</span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-6">
                      Latest {getRecentItems().length} items received
                    </span>
                  </h3>
                  <div className="card-toolbar">
                    <Link to="/items" className="btn btn-sm btn-light">View All</Link>
                  </div>
                </div>
                <div className="card-body">
                  {getRecentItems().length === 0 ? (
                    <div className="text-center py-10">
                      <i className="ki-duotone ki-package fs-5x text-gray-400 mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                      </i>
                      <p className="text-gray-600">No items yet</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-row-dashed align-middle gs-0 gy-3">
                        <thead>
                          <tr className="fw-bold text-muted">
                            <th>Item</th>
                            <th>Tracking Number</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getRecentItems().map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleItemClick(item)}
                              style={{ cursor: 'pointer' }}
                              className="hover-bg-light-primary"
                            >
                              <td>
                                <div className="d-flex align-items-center">
                                  {item.photos && item.photos.length > 0 ? (
                                    <div className="symbol symbol-40px me-3">
                                      <img
                                        src={getFirstPhotoUrl(item.photos) || ''}
                                        alt="Item"
                                        className="symbol-label"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="symbol symbol-40px me-3">
                                      <div className="symbol-label bg-light">
                                        <i className="ki-duotone ki-package fs-2 text-gray-400">
                                          <span className="path1"></span>
                                          <span className="path2"></span>
                                        </i>
                                      </div>
                                    </div>
                                  )}
                                  <span className="text-gray-800 fw-bold">
                                    {item.name || 'Unnamed Item'}
                                  </span>
                                </div>
                              </td>
                              <td className="text-gray-600">{item.trackingNumber}</td>
                              <td className="text-gray-600">
                                {new Date(item.receivingDate).toLocaleDateString()}
                              </td>
                              <td>
                                <span className={`badge ${
                                  item.status === 'china_warehouse' ? 'badge-light-info' :
                                  item.status === 'in_transit' ? 'badge-light-primary' :
                                  item.status === 'arrived_ghana' ? 'badge-light-warning' :
                                  item.status === 'ready_for_pickup' ? 'badge-light-success' :
                                  'badge-light-success'
                                }`}>
                                  {item.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="text-gray-800 fw-bold">
                                <div>${item.costUSD.toFixed(2)}</div>
                                <div className="text-muted fs-7">₵{item.costCedis.toFixed(2)}</div>
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

            {/* Quick Actions & Announcements */}
            <div className="col-xl-4">
              {/* Support */}
              <div className="card card-flush mb-5">
                <div className="card-header pt-7">
                  <h3 className="card-title">
                    <span className="card-label fw-bold text-gray-800">Support</span>
                  </h3>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-5">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-info">
                        <i className="ki-duotone ki-questionnaire-tablet fs-2x text-info">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-2 fw-bold text-gray-800">{getOpenSupportRequests()}</div>
                      <div className="fs-7 text-gray-600">Open Requests</div>
                    </div>
                  </div>
                  <Link to="/support" className="btn btn-sm btn-light-primary w-100">
                    View Support Requests
                  </Link>
                </div>
              </div>

              {/* Latest Announcement */}
              {announcements.length > 0 && (
                <div className="card card-flush">
                  <div className="card-header pt-7">
                    <h3 className="card-title">
                      <span className="card-label fw-bold text-gray-800">Latest Announcement</span>
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <span className={`badge ${
                        announcements[0].type === 'important' ? 'badge-danger' :
                        announcements[0].type === 'update' ? 'badge-info' :
                        announcements[0].type === 'promotion' ? 'badge-success' :
                        'badge-secondary'
                      }`}>
                        {announcements[0].type}
                      </span>
                    </div>
                    <h4 className="fs-5 fw-bold text-gray-900 mb-3">
                      {announcements[0].title}
                    </h4>
                    <p className="text-gray-600 fs-6 mb-4" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {announcements[0].message}
                    </p>
                    <Link to="/announcements" className="btn btn-sm btn-light-info w-100">
                      View All Announcements
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="row g-5 g-xl-10">
            <div className="col-md-3">
              <Link to="/status" className="card card-flush border-hover h-100">
                <div className="card-body text-center">
                  <i className="ki-duotone ki-chart-simple fs-3x text-primary mb-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  <h4 className="fw-bold text-gray-800 mb-2">Track Shipments</h4>
                  <p className="text-gray-600 fs-7 mb-0">
                    View detailed status of all your items
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-md-3">
              <Link to="/arrival" className="card card-flush border-hover h-100">
                <div className="card-body text-center">
                  <i className="ki-duotone ki-calendar fs-3x text-success mb-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <h4 className="fw-bold text-gray-800 mb-2">Arrival Dates</h4>
                  <p className="text-gray-600 fs-7 mb-0">
                    Check estimated arrival times
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-md-3">
              <Link to="/invoices" className="card card-flush border-hover h-100">
                <div className="card-body text-center">
                  <i className="ki-duotone ki-bill fs-3x text-warning mb-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  <h4 className="fw-bold text-gray-800 mb-2">Invoices</h4>
                  <p className="text-gray-600 fs-7 mb-0">
                    View and manage your invoices
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-md-3">
              <Link to="/support" className="card card-flush border-hover h-100">
                <div className="card-body text-center">
                  <i className="ki-duotone ki-headset fs-3x text-info mb-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <h4 className="fw-bold text-gray-800 mb-2">Get Support</h4>
                  <p className="text-gray-600 fs-7 mb-0">
                    Submit a support request
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && showItemModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Item Details</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowItemModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Item Photos */}
                {selectedItem.photos && selectedItem.photos.length > 0 && (
                  <div className="mb-5">
                    <div className="row g-3">
                      {selectedItem.photos.map((photo, index) => (
                        <div key={index} className="col-md-4">
                          <img
                            src={typeof photo === 'string' ? photo : photo.url}
                            alt={`Item ${index + 1}`}
                            className="img-fluid rounded"
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Item Information */}
                <div className="row g-5">
                  <div className="col-md-6">
                    <h5 className="mb-4">Basic Information</h5>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Item Name:</label>
                      <div className="text-gray-800 fw-bold">{selectedItem.name || 'Unnamed Item'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Tracking Number:</label>
                      <div className="text-gray-800 fw-bold">{selectedItem.trackingNumber}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Container Number:</label>
                      <div className="text-gray-800">{selectedItem.containerNumber || 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Receiving Date:</label>
                      <div className="text-gray-800">{new Date(selectedItem.receivingDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h5 className="mb-4">Shipping Details</h5>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Status:</label>
                      <div>
                        <span className={`badge ${
                          selectedItem.status === 'china_warehouse' ? 'badge-light-info' :
                          selectedItem.status === 'in_transit' ? 'badge-light-primary' :
                          selectedItem.status === 'arrived_ghana' ? 'badge-light-warning' :
                          selectedItem.status === 'ready_for_pickup' ? 'badge-light-success' :
                          'badge-light-secondary'
                        }`}>
                          {selectedItem.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Shipping Method:</label>
                      <div className="text-gray-800">
                        {selectedItem.shippingMethod === 'sea' ? 'Sea Freight' : 'Air Freight'}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Dimensions:</label>
                      <div className="text-gray-800">
                        {selectedItem.length} × {selectedItem.width} × {selectedItem.height} {selectedItem.dimensionUnit}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">CBM:</label>
                      <div className="text-gray-800">{selectedItem.cbm.toFixed(6)} m³</div>
                    </div>
                    {selectedItem.weight && (
                      <div className="mb-3">
                        <label className="text-muted fw-semibold">Weight:</label>
                        <div className="text-gray-800">{selectedItem.weight} {selectedItem.weightUnit}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="separator my-5"></div>

                {/* Cost Information */}
                <div className="row g-5">
                  <div className="col-md-6">
                    <h5 className="mb-4">Cost</h5>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">USD:</label>
                      <div className="text-gray-800 fw-bold fs-3">${selectedItem.costUSD.toFixed(2)}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted fw-semibold">Cedis:</label>
                      <div className="text-gray-800 fw-bold fs-3">₵{selectedItem.costCedis.toFixed(2)} GHS</div>
                    </div>
                  </div>

                  {(selectedItem.isDamaged || selectedItem.isMissing) && (
                    <div className="col-md-6">
                      <h5 className="mb-4">Flags</h5>
                      {selectedItem.isDamaged && (
                        <div className="alert alert-danger d-flex align-items-center mb-3">
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          <span>This item is marked as damaged</span>
                        </div>
                      )}
                      {selectedItem.isMissing && (
                        <div className="alert alert-warning d-flex align-items-center">
                          <i className="bi bi-exclamation-circle-fill me-2"></i>
                          <span>This item is marked as missing</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowItemModal(false)}
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
