import { useState, useEffect } from 'react';
import { getAllCustomers } from '../../services/airtable';
import type { User } from '../../types/index';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.toLowerCase().includes(query))
    );
  });

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Customer Management
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Admin</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Customers</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-light-primary fs-6">
              {filteredCustomers.length} customers
            </span>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">

          {/* Search */}
          <div className="card mb-5">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-search fs-2 me-3 text-gray-600"></i>
                <input
                  type="text"
                  className="form-control form-control-lg form-control-solid"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Customers List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All Customers</h3>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading customers...</div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <i className="bi bi-people fs-3x"></i>
                  <div className="mt-3">No customers found</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-300 align-middle gy-5">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th className="ps-5">Customer</th>
                        <th>Contact Info</th>
                        <th>Address</th>
                        <th>Account Status</th>
                        <th className="text-end pe-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="cursor-pointer hover-bg-light"
                          onClick={() => setSelectedCustomer(customer)}
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        >
                          <td className="ps-5">
                            <div className="d-flex align-items-center">
                              <div className="symbol symbol-circle symbol-50px overflow-hidden me-3">
                                <div className="symbol-label bg-light-primary">
                                  <span className="text-primary fw-bold fs-3">
                                    {customer.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="fw-bold text-gray-800 fs-6">{customer.name}</div>
                                <div className="text-muted fs-7">ID: {customer.id.substring(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="mb-1">
                              <i className="bi bi-envelope me-2 text-gray-600"></i>
                              <span className="text-gray-800">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div>
                                <i className="bi bi-telephone me-2 text-gray-600"></i>
                                <span className="text-gray-800">{customer.phone}</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="text-gray-800">
                              {customer.address || (
                                <span className="text-muted fst-italic">No address</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {customer.isFirstLogin ? (
                              <span className="badge badge-warning fs-7 px-3 py-2">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                First Login Pending
                              </span>
                            ) : (
                              <span className="badge badge-success fs-7 px-3 py-2">
                                <i className="bi bi-check-circle me-1"></i>
                                Active
                              </span>
                            )}
                          </td>
                          <td className="text-end pe-5">
                            <button
                              className="btn btn-sm btn-light-primary btn-active-light-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomer(customer);
                              }}
                            >
                              <i className="bi bi-eye me-1"></i>
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h3 className="modal-title text-white">
                  <i className="bi bi-person-circle me-2"></i>
                  Customer Details
                </h3>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedCustomer(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-5 pb-5 border-bottom">
                  <div className="symbol symbol-circle symbol-75px overflow-hidden me-4">
                    <div className="symbol-label bg-light-primary">
                      <span className="text-primary fw-bold fs-2x">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="fw-bold text-gray-800 mb-1">{selectedCustomer.name}</h2>
                    <div className="text-muted">Customer ID: {selectedCustomer.id}</div>
                  </div>
                </div>

                <div className="row g-5">
                  <div className="col-md-6">
                    <label className="fw-bold text-gray-700 mb-2">Email Address</label>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-envelope fs-3 text-primary me-3"></i>
                      <span className="text-gray-800">{selectedCustomer.email}</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold text-gray-700 mb-2">Phone Number</label>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-telephone fs-3 text-primary me-3"></i>
                      <span className="text-gray-800">{selectedCustomer.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="fw-bold text-gray-700 mb-2">Address</label>
                    <div className="d-flex align-items-start">
                      <i className="bi bi-geo-alt fs-3 text-primary me-3 mt-1"></i>
                      <span className="text-gray-800">{selectedCustomer.address || 'No address provided'}</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold text-gray-700 mb-2">Account Status</label>
                    <div>
                      {selectedCustomer.isFirstLogin ? (
                        <span className="badge badge-warning fs-6 px-4 py-3">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          First Login Pending
                        </span>
                      ) : (
                        <span className="badge badge-success fs-6 px-4 py-3">
                          <i className="bi bi-check-circle me-2"></i>
                          Active Account
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="fw-bold text-gray-700 mb-2">Role</label>
                    <div>
                      <span className="badge badge-light-info fs-6 px-4 py-3">
                        <i className="bi bi-person-badge me-2"></i>
                        {selectedCustomer.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCustomer.isFirstLogin && (
                  <div className="alert alert-warning mt-5">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Note:</strong> This customer has not completed their first login. They will be required to change their password upon first login.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setSelectedCustomer(null)}
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
