import { useState, useEffect } from 'react';
import { getAllSupportRequests, updateSupportRequestStatus, getAllCustomers } from '../../services/airtable';
import type { SupportRequest, User } from '../../types/index';

export default function SupportRequestsPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'missing_item' | 'wrong_delivery' | 'general'>('all');
  const [notification, setNotification] = useState<{type: 'success'|'error'|'info', title: string, message: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, customersData] = await Promise.all([
        getAllSupportRequests(),
        getAllCustomers(),
      ]);
      setRequests(requestsData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading support requests:', err);
      showNotification('error', 'Load Failed', 'Failed to load support requests. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success'|'error'|'info', title: string, message: string) => {
    setNotification({type, title, message});
    setTimeout(() => setNotification(null), 3000);
  };

  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getCustomerEmail = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.email || '';
  };

  const handleStatusChange = async (requestId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await updateSupportRequestStatus(requestId, newStatus);

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));

      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }

      showNotification('success', 'Status Updated', `Request status changed to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('error', 'Update Failed', 'Failed to update request status. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      open: { class: 'badge-light-info', label: 'Open' },
      in_progress: { class: 'badge-light-warning', label: 'In Progress' },
      resolved: { class: 'badge-light-success', label: 'Resolved' },
      closed: { class: 'badge-light-secondary', label: 'Closed' },
    };

    const config = statusConfig[status] || { class: 'badge-light-secondary', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { class: string; label: string; icon: string }> = {
      missing_item: { class: 'badge-light-danger', label: 'Missing Item', icon: 'bi-box-seam' },
      wrong_delivery: { class: 'badge-light-warning', label: 'Wrong Delivery', icon: 'bi-truck' },
      general: { class: 'badge-light-primary', label: 'General', icon: 'bi-chat-dots' },
    };

    const config = categoryConfig[category] || categoryConfig.general;
    return (
      <span className={`badge ${config.class}`}>
        <i className={`bi ${config.icon} me-1`}></i>
        {config.label}
      </span>
    );
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Support Requests
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
                <p className="text-gray-600 mt-5">Loading support requests...</p>
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
              Support Requests
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/admin/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Support Requests</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2 gap-lg-3">
            <button className="btn btn-sm btn-primary" onClick={loadData}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Statistics Cards */}
          <div className="row g-5 g-xl-8 mb-5">
            <div className="col-xl-3">
              <div className="card card-flush h-xl-100">
                <div className="card-body">
                  <span className="fs-2hx fw-bold text-gray-900 me-2">{stats.total}</span>
                  <span className="fw-semibold text-gray-600 d-block">Total Requests</span>
                </div>
              </div>
            </div>
            <div className="col-xl-3">
              <div className="card card-flush bg-light-info h-xl-100">
                <div className="card-body">
                  <span className="fs-2hx fw-bold text-info me-2">{stats.open}</span>
                  <span className="fw-semibold text-info d-block">Open</span>
                </div>
              </div>
            </div>
            <div className="col-xl-3">
              <div className="card card-flush bg-light-warning h-xl-100">
                <div className="card-body">
                  <span className="fs-2hx fw-bold text-warning me-2">{stats.inProgress}</span>
                  <span className="fw-semibold text-warning d-block">In Progress</span>
                </div>
              </div>
            </div>
            <div className="col-xl-3">
              <div className="card card-flush bg-light-success h-xl-100">
                <div className="card-body">
                  <span className="fs-2hx fw-bold text-success me-2">{stats.resolved}</span>
                  <span className="fw-semibold text-success d-block">Resolved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Table */}
          <div className="card">
            <div className="card-header border-0 pt-6">
              <div className="card-title">
                <h3>All Support Requests ({filteredRequests.length})</h3>
              </div>
              <div className="card-toolbar">
                <div className="d-flex gap-3">
                  {/* Category Filter */}
                  <select
                    className="form-select form-select-sm w-150px"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                  >
                    <option value="all">All Categories</option>
                    <option value="missing_item">Missing Item</option>
                    <option value="wrong_delivery">Wrong Delivery</option>
                    <option value="general">General</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    className="form-select form-select-sm w-150px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-body pt-0">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-10">
                  <i className="bi bi-inbox fs-5x text-gray-400 mb-5"></i>
                  <p className="text-gray-600 fs-5">No support requests found</p>
                  <p className="text-gray-500">
                    {statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Customer support requests will appear here'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                    <thead>
                      <tr className="fw-bold text-muted">
                        <th className="min-w-150px">Customer</th>
                        <th className="min-w-200px">Subject</th>
                        <th className="min-w-120px">Category</th>
                        <th className="min-w-100px">Status</th>
                        <th className="min-w-120px">Tracking #</th>
                        <th className="min-w-120px">Created</th>
                        <th className="min-w-100px text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="hover-bg-light-primary cursor-pointer"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                        >
                          <td>
                            <div className="d-flex flex-column">
                              <span className="text-gray-900 fw-bold">{getCustomerName(request.customerId)}</span>
                              <span className="text-gray-600 fs-7">{getCustomerEmail(request.customerId)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-semibold">{request.subject}</span>
                          </td>
                          <td>{getCategoryBadge(request.category)}</td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>
                            <span className="text-gray-700">
                              {request.relatedTrackingNumber || '—'}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-600">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-sm btn-light-primary"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailModal(true);
                              }}
                            >
                              View
                            </button>
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

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Support Request Details</h2>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-6">
                  {/* Customer Info */}
                  <div className="col-12">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="mb-3">Customer Information</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <label className="fs-6 fw-semibold text-gray-800">Name</label>
                            <p className="text-gray-600 mb-3">{getCustomerName(selectedRequest.customerId)}</p>
                          </div>
                          <div className="col-md-6">
                            <label className="fs-6 fw-semibold text-gray-800">Email</label>
                            <p className="text-gray-600 mb-3">{getCustomerEmail(selectedRequest.customerId)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="col-12">
                    <div className="mb-5">
                      <label className="fs-6 fw-semibold text-gray-800">Subject</label>
                      <p className="text-gray-900 fs-5 mb-0">{selectedRequest.subject}</p>
                    </div>

                    <div className="mb-5">
                      <label className="fs-6 fw-semibold text-gray-800">Description</label>
                      <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.description}</p>
                    </div>

                    <div className="row g-4 mb-5">
                      <div className="col-md-4">
                        <label className="fs-6 fw-semibold text-gray-800">Category</label>
                        <div className="mt-2">{getCategoryBadge(selectedRequest.category)}</div>
                      </div>
                      <div className="col-md-4">
                        <label className="fs-6 fw-semibold text-gray-800">Current Status</label>
                        <div className="mt-2">{getStatusBadge(selectedRequest.status)}</div>
                      </div>
                      <div className="col-md-4">
                        <label className="fs-6 fw-semibold text-gray-800">Tracking Number</label>
                        <p className="text-gray-700 mb-0">
                          {selectedRequest.relatedTrackingNumber || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="fs-6 fw-semibold text-gray-800">Created</label>
                        <p className="text-gray-600 mb-0">
                          {new Date(selectedRequest.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <label className="fs-6 fw-semibold text-gray-800">Last Updated</label>
                        <p className="text-gray-600 mb-0">
                          {selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="col-12">
                    <div className="separator my-5"></div>
                    <h5 className="mb-4">Update Status</h5>
                    <div className="d-flex gap-3 flex-wrap">
                      <button
                        className={`btn ${selectedRequest.status === 'open' ? 'btn-info' : 'btn-light-info'}`}
                        onClick={() => handleStatusChange(selectedRequest.id, 'open')}
                      >
                        Open
                      </button>
                      <button
                        className={`btn ${selectedRequest.status === 'in_progress' ? 'btn-warning' : 'btn-light-warning'}`}
                        onClick={() => handleStatusChange(selectedRequest.id, 'in_progress')}
                      >
                        In Progress
                      </button>
                      <button
                        className={`btn ${selectedRequest.status === 'resolved' ? 'btn-success' : 'btn-light-success'}`}
                        onClick={() => handleStatusChange(selectedRequest.id, 'resolved')}
                      >
                        Resolved
                      </button>
                      <button
                        className={`btn ${selectedRequest.status === 'closed' ? 'btn-secondary' : 'btn-light-secondary'}`}
                        onClick={() => handleStatusChange(selectedRequest.id, 'closed')}
                      >
                        Closed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, marginTop: '70px' }}>
          <div className={`toast show align-items-center text-white bg-${notification.type} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <strong>{notification.title}</strong>
                <div className="small">{notification.message}</div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setNotification(null)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
