import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getItemsByCustomerId, getInvoicesByCustomerId, getSupportRequestsByCustomerId, getActiveAnnouncements } from '../../services/airtable';
import type { Item, Invoice, SupportRequest, Announcement } from '../../types/index';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [itemsData, invoicesData, requestsData, announcementsData] = await Promise.all([
        getItemsByCustomerId(user.id),
        getInvoicesByCustomerId(user.id),
        getSupportRequestsByCustomerId(user.id),
        getActiveAnnouncements(),
      ]);

      setItems(itemsData);
      setInvoices(invoicesData);
      setSupportRequests(requestsData);
      setAnnouncements(announcementsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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

  const getRecentItems = () => {
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getOpenSupportRequests = () => {
    return supportRequests.filter(req => req.status === 'open' || req.status === 'in_progress').length;
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
                            <tr key={item.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {item.photos && item.photos.length > 0 ? (
                                    <div className="symbol symbol-40px me-3">
                                      <img
                                        src={
                                          typeof item.photos[0] === 'string'
                                            ? item.photos[0]
                                            : (item.photos[0] as any)?.url
                                        }
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
                              <td className="text-gray-800 fw-bold">${item.costUSD.toFixed(2)}</td>
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
    </div>
  );
}
