import { useState, useEffect } from 'react';
import { getAllCustomers } from '../../services/airtable';
import type { User } from '../../types/index';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
                  <table className="table table-row-bordered table-row-gray-300 gy-4">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>First Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="symbol symbol-circle symbol-50px overflow-hidden me-3">
                                <div className="symbol-label bg-light-primary">
                                  <span className="text-primary fw-bold fs-4">
                                    {customer.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="fw-bold">{customer.name}</span>
                              </div>
                            </div>
                          </td>
                          <td>{customer.email}</td>
                          <td>{customer.phone || '-'}</td>
                          <td>{customer.address || '-'}</td>
                          <td>
                            {customer.isFirstLogin ? (
                              <span className="badge badge-light-warning">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                Pending
                              </span>
                            ) : (
                              <span className="badge badge-light-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Completed
                              </span>
                            )}
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
