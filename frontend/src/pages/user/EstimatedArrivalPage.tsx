import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getItemsByCustomerId, getAllContainers } from '../../services/airtable';
import type { Item, Container } from '../../types/index';

export default function EstimatedArrivalPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [customerItems, allContainers] = await Promise.all([
        getItemsByCustomerId(user.id),
        getAllContainers(),
      ]);

      setItems(customerItems);
      setContainers(allContainers);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get containers that have customer items
  const getCustomerContainers = () => {
    const customerContainerNumbers = new Set(
      items
        .filter(item => item.containerNumber)
        .map(item => item.containerNumber!)
    );

    return containers.filter(container =>
      customerContainerNumbers.has(container.containerNumber)
    );
  };

  const getItemsInContainer = (containerNumber: string) => {
    return items.filter(item => item.containerNumber === containerNumber);
  };

  const getUnassignedItems = () => {
    return items.filter(item => !item.containerNumber);
  };

  const customerContainers = getCustomerContainers();
  const unassignedItems = getUnassignedItems();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      at_origin: { class: 'badge-light-info', label: 'At Origin' },
      in_transit: { class: 'badge-light-primary', label: 'In Transit' },
      arrived: { class: 'badge-light-success', label: 'Arrived' },
      customs_clearance: { class: 'badge-light-warning', label: 'Customs Clearance' },
      ready_for_distribution: { class: 'badge-light-success', label: 'Ready' },
    };

    const config = statusConfig[status] || { class: 'badge-light-secondary', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const calculateDaysUntilArrival = (estimatedArrival: string) => {
    const arrival = new Date(estimatedArrival);
    const today = new Date();
    const diffTime = arrival.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Estimated Arrival
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
                <p className="text-gray-600 mt-5">Loading arrival information...</p>
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
              Estimated Arrival
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Estimated Arrival</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Summary Cards */}
          <div className="row g-5 g-xl-10 mb-5">
            <div className="col-md-4">
              <div className="card card-flush h-100 bg-light-primary">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-primary mb-2">
                    {customerContainers.length}
                  </div>
                  <div className="fw-semibold text-primary">Active Containers</div>
                  <div className="text-gray-600 fs-7 mt-2">
                    Containers with your items
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-flush h-100 bg-light-info">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-info mb-2">
                    {items.filter(i => i.containerNumber).length}
                  </div>
                  <div className="fw-semibold text-info">Items Shipped</div>
                  <div className="text-gray-600 fs-7 mt-2">
                    Items assigned to containers
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body">
                  <div className="fs-2hx fw-bold text-warning mb-2">
                    {unassignedItems.length}
                  </div>
                  <div className="fw-semibold text-warning">Pending</div>
                  <div className="text-gray-600 fs-7 mt-2">
                    Awaiting container assignment
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Containers */}
          {customerContainers.length > 0 && (
            <div className="card mb-5">
              <div className="card-header border-0 pt-6">
                <div className="card-title">
                  <h3>Your Container Shipments</h3>
                </div>
              </div>
              <div className="card-body pt-0">
                <div className="row g-6">
                  {customerContainers.map((container) => {
                    const containerItems = getItemsInContainer(container.containerNumber);
                    const daysUntil = calculateDaysUntilArrival(container.estimatedArrival);

                    return (
                      <div key={container.id} className="col-md-6">
                        <div className="card card-flush border h-100">
                          <div className="card-header">
                            <h3 className="card-title">
                              Container {container.containerNumber}
                            </h3>
                            <div className="card-toolbar">
                              {getStatusBadge(container.status)}
                            </div>
                          </div>
                          <div className="card-body">
                            {/* Arrival Info */}
                            <div className="mb-5">
                              <div className="d-flex align-items-center mb-3">
                                <i className="ki-duotone ki-calendar fs-2x text-primary me-3">
                                  <span className="path1"></span>
                                  <span className="path2"></span>
                                </i>
                                <div>
                                  <div className="fs-5 fw-bold text-gray-800">
                                    {new Date(container.estimatedArrival).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </div>
                                  <div className="text-gray-600 fs-7">
                                    {daysUntil > 0 ? (
                                      <span>Arriving in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</span>
                                    ) : daysUntil === 0 ? (
                                      <span className="text-success fw-bold">Arriving Today!</span>
                                    ) : (
                                      <span className="text-danger">Expected arrival date passed</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Route */}
                            <div className="separator my-5"></div>
                            <div className="mb-5">
                              <h5 className="mb-3">Shipping Route</h5>
                              <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                  <div className="fw-bold text-gray-800">China</div>
                                  <div className="text-gray-600 fs-7">
                                    {new Date(container.departureDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="px-5">
                                  <i className="ki-duotone ki-arrow-right fs-2x text-primary">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                  </i>
                                </div>
                                <div className="flex-grow-1 text-end">
                                  <div className="fw-bold text-gray-800">Ghana</div>
                                  <div className="text-gray-600 fs-7">
                                    {new Date(container.estimatedArrival).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Container Details */}
                            <div className="separator my-5"></div>
                            <div className="mb-5">
                              <h5 className="mb-3">Container Details</h5>
                              <div className="row g-3">
                                <div className="col-6">
                                  <div className="bg-light rounded p-3">
                                    <div className="fs-7 text-gray-600">Shipping Method</div>
                                    <div className="fw-bold text-gray-800 text-capitalize">
                                      {container.shippingMethod}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="bg-light rounded p-3">
                                    <div className="fs-7 text-gray-600">Your Items</div>
                                    <div className="fw-bold text-gray-800">
                                      {containerItems.length} item{containerItems.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Items in Container */}
                            <div className="separator my-5"></div>
                            <div>
                              <h5 className="mb-3">Your Items in this Container</h5>
                              <div className="mh-300px overflow-auto">
                                {containerItems.map((item) => (
                                  <div key={item.id} className="d-flex align-items-center mb-3 p-3 rounded bg-light">
                                    {item.photos && item.photos.length > 0 ? (
                                      <div
                                        className="symbol symbol-40px me-3"
                                        style={{
                                          backgroundImage: `url(${item.photos[0]})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                        }}
                                      />
                                    ) : (
                                      <div className="symbol symbol-40px me-3">
                                        <div className="symbol-label bg-white">
                                          <i className="ki-duotone ki-package fs-2x text-gray-400">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                          </i>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex-grow-1">
                                      <div className="fw-bold text-gray-800">
                                        {item.name || 'Unnamed Item'}
                                      </div>
                                      <div className="text-gray-600 fs-7">
                                        {item.trackingNumber}
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <div className="fw-bold text-gray-800">
                                        ${item.costUSD.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-3 border-top">
                                <div className="d-flex justify-content-between">
                                  <span className="fw-bold text-gray-800">Total Cost:</span>
                                  <span className="fw-bold text-gray-800 fs-4">
                                    ${containerItems.reduce((sum, item) => sum + item.costUSD, 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Unassigned Items */}
          {unassignedItems.length > 0 && (
            <div className="card">
              <div className="card-header border-0 pt-6">
                <div className="card-title">
                  <h3>Items Awaiting Container Assignment</h3>
                </div>
                <div className="card-toolbar">
                  <span className="badge badge-light-warning fs-6">
                    {unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="card-body pt-0">
                <div className="alert alert-info mb-5">
                  <div className="d-flex align-items-center">
                    <i className="ki-duotone ki-information fs-2x text-info me-3">
                      <span className="path1"></span>
                      <span className="path2"></span>
                      <span className="path3"></span>
                    </i>
                    <div>
                      <strong>Pending Container Assignment</strong>
                      <p className="mb-0 mt-1">
                        These items are currently in our China warehouse and will be assigned to a container soon.
                        You'll receive an estimated arrival date once they're shipped.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                    <thead>
                      <tr className="fw-bold text-muted">
                        <th>Item</th>
                        <th>Tracking Number</th>
                        <th>Receiving Date</th>
                        <th>Shipping Method</th>
                        <th>Cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassignedItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.photos && item.photos.length > 0 ? (
                                <div
                                  className="symbol symbol-50px me-3"
                                  style={{
                                    backgroundImage: `url(${item.photos[0]})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }}
                                />
                              ) : (
                                <div className="symbol symbol-50px me-3">
                                  <div className="symbol-label bg-light">
                                    <i className="ki-duotone ki-package fs-2x text-gray-400">
                                      <span className="path1"></span>
                                      <span className="path2"></span>
                                    </i>
                                  </div>
                                </div>
                              )}
                              <span className="text-gray-900 fw-bold fs-6">
                                {item.name || 'Unnamed Item'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-bold">{item.trackingNumber}</span>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-bold">
                              {new Date(item.receivingDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-light-primary text-capitalize">
                              {item.shippingMethod}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-900 fw-bold">
                              ${item.costUSD.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-light-info">
                              {item.status === 'china_warehouse' ? 'In Warehouse' : item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {customerContainers.length === 0 && unassignedItems.length === 0 && items.length === 0 && (
            <div className="card">
              <div className="card-body text-center py-20">
                <i className="ki-duotone ki-delivery-3 fs-5x text-gray-400 mb-5">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
                <h3 className="text-gray-800 mb-3">No Shipments Yet</h3>
                <p className="text-gray-600">
                  You don't have any items or shipments yet. Your estimated arrival dates will appear here once your items are received and shipped.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
