import { useState, useEffect } from 'react';
import { getAllItems, getAllCustomers } from '../../services/airtable';
import type { Item, User } from '../../types/index';

export default function ChinaTeamDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [itemsData, customersData] = await Promise.all([
        getAllItems(),
        getAllCustomers(),
      ]);
      setItems(itemsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    // Items by status
    totalItems: items.length,
    chinaWarehouse: items.filter((item) => item.status === 'china_warehouse').length,
    inTransit: items.filter((item) => item.status === 'in_transit').length,
    arrivedGhana: items.filter((item) => item.status === 'arrived_ghana').length,
    readyForPickup: items.filter((item) => item.status === 'ready_for_pickup').length,
    delivered: items.filter((item) => item.status === 'delivered').length,

    // Items without carton numbers (ready to package)
    readyToPackage: items.filter(
      (item) => item.status === 'china_warehouse' && !item.cartonNumber
    ).length,

    // Items packaged (has carton number)
    packaged: items.filter((item) => item.cartonNumber).length,

    // Shipping methods
    seaShipping: items.filter((item) => item.shippingMethod === 'sea').length,
    airShipping: items.filter((item) => item.shippingMethod === 'air').length,

    // Financial
    totalValueUSD: items.reduce((sum, item) => sum + (item.costUSD || 0), 0),
    totalValueCedis: items.reduce((sum, item) => sum + (item.costCedis || 0), 0),
    totalCBM: items.reduce((sum, item) => sum + (item.cbm || 0), 0),

    // Customers
    totalCustomers: customers.length,
    customersWithItems: new Set(
      items.map((item) => item.customerId).filter((id) => id)
    ).size,

    // Recent activity (last 7 days)
    recentItems: items.filter((item) => {
      const itemDate = new Date(item.receivingDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    }).length,

    // Issues
    damaged: items.filter((item) => item.isDamaged).length,
    missing: items.filter((item) => item.isMissing).length,
  };

  // Get recent items (last 10)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.receivingDate).getTime() - new Date(a.receivingDate).getTime())
    .slice(0, 10);

  // Get items by receiving date for chart
  const itemsByDate = items.reduce((acc, item) => {
    const date = new Date(item.receivingDate).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDates = Object.entries(itemsByDate)
    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
    .slice(0, 7);

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              China Team Dashboard
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">China Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Dashboard</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-light-primary"
              onClick={loadDashboardData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Loading...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-10">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards Row 1 - Overall Metrics */}
              <div className="row g-5 g-xl-8 mb-5">
                {/* Total Items */}
                <div className="col-xl-3">
                  <div className="card card-flush h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center mb-5">
                        <div className="symbol symbol-50px me-3">
                          <div className="symbol-label bg-light-primary">
                            <i className="bi bi-box-seam fs-2x text-primary"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <span className="text-gray-400 fw-semibold d-block fs-7">Total Items</span>
                          <span className="text-gray-800 fw-bold d-block fs-2qx">{stats.totalItems}</span>
                        </div>
                      </div>
                      <div className="text-muted fs-7">
                        <i className="bi bi-calendar-week me-1"></i>
                        {stats.recentItems} received this week
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ready to Package */}
                <div className="col-xl-3">
                  <div className="card card-flush h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center mb-5">
                        <div className="symbol symbol-50px me-3">
                          <div className="symbol-label bg-light-warning">
                            <i className="bi bi-exclamation-triangle fs-2x text-warning"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <span className="text-gray-400 fw-semibold d-block fs-7">Ready to Package</span>
                          <span className="text-gray-800 fw-bold d-block fs-2qx">{stats.readyToPackage}</span>
                        </div>
                      </div>
                      <div className="text-muted fs-7">
                        <i className="bi bi-box me-1"></i>
                        {stats.packaged} already packaged
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total CBM */}
                <div className="col-xl-3">
                  <div className="card card-flush h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center mb-5">
                        <div className="symbol symbol-50px me-3">
                          <div className="symbol-label bg-light-info">
                            <i className="bi bi-rulers fs-2x text-info"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <span className="text-gray-400 fw-semibold d-block fs-7">Total CBM</span>
                          <span className="text-gray-800 fw-bold d-block fs-2qx">{stats.totalCBM.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-muted fs-7">
                        <i className="bi bi-graph-up me-1"></i>
                        Cubic meters
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Value */}
                <div className="col-xl-3">
                  <div className="card card-flush h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center mb-5">
                        <div className="symbol symbol-50px me-3">
                          <div className="symbol-label bg-light-success">
                            <i className="bi bi-currency-dollar fs-2x text-success"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <span className="text-gray-400 fw-semibold d-block fs-7">Total Value</span>
                          <span className="text-gray-800 fw-bold d-block fs-2qx">${stats.totalValueUSD.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-muted fs-7">
                        <i className="bi bi-cash me-1"></i>
                        ₵{stats.totalValueCedis.toLocaleString()} GHS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards Row 2 - Status Breakdown */}
              <div className="row g-5 g-xl-8 mb-5">
                {/* China Warehouse */}
                <div className="col-xl-2">
                  <div className="card card-flush">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-2 text-warning mb-2">{stats.chinaWarehouse}</div>
                      <div className="text-muted fs-7">China Warehouse</div>
                    </div>
                  </div>
                </div>

                {/* In Transit */}
                <div className="col-xl-2">
                  <div className="card card-flush">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-2 text-info mb-2">{stats.inTransit}</div>
                      <div className="text-muted fs-7">In Transit</div>
                    </div>
                  </div>
                </div>

                {/* Arrived Ghana */}
                <div className="col-xl-2">
                  <div className="card card-flush">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-2 text-primary mb-2">{stats.arrivedGhana}</div>
                      <div className="text-muted fs-7">Arrived Ghana</div>
                    </div>
                  </div>
                </div>

                {/* Ready for Pickup */}
                <div className="col-xl-2">
                  <div className="card card-flush">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-2 text-success mb-2">{stats.readyForPickup}</div>
                      <div className="text-muted fs-7">Ready for Pickup</div>
                    </div>
                  </div>
                </div>

                {/* Delivered */}
                <div className="col-xl-2">
                  <div className="card card-flush">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-2 text-dark mb-2">{stats.delivered}</div>
                      <div className="text-muted fs-7">Delivered</div>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                <div className="col-xl-2">
                  <div className="card card-flush">
                    <div className="card-body text-center">
                      <div className="fw-bold fs-2 text-danger mb-2">{stats.damaged + stats.missing}</div>
                      <div className="text-muted fs-7">Issues</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-5 g-xl-8">
                {/* Recent Items */}
                <div className="col-xl-6">
                  <div className="card card-flush h-100">
                    <div className="card-header">
                      <h3 className="card-title">Recent Items</h3>
                      <div className="card-toolbar">
                        <span className="badge badge-light-primary">{recentItems.length} items</span>
                      </div>
                    </div>
                    <div className="card-body pt-0">
                      <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                          <thead>
                            <tr className="fw-bold text-muted">
                              <th className="min-w-100px">Tracking</th>
                              <th className="min-w-80px">Status</th>
                              <th className="min-w-80px">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentItems.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-center text-muted py-5">
                                  No recent items
                                </td>
                              </tr>
                            ) : (
                              recentItems.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <span className="fw-bold">{item.trackingNumber}</span>
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        item.status === 'china_warehouse'
                                          ? 'badge-light-warning'
                                          : item.status === 'in_transit'
                                          ? 'badge-light-info'
                                          : item.status === 'arrived_ghana'
                                          ? 'badge-light-primary'
                                          : item.status === 'ready_for_pickup'
                                          ? 'badge-light-success'
                                          : 'badge-light-dark'
                                      }`}
                                    >
                                      {item.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="text-muted">
                                    {new Date(item.receivingDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="col-xl-6">
                  <div className="card card-flush h-100">
                    <div className="card-header">
                      <h3 className="card-title">Operations Summary</h3>
                    </div>
                    <div className="card-body">
                      {/* Shipping Methods */}
                      <div className="mb-8">
                        <h4 className="fs-6 fw-semibold mb-4">Shipping Methods</h4>
                        <div className="d-flex justify-content-between mb-3">
                          <span className="text-muted">Sea Shipping</span>
                          <span className="fw-bold">{stats.seaShipping} items ({((stats.seaShipping / stats.totalItems) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="progress h-8px mb-5">
                          <div
                            className="progress-bar bg-info"
                            role="progressbar"
                            style={{ width: `${(stats.seaShipping / stats.totalItems) * 100}%` }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between mb-3">
                          <span className="text-muted">Air Shipping</span>
                          <span className="fw-bold">{stats.airShipping} items ({((stats.airShipping / stats.totalItems) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="progress h-8px">
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${(stats.airShipping / stats.totalItems) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Customers */}
                      <div className="mb-8">
                        <h4 className="fs-6 fw-semibold mb-4">Customer Engagement</h4>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Total Customers</span>
                          <span className="badge badge-light-primary fs-6">{stats.totalCustomers}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Active Customers</span>
                          <span className="badge badge-light-success fs-6">{stats.customersWithItems}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Avg Items per Customer</span>
                          <span className="fw-bold">{(stats.totalItems / stats.customersWithItems || 0).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Issues */}
                      {(stats.damaged > 0 || stats.missing > 0) && (
                        <div className="alert alert-danger d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle fs-3 me-3"></i>
                          <div>
                            <div className="fw-bold">Issues Detected</div>
                            <div className="text-muted fs-7">
                              {stats.damaged > 0 && `${stats.damaged} damaged`}
                              {stats.damaged > 0 && stats.missing > 0 && ', '}
                              {stats.missing > 0 && `${stats.missing} missing`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items by Date Chart */}
              {sortedDates.length > 0 && (
                <div className="row g-5 g-xl-8 mt-5">
                  <div className="col-xl-12">
                    <div className="card card-flush">
                      <div className="card-header">
                        <h3 className="card-title">Items Received (Last 7 Days)</h3>
                      </div>
                      <div className="card-body">
                        {sortedDates.map(([date, count]) => (
                          <div key={date} className="d-flex align-items-center mb-4">
                            <div className="text-muted" style={{ minWidth: '100px' }}>
                              {date}
                            </div>
                            <div className="flex-grow-1 mx-4">
                              <div className="progress h-20px">
                                <div
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{
                                    width: `${(count / Math.max(...sortedDates.map(([, c]) => c))) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="fw-bold" style={{ minWidth: '50px', textAlign: 'right' }}>
                              {count} items
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
