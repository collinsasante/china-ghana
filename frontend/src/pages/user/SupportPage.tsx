import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupportRequestsByCustomerId, createSupportRequest } from '../../services/airtable';
import type { SupportRequest } from '../../types/index';

export default function SupportPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general' as 'missing_item' | 'wrong_delivery' | 'general',
    priority: 'medium' as 'low' | 'medium' | 'high',
    relatedTrackingNumber: '',
  });

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await getSupportRequestsByCustomerId(user.id);
      setRequests(data);
    } catch (err) {
      console.error('Error loading support requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    setSubmitting(true);
    try {
      const newRequest: Omit<SupportRequest, 'id'> = {
        customerId: user.id,
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
        relatedTrackingNumber: formData.relatedTrackingNumber || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createSupportRequest(newRequest);

      // Reset form
      setFormData({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
        relatedTrackingNumber: '',
      });

      setShowCreateModal(false);
      loadRequests();

      alert('Support request submitted successfully! Our team will respond soon.');
    } catch (err) {
      console.error('Error creating support request:', err);
      alert('Failed to submit support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      open: { class: 'badge-info', label: 'Open' },
      in_progress: { class: 'badge-warning', label: 'In Progress' },
      resolved: { class: 'badge-success', label: 'Resolved' },
      closed: { class: 'badge-secondary', label: 'Closed' },
    };

    const config = statusConfig[status] || { class: 'badge-secondary', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { class: string; label: string }> = {
      missing_item: { class: 'badge-light-danger', label: 'Missing Item' },
      wrong_delivery: { class: 'badge-light-warning', label: 'Wrong Delivery' },
      general: { class: 'badge-light-info', label: 'General' },
    };

    const config = categoryConfig[category] || categoryConfig.general;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <i className="ki-duotone ki-arrow-up text-danger fs-2"><span className="path1"></span><span className="path2"></span></i>;
      case 'medium':
        return <i className="ki-duotone ki-minus text-warning fs-2"><span className="path1"></span><span className="path2"></span></i>;
      case 'low':
        return <i className="ki-duotone ki-arrow-down text-success fs-2"><span className="path1"></span><span className="path2"></span></i>;
      default:
        return null;
    }
  };

  const openRequestDetails = (request: SupportRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Support
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
              Support
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Support</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Summary Cards */}
          <div className="row g-5 g-xl-10 mb-5">
            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-gray-800 mb-2">
                    {requests.length}
                  </div>
                  <div className="fw-semibold text-gray-600">Total Requests</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-info">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-info mb-2">
                    {requests.filter(r => r.status === 'open').length}
                  </div>
                  <div className="fw-semibold text-info">Open</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-warning mb-2">
                    {requests.filter(r => r.status === 'in_progress').length}
                  </div>
                  <div className="fw-semibold text-warning">In Progress</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-success">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-success mb-2">
                    {requests.filter(r => r.status === 'resolved').length}
                  </div>
                  <div className="fw-semibold text-success">Resolved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mb-5">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h3 className="mb-2">Need Help?</h3>
                  <p className="text-gray-600 mb-0">
                    Submit a support request and our team will get back to you as soon as possible.
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <i className="ki-duotone ki-plus fs-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                    </i>
                    New Support Request
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Requests Table */}
          <div className="card">
            <div className="card-header border-0 pt-6">
              <div className="card-title">
                <h3>Your Support Requests</h3>
              </div>
            </div>
            <div className="card-body pt-0">
              {requests.length === 0 ? (
                <div className="text-center py-10">
                  <i className="ki-duotone ki-questionnaire-tablet fs-5x text-gray-400 mb-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <h3 className="text-gray-800 mb-3">No Support Requests</h3>
                  <p className="text-gray-600">
                    You haven't submitted any support requests yet.
                  </p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Submit Your First Request
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                    <thead>
                      <tr className="fw-bold text-muted">
                        <th className="min-w-50px">Priority</th>
                        <th className="min-w-150px">Subject</th>
                        <th className="min-w-120px">Category</th>
                        <th className="min-w-140px">Tracking Number</th>
                        <th className="min-w-120px">Created</th>
                        <th className="min-w-100px">Status</th>
                        <th className="min-w-100px text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>{getPriorityIcon(request.priority)}</td>
                          <td>
                            <span className="text-gray-900 fw-bold">{request.subject}</span>
                          </td>
                          <td>{getCategoryBadge(request.category)}</td>
                          <td>
                            <span className="text-gray-600">
                              {request.relatedTrackingNumber || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-600">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-light-primary"
                              onClick={() => openRequestDetails(request)}
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

      {/* Create Request Modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h2 className="modal-title">New Support Request</h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-5">
                    <label className="form-label required">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Brief description of your issue"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-5 mb-5">
                    <div className="col-md-6">
                      <label className="form-label required">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        required
                      >
                        <option value="general">General Inquiry</option>
                        <option value="missing_item">Missing Item</option>
                        <option value="wrong_delivery">Wrong Delivery</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required">Priority</label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="form-label">Related Tracking Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter tracking number if applicable"
                      value={formData.relatedTrackingNumber}
                      onChange={(e) => setFormData({ ...formData, relatedTrackingNumber: e.target.value })}
                    />
                  </div>

                  <div className="mb-5">
                    <label className="form-label required">Description</label>
                    <textarea
                      className="form-control"
                      rows={6}
                      placeholder="Please provide details about your issue..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
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
                <div className="d-flex justify-content-between align-items-start mb-6">
                  <div>
                    <h3 className="mb-3">{selectedRequest.subject}</h3>
                    <div className="d-flex gap-2 mb-3">
                      {getCategoryBadge(selectedRequest.category)}
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  {getPriorityIcon(selectedRequest.priority)}
                </div>

                <div className="separator my-5"></div>

                <div className="mb-6">
                  <h5 className="mb-3">Details:</h5>
                  <div className="bg-light rounded p-4">
                    <p className="text-gray-700 mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRequest.description}
                    </p>
                  </div>
                </div>

                {selectedRequest.relatedTrackingNumber && (
                  <div className="mb-6">
                    <h5 className="mb-3">Related Tracking Number:</h5>
                    <div className="bg-light rounded p-3">
                      <span className="fw-bold text-gray-800">
                        {selectedRequest.relatedTrackingNumber}
                      </span>
                    </div>
                  </div>
                )}

                <div className="separator my-5"></div>

                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="fs-7 text-gray-600 mb-1">Created</div>
                    <div className="fw-bold text-gray-800">
                      {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="fs-7 text-gray-600 mb-1">Last Updated</div>
                    <div className="fw-bold text-gray-800">
                      {new Date(selectedRequest.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="fs-7 text-gray-600 mb-1">Priority</div>
                    <div className="fw-bold text-gray-800 text-capitalize">
                      {selectedRequest.priority}
                    </div>
                  </div>
                </div>

                {selectedRequest.adminResponse && (
                  <>
                    <div className="separator my-6"></div>
                    <div className="alert alert-info">
                      <h5 className="mb-3">Admin Response:</h5>
                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRequest.adminResponse}
                      </p>
                    </div>
                  </>
                )}
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
    </div>
  );
}
