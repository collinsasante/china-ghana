import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getItemsByCustomerId } from '../../services/airtable';
import { getFirstPhotoUrl } from '../../utils/photos';
import type { Item } from '../../types/index';

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const customerItems = await getItemsByCustomerId(user.id);
      // Sort by date descending (newest first)
      const sortedItems = customerItems.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.receivingDate).getTime();
        const dateB = new Date(b.createdAt || b.receivingDate).getTime();
        return dateB - dateA;
      });
      setItems(sortedItems);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load your items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      china_warehouse: { class: 'badge-light-info', label: 'China Warehouse' },
      in_transit: { class: 'badge-light-primary', label: 'In Transit' },
      arrived_ghana: { class: 'badge-light-warning', label: 'Arrived Ghana' },
      ready_for_pickup: { class: 'badge-light-success', label: 'Ready for Pickup' },
      delivered: { class: 'badge-light-success', label: 'Delivered' },
    };

    const config = statusConfig[status] || { class: 'badge-light-secondary', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const openItemDetails = (item: Item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                My Items
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
                <p className="text-gray-600 mt-5">Loading your items...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                My Items
              </h1>
            </div>
          </div>
        </div>

        <div id="kt_app_content" className="app-content flex-column-fluid">
          <div id="kt_app_content_container" className="app-container container-xxl">
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
              <button className="btn btn-sm btn-light ms-3" onClick={loadItems}>
                Try Again
              </button>
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
              My Items
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Items</li>
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
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-2hx fw-bold text-gray-800">{items.length}</div>
                  <div className="fw-semibold text-gray-600">Total Items</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-primary">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-2hx fw-bold text-primary">
                    {items.filter(i => i.status === 'in_transit').length}
                  </div>
                  <div className="fw-semibold text-primary">In Transit</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-success">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-2hx fw-bold text-success">
                    {items.filter(i => i.status === 'ready_for_pickup').length}
                  </div>
                  <div className="fw-semibold text-success">Ready for Pickup</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-info">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="fs-2hx fw-bold text-info">
                    ${items.reduce((sum, item) => sum + item.costUSD, 0).toFixed(2)}
                  </div>
                  <div className="fs-7 text-info">₵{items.reduce((sum, item) => sum + item.costCedis, 0).toFixed(2)}</div>
                  <div className="fw-semibold text-info">Total Cost</div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="card">
            <div className="card-header border-0 pt-6">
              <div className="card-title">
                <h3>All Items ({items.length})</h3>
              </div>
            </div>
            <div className="card-body pt-0">
              {items.length === 0 ? (
                <div className="text-center py-10">
                  <i className="ki-duotone ki-package fs-5x text-gray-400 mb-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  <p className="text-gray-600 fs-5">No items found</p>
                  <p className="text-gray-500">Your items will appear here once they are received in China.</p>
                </div>
              ) : (
                <div className="row g-6">
                  {items.map((item) => (
                    <div key={item.id} className="col-md-6 col-lg-4">
                      <div className="card card-flush border hover-elevate-up">
                        <div className="card-body p-5">
                          {/* Item Photo */}
                          {item.photos && item.photos.length > 0 ? (
                            <img
                              src={getFirstPhotoUrl(item.photos) || ''}
                              alt="Item"
                              className="w-100 rounded mb-4 cursor-pointer"
                              style={{ height: '200px', objectFit: 'cover' }}
                              onClick={() => openItemDetails(item)}
                            />
                          ) : (
                            <div
                              className="rounded mb-4 bg-light d-flex align-items-center justify-content-center"
                              style={{ height: '200px' }}
                            >
                              <i className="ki-duotone ki-picture fs-3x text-gray-400">
                                <span className="path1"></span>
                                <span className="path2"></span>
                              </i>
                            </div>
                          )}

                          {/* Item Details */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h4 className="fs-5 fw-bold text-gray-900 mb-0">
                                {item.name || 'Unnamed Item'}
                              </h4>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-gray-600 fs-7 mb-0">
                              Tracking: {item.trackingNumber}
                            </p>
                          </div>

                          {/* Item Info Grid */}
                          <div className="row g-3 mb-4">
                            <div className="col-6">
                              <div className="bg-light rounded p-3">
                                <div className="fs-7 text-gray-600">Dimensions</div>
                                <div className="fw-bold text-gray-800">
                                  {item.length} × {item.width} × {item.height} {item.dimensionUnit}
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="bg-light rounded p-3">
                                <div className="fs-7 text-gray-600">CBM</div>
                                <div className="fw-bold text-gray-800">{item.cbm.toFixed(4)}</div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="bg-light rounded p-3">
                                <div className="fs-7 text-gray-600">Shipping</div>
                                <div className="fw-bold text-gray-800 text-capitalize">
                                  {item.shippingMethod}
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="bg-light rounded p-3">
                                <div className="fs-7 text-gray-600">Cost</div>
                                <div className="fw-bold text-gray-800">
                                  ${item.costUSD.toFixed(2)}
                                </div>
                                <div className="fs-8 text-gray-600">
                                  ₵{item.costCedis.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <button
                            className="btn btn-sm btn-light-primary w-100"
                            onClick={() => openItemDetails(item)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {showModal && selectedItem && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedItem.name || 'Item Details'}
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-6">
                  {/* Photos */}
                  <div className="col-md-6">
                    <h4 className="mb-4">Photos</h4>
                    {selectedItem.photos && selectedItem.photos.length > 0 ? (
                      <div className="row g-3">
                        {selectedItem.photos.map((photo, index) => {
                          const photoUrl = typeof photo === 'string' ? photo : (photo as any)?.url;
                          return (
                            <div key={index} className="col-12">
                              <img
                                src={photoUrl}
                                alt={`Item photo ${index + 1}`}
                                className="img-fluid rounded cursor-pointer"
                                onClick={() => window.open(photoUrl, '_blank')}
                                style={{ maxHeight: '400px', objectFit: 'contain', width: '100%' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                        <p className="text-gray-500">No photos available</p>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-md-6">
                    <h4 className="mb-4">Item Information</h4>

                    <div className="mb-5">
                      <label className="fs-6 fw-semibold text-gray-800">Status</label>
                      <div className="mt-2">{getStatusBadge(selectedItem.status)}</div>
                    </div>

                    <div className="mb-5">
                      <label className="fs-6 fw-semibold text-gray-800">Tracking Number</label>
                      <p className="text-gray-600 mb-0">{selectedItem.trackingNumber}</p>
                    </div>

                    <div className="mb-5">
                      <label className="fs-6 fw-semibold text-gray-800">Receiving Date</label>
                      <p className="text-gray-600 mb-0">
                        {new Date(selectedItem.receivingDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="separator my-5"></div>

                    <h5 className="mb-4">Dimensions & Shipping</h5>

                    <div className="row g-4 mb-5">
                      <div className="col-6">
                        <label className="fs-7 text-gray-600">Length</label>
                        <p className="fw-bold text-gray-800 mb-0">
                          {selectedItem.length} {selectedItem.dimensionUnit}
                        </p>
                      </div>
                      <div className="col-6">
                        <label className="fs-7 text-gray-600">Width</label>
                        <p className="fw-bold text-gray-800 mb-0">
                          {selectedItem.width} {selectedItem.dimensionUnit}
                        </p>
                      </div>
                      <div className="col-6">
                        <label className="fs-7 text-gray-600">Height</label>
                        <p className="fw-bold text-gray-800 mb-0">
                          {selectedItem.height} {selectedItem.dimensionUnit}
                        </p>
                      </div>
                      <div className="col-6">
                        <label className="fs-7 text-gray-600">CBM</label>
                        <p className="fw-bold text-gray-800 mb-0">
                          {selectedItem.cbm.toFixed(4)} m³
                        </p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="fs-6 fw-semibold text-gray-800">Shipping Method</label>
                      <p className="text-gray-600 mb-0 text-capitalize">{selectedItem.shippingMethod}</p>
                    </div>

                    {selectedItem.weight && (
                      <div className="mb-5">
                        <label className="fs-6 fw-semibold text-gray-800">Weight</label>
                        <p className="text-gray-600 mb-0">
                          {selectedItem.weight} {selectedItem.weightUnit}
                        </p>
                      </div>
                    )}

                    <div className="separator my-5"></div>

                    <h5 className="mb-4">Pricing</h5>

                    <div className="row g-4">
                      <div className="col-6">
                        <label className="fs-7 text-gray-600">Cost (USD)</label>
                        <p className="fw-bold text-gray-800 fs-4 mb-0">
                          ${selectedItem.costUSD.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-6">
                        <label className="fs-7 text-gray-600">Cost (GHS)</label>
                        <p className="fw-bold text-gray-800 fs-4 mb-0">
                          ₵{selectedItem.costCedis.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {selectedItem.containerNumber && (
                      <>
                        <div className="separator my-5"></div>
                        <div className="mb-5">
                          <label className="fs-6 fw-semibold text-gray-800">Container Number</label>
                          <p className="text-gray-600 mb-0">{selectedItem.containerNumber}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowModal(false)}
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
