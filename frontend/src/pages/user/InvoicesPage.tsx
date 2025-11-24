import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInvoicesByCustomerId } from '../../services/airtable';
import type { Invoice } from '../../types/index';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [user]);

  const loadInvoices = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await getInvoicesByCustomerId(user.id);
      setInvoices(data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      pending: { class: 'badge-warning', label: 'Pending' },
      paid: { class: 'badge-success', label: 'Paid' },
      overdue: { class: 'badge-danger', label: 'Overdue' },
      cancelled: { class: 'badge-secondary', label: 'Cancelled' },
    };

    const config = statusConfig[status] || { class: 'badge-secondary', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getTotalAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  };

  const getPendingAmount = () => {
    return invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  };

  const openInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Invoices
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
                <p className="text-gray-600 mt-5">Loading invoices...</p>
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
              Invoices
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Invoices</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Summary Cards */}
          <div className="row g-5 g-xl-10 mb-5">
            <div className="col-md-4">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-gray-800 mb-2">
                    {invoices.length}
                  </div>
                  <div className="fw-semibold text-gray-600">Total Invoices</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-warning mb-2">
                    ${getPendingAmount().toFixed(2)}
                  </div>
                  <div className="fw-semibold text-warning">Pending Payment</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-flush h-100 bg-light-success">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-success mb-2">
                    ${invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
                  </div>
                  <div className="fw-semibold text-success">Total Paid</div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card">
            <div className="card-header border-0 pt-6">
              <div className="card-title">
                <h3>All Invoices</h3>
              </div>
            </div>
            <div className="card-body pt-0">
              {invoices.length === 0 ? (
                <div className="text-center py-10">
                  <i className="ki-duotone ki-file fs-5x text-gray-400 mb-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <p className="text-gray-600 fs-5">No invoices found</p>
                  <p className="text-gray-500">Your invoices will appear here once generated.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                    <thead>
                      <tr className="fw-bold text-muted">
                        <th className="min-w-150px">Invoice Number</th>
                        <th className="min-w-120px">Issue Date</th>
                        <th className="min-w-120px">Due Date</th>
                        <th className="min-w-200px">Description</th>
                        <th className="min-w-100px">Amount</th>
                        <th className="min-w-100px">Status</th>
                        <th className="min-w-100px text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>
                            <span className="text-gray-900 fw-bold">
                              #{invoice.invoiceNumber}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-bold">
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-bold">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-600">{invoice.description}</span>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-bold fs-6">
                              ${invoice.totalAmount.toFixed(2)}
                            </span>
                          </td>
                          <td>{getStatusBadge(invoice.status)}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-light-primary"
                              onClick={() => openInvoice(invoice)}
                            >
                              View Details
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

      {/* Invoice Detail Modal */}
      {showModal && selectedInvoice && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Invoice #{selectedInvoice.invoiceNumber}</h2>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Invoice Header */}
                <div className="d-flex justify-content-between align-items-start mb-8">
                  <div>
                    <h1 className="fw-bold text-gray-800 fs-2x mb-3">INVOICE</h1>
                    <div className="text-gray-600">
                      <div className="mb-2">
                        <span className="fw-semibold">Invoice #:</span> {selectedInvoice.invoiceNumber}
                      </div>
                      <div className="mb-2">
                        <span className="fw-semibold">Issue Date:</span>{' '}
                        {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="fw-semibold">Due Date:</span>{' '}
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    {getStatusBadge(selectedInvoice.status)}
                    <div className="fs-1 fw-bold text-gray-800 mt-3">
                      ${selectedInvoice.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="separator my-6"></div>

                {/* Bill To */}
                <div className="mb-8">
                  <h5 className="mb-3">Bill To:</h5>
                  <div className="text-gray-800 fw-semibold fs-5">{user?.name}</div>
                  <div className="text-gray-600">{user?.email}</div>
                  {user?.address && (
                    <div className="text-gray-600">{user.address}</div>
                  )}
                </div>

                <div className="separator my-6"></div>

                {/* Description */}
                <div className="mb-8">
                  <h5 className="mb-3">Description:</h5>
                  <p className="text-gray-700 fs-6">{selectedInvoice.description}</p>
                </div>

                {/* Line Items */}
                <div className="mb-8">
                  <h5 className="mb-4">Invoice Details:</h5>
                  <div className="table-responsive">
                    <table className="table table-row-dashed">
                      <thead>
                        <tr className="fw-bold text-muted">
                          <th>Description</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-gray-800">{selectedInvoice.description}</td>
                          <td className="text-end text-gray-800 fw-bold">
                            ${selectedInvoice.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="text-end fw-bold text-gray-800 fs-4">Total</td>
                          <td className="text-end fw-bold text-gray-800 fs-3">
                            ${selectedInvoice.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment Notes */}
                {selectedInvoice.notes && (
                  <>
                    <div className="separator my-6"></div>
                    <div className="mb-4">
                      <h5 className="mb-3">Notes:</h5>
                      <p className="text-gray-600 fs-6">{selectedInvoice.notes}</p>
                    </div>
                  </>
                )}

                {/* Payment Information */}
                {selectedInvoice.status === 'pending' && (
                  <>
                    <div className="separator my-6"></div>
                    <div className="alert alert-warning d-flex align-items-center">
                      <i className="ki-duotone ki-information fs-2x text-warning me-4">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                      </i>
                      <div>
                        <h5 className="mb-1">Payment Pending</h5>
                        <div className="text-gray-700">
                          Please contact our office to arrange payment for this invoice.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
