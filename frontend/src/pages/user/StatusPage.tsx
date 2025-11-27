import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getItemsByCustomerId } from '../../services/airtable';
import { getFirstPhotoUrl } from '../../utils/photos';
import type { Item, ShipmentStatus } from '../../types/index';

export default function StatusPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | ShipmentStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const customerItems = await getItemsByCustomerId(user.id);
      setItems(customerItems);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps: { key: ShipmentStatus; label: string; icon: string }[] = [
    { key: 'china_warehouse', label: 'China Warehouse', icon: 'warehouse' },
    { key: 'in_transit', label: 'In Transit', icon: 'rocket' },
    { key: 'arrived_ghana', label: 'Arrived Ghana', icon: 'geolocation' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: 'check-circle' },
    { key: 'delivered', label: 'Delivered', icon: 'package' },
  ];

  const getStatusIndex = (status: ShipmentStatus): number => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const getStatusColor = (status: ShipmentStatus): string => {
    const colors: Record<ShipmentStatus, string> = {
      china_warehouse: 'info',
      picked_up: 'info',
      in_transit: 'primary',
      arrived_ghana: 'warning',
      ready_for_pickup: 'success',
      delivered: 'success',
    };
    return colors[status] || 'secondary';
  };

  const filteredItems = items.filter(item => {
    // Status filter
    if (selectedStatus !== 'all' && item.status !== selectedStatus) {
      return false;
    }

    // Date filter
    if (startDate || endDate) {
      const itemDate = new Date(item.createdAt || item.receivingDate);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }

    return true;
  });

  const getStatusCount = (status: ShipmentStatus) => {
    return items.filter(item => item.status === status).length;
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Shipment Status
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
                <p className="text-gray-600 mt-5">Loading shipment status...</p>
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
              Shipment Status
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Status</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Status Overview Cards */}
          <div className="row g-5 g-xl-10 mb-5">
            <div className="col-12">
              <div className="card card-flush">
                <div className="card-header pt-7">
                  <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-800">Shipment Pipeline</span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Track all your items</span>
                  </h3>
                </div>
                <div className="card-body pt-6">
                  <div className="row g-5">
                    {statusSteps.map((step) => (
                      <div key={step.key} className="col">
                        <div
                          className={`card card-flush border-hover cursor-pointer ${
                            selectedStatus === step.key ? 'border-primary' : ''
                          }`}
                          onClick={() => setSelectedStatus(step.key)}
                        >
                          <div className="card-body text-center p-5">
                            <div
                              className={`fs-2hx fw-bold text-${getStatusColor(
                                step.key
                              )} mb-2`}
                            >
                              {getStatusCount(step.key)}
                            </div>
                            <div className="fw-semibold text-gray-600 fs-7">
                              {step.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="card mb-5">
            <div className="card-body">
              <div className="row g-4 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-light w-100"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Clear Dates
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="card mb-5">
            <div className="card-header border-0 pt-5">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold fs-3 mb-1">
                  {selectedStatus === 'all' ? 'All Items' : statusSteps.find(s => s.key === selectedStatus)?.label}
                </span>
                <span className="text-muted mt-1 fw-semibold fs-7">
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <div className="card-toolbar">
                <button
                  className={`btn btn-sm ${selectedStatus === 'all' ? 'btn-primary' : 'btn-light'} me-2`}
                  onClick={() => setSelectedStatus('all')}
                >
                  All Items
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={loadItems}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="card">
            <div className="card-body p-0">
              {filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <i className="ki-duotone ki-package fs-5x text-gray-400 mb-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  <p className="text-gray-600 fs-5">No items found</p>
                  <p className="text-gray-500">
                    {selectedStatus === 'all'
                      ? 'Your items will appear here once they are received in China.'
                      : `No items with status "${statusSteps.find(s => s.key === selectedStatus)?.label}"`}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                    <thead>
                      <tr className="fw-bold text-muted">
                        <th className="min-w-150px">Item</th>
                        <th className="min-w-140px">Tracking Number</th>
                        <th className="min-w-120px">Receiving Date</th>
                        <th className="min-w-120px">Shipping Method</th>
                        <th className="min-w-100px">Cost</th>
                        <th className="min-w-400px">Status Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const currentStatusIndex = getStatusIndex(item.status);
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {item.photos && item.photos.length > 0 ? (
                                  <div
                                    className="symbol symbol-50px me-3"
                                    style={{
                                      backgroundImage: `url(${getFirstPhotoUrl(item.photos)})`,
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
                                <div className="d-flex justify-content-start flex-column">
                                  <span className="text-gray-900 fw-bold fs-6">
                                    {item.name || 'Unnamed Item'}
                                  </span>
                                  <span className="text-gray-500 fw-semibold d-block fs-7">
                                    {item.length} × {item.width} × {item.height} {item.dimensionUnit}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-gray-900 fw-bold d-block fs-6">
                                {item.trackingNumber}
                              </span>
                            </td>
                            <td>
                              <span className="text-gray-900 fw-bold d-block fs-6">
                                {new Date(item.receivingDate).toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-light-primary text-capitalize">
                                {item.shippingMethod}
                              </span>
                            </td>
                            <td>
                              <span className="text-gray-900 fw-bold d-block fs-6">
                                ${item.costUSD.toFixed(2)}
                              </span>
                              <span className="text-gray-500 fw-semibold d-block fs-7">
                                ₵{item.costCedis.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              {/* Status Timeline */}
                              <div className="d-flex align-items-center">
                                {statusSteps.map((step, index) => {
                                  const isCompleted = index <= currentStatusIndex;
                                  const isCurrent = index === currentStatusIndex;
                                  return (
                                    <div key={step.key} className="d-flex align-items-center">
                                      <div
                                        className={`d-flex align-items-center justify-content-center rounded-circle ${
                                          isCompleted
                                            ? isCurrent
                                              ? `bg-${getStatusColor(item.status)}`
                                              : 'bg-success'
                                            : 'bg-light'
                                        }`}
                                        style={{ width: '30px', height: '30px' }}
                                        title={step.label}
                                      >
                                        {isCompleted ? (
                                          <i className={`ki-duotone ki-check fs-3 text-white`}>
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                          </i>
                                        ) : (
                                          <div
                                            className="rounded-circle bg-gray-400"
                                            style={{ width: '10px', height: '10px' }}
                                          />
                                        )}
                                      </div>
                                      {index < statusSteps.length - 1 && (
                                        <div
                                          className={`${
                                            isCompleted ? 'bg-success' : 'bg-light'
                                          }`}
                                          style={{ width: '40px', height: '3px' }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-gray-600 fw-semibold fs-7 mt-2">
                                {statusSteps.find(s => s.key === item.status)?.label}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
