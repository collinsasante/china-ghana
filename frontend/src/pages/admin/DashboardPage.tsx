import { useState, useEffect } from 'react';
import { getAllItems, getAllCustomers } from '../../services/airtable';
import type { Item, User } from '../../types/index';

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
      setItems(itemsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalItems = items.length;
  const totalCustomers = customers.length;
  const itemsInChina = items.filter(i => i.status === 'china_warehouse').length;
  const itemsInTransit = items.filter(i => i.status === 'in_transit').length;
  const itemsInGhana = items.filter(i => i.status === 'arrived_ghana').length;
  const itemsReady = items.filter(i => i.status === 'ready_for_pickup').length;
  const itemsDelivered = items.filter(i => i.status === 'delivered' || i.status === 'picked_up').length;
  const damagedItems = items.filter(i => i.isDamaged).length;
  const missingItems = items.filter(i => i.isMissing).length;

  const totalValue = items.reduce((sum, item) => sum + (item.costUSD || 0), 0);
  const totalCBM = items.reduce((sum, item) => sum + (item.cbm || 0), 0);

  const containers = [...new Set(items.map(i => i.containerNumber).filter(Boolean))];
  const totalContainers = containers.length;

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Admin Dashboard
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Admin</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">

          {loading ? (
            <div className="text-center py-20">
              <span className="spinner-border spinner-border-lg me-2"></span>
              <div className="mt-3 text-muted">Loading dashboard...</div>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="row g-5 g-xl-10 mb-5">
                <div className="col-xl-3 col-md-6">
                  <div className="card card-flush h-100 bg-primary">
                    <div className="card-body p-5">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-box-seam fs-2x text-white me-3"></i>
                          <div>
                            <div className="fs-7 text-white opacity-75">Total Items</div>
                            <div className="fs-2x fw-bold text-white">{totalItems}</div>
                          </div>
                        </div>
                        <div className="text-white opacity-75 fs-7">
                          ${totalValue.toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card card-flush h-100 bg-success">
                    <div className="card-body p-5">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-people fs-2x text-white me-3"></i>
                          <div>
                            <div className="fs-7 text-white opacity-75">Total Customers</div>
                            <div className="fs-2x fw-bold text-white">{totalCustomers}</div>
                          </div>
                        </div>
                        <div className="text-white opacity-75 fs-7">
                          Active accounts
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card card-flush h-100 bg-warning">
                    <div className="card-body p-5">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-stack fs-2x text-white me-3"></i>
                          <div>
                            <div className="fs-7 text-white opacity-75">Total Containers</div>
                            <div className="fs-2x fw-bold text-white">{totalContainers}</div>
                          </div>
                        </div>
                        <div className="text-white opacity-75 fs-7">
                          {totalCBM.toFixed(2)} m³ total
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card card-flush h-100 bg-info">
                    <div className="card-body p-5">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-check-circle fs-2x text-white me-3"></i>
                          <div>
                            <div className="fs-7 text-white opacity-75">Delivered</div>
                            <div className="fs-2x fw-bold text-white">{itemsDelivered}</div>
                          </div>
                        </div>
                        <div className="text-white opacity-75 fs-7">
                          {totalItems > 0 ? ((itemsDelivered / totalItems) * 100).toFixed(1) : 0}% completion rate
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="row g-5 g-xl-10 mb-5">
                <div className="col-xl-8">
                  <div className="card card-flush h-100">
                    <div className="card-header">
                      <h3 className="card-title">Shipment Status Overview</h3>
                    </div>
                    <div className="card-body">
                      <div className="row g-4">
                        <div className="col-md-4">
                          <div className="border border-gray-300 border-dashed rounded p-4 text-center">
                            <i className="bi bi-warehouse fs-2x text-secondary mb-2"></i>
                            <div className="fs-2x fw-bold text-gray-800">{itemsInChina}</div>
                            <div className="fs-7 text-muted">China Warehouse</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border border-gray-300 border-dashed rounded p-4 text-center">
                            <i className="bi bi-truck fs-2x text-primary mb-2"></i>
                            <div className="fs-2x fw-bold text-gray-800">{itemsInTransit}</div>
                            <div className="fs-7 text-muted">In Transit</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border border-gray-300 border-dashed rounded p-4 text-center">
                            <i className="bi bi-geo-alt fs-2x text-warning mb-2"></i>
                            <div className="fs-2x fw-bold text-gray-800">{itemsInGhana}</div>
                            <div className="fs-7 text-muted">Arrived Ghana</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border border-gray-300 border-dashed rounded p-4 text-center">
                            <i className="bi bi-clipboard-check fs-2x text-success mb-2"></i>
                            <div className="fs-2x fw-bold text-gray-800">{itemsReady}</div>
                            <div className="fs-7 text-muted">Ready for Pickup</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border border-gray-300 border-dashed rounded p-4 text-center">
                            <i className="bi bi-exclamation-triangle fs-2x text-danger mb-2"></i>
                            <div className="fs-2x fw-bold text-gray-800">{damagedItems}</div>
                            <div className="fs-7 text-muted">Damaged</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border border-gray-300 border-dashed rounded p-4 text-center">
                            <i className="bi bi-x-circle fs-2x text-dark mb-2"></i>
                            <div className="fs-2x fw-bold text-gray-800">{missingItems}</div>
                            <div className="fs-7 text-muted">Missing</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-4">
                  <div className="card card-flush h-100 bg-light-primary">
                    <div className="card-header">
                      <h3 className="card-title text-primary">Quick Actions</h3>
                    </div>
                    <div className="card-body">
                      <div className="d-flex flex-column gap-3">
                        <a href="/admin/containers" className="btn btn-primary">
                          <i className="bi bi-stack me-2"></i>
                          Manage Containers
                        </a>
                        <a href="/admin/packaging" className="btn btn-light-primary">
                          <i className="bi bi-box-seam me-2"></i>
                          Package Items
                        </a>
                        <a href="/admin/customers" className="btn btn-light-primary">
                          <i className="bi bi-people me-2"></i>
                          View Customers
                        </a>
                        <a href="/admin/support-requests" className="btn btn-light-primary">
                          <i className="bi bi-headset me-2"></i>
                          Support Requests
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
