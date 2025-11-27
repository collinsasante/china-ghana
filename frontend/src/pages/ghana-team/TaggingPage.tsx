import { useState, useEffect } from 'react';
import { getAllItems, getAllCustomers, updateItem } from '../../services/airtable';
import ItemDetailsModal from '../../components/ghana-team/ItemDetailsModal';
import type { Item, User } from '../../types/index';

export default function TaggingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      alert('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Get items without customer assignment (untagged)
  const untaggedItems = items.filter((item) => !item.customerId);

  // Get items with customer assignment (tagged)
  const taggedItems = items.filter((item) => item.customerId);

  const getCustomerName = (customerId: string | string[]) => {
    const actualId = Array.isArray(customerId) ? customerId[0] : customerId;
    const customer = customers.find((c) => c.id === actualId);
    return customer?.name || 'Unknown Customer';
  };

  const filteredUntaggedItems = untaggedItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.trackingNumber.toLowerCase().includes(query) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.containerNumber && item.containerNumber.toLowerCase().includes(query))
    );
  });

  const filteredTaggedItems = taggedItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.trackingNumber.toLowerCase().includes(query) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.containerNumber && item.containerNumber.toLowerCase().includes(query)) ||
      getCustomerName(item.customerId).toLowerCase().includes(query)
    );
  });

  const handleOpenDetailsModal = (item: Item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleSubmitDetails = async (itemData: Partial<Item>) => {
    if (!selectedItem) return;

    await updateItem(selectedItem.id, itemData);
    await loadData();
    setShowDetailsModal(false);
    setSelectedItem(null);
  };

  const handleUnassignCustomer = async (itemId: string) => {
    if (!window.confirm('Remove customer assignment from this item?')) {
      return;
    }

    try {
      await updateItem(itemId, { customerId: '' });
      await loadData();
      alert('✅ Customer unassigned successfully!');
    } catch (error) {
      console.error('Failed to unassign customer:', error);
      alert('Failed to unassign customer. Please try again.');
    }
  };

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Item Tagging
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Ghana Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Tagging</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-light-warning fs-6">
              {filteredUntaggedItems.length} Needing Details
            </span>
            <span className="badge badge-light-success fs-6">
              {filteredTaggedItems.length} Tagged
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
                  placeholder="Search by tracking number, item name, container number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="card mb-5 bg-light-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle fs-2x text-primary me-4"></i>
                <div>
                  <h4 className="mb-2 text-primary">Ghana Team - Add Complete Item Details</h4>
                  <p className="mb-0 text-gray-700">
                    Photos have been uploaded by the China team. Click "Add Item Details" on any photo to enter tracking number,
                    dimensions, weight, costs, and assign to the correct customer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Untagged Items - Main Focus */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-tag me-2 text-warning"></i>
                Items Needing Details ({filteredUntaggedItems.length})
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading items...</div>
                </div>
              ) : filteredUntaggedItems.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <i className="bi bi-check-circle fs-3x text-success"></i>
                  <div className="mt-3 fs-5 fw-bold">All items have been tagged!</div>
                  <div className="mt-1">No items needing details at the moment.</div>
                </div>
              ) : (
                <div className="row g-5">
                  {filteredUntaggedItems.map((item) => (
                    <div key={item.id} className="col-md-3 col-sm-6">
                      <div className="card card-flush h-100 shadow-sm">
                        <div className="card-body p-3">
                          {/* Photo */}
                          <div className="position-relative mb-3">
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={
                                  typeof item.photos[0] === 'string'
                                    ? item.photos[0]
                                    : (item.photos[0] as any)?.url
                                }
                                alt="Item"
                                className="w-100 rounded"
                                style={{ height: '200px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="w-100 rounded bg-light d-flex align-items-center justify-content-center"
                                style={{ height: '200px' }}
                              >
                                <i className="bi bi-image fs-3x text-muted"></i>
                              </div>
                            )}

                            {/* Warning Badge */}
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className="badge badge-warning">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Needs Details
                              </span>
                            </div>
                          </div>

                          {/* Item Info */}
                          <div className="mb-3">
                            <div className="text-muted fs-7 mb-1">Tracking Number</div>
                            <div className="fw-bold">{item.trackingNumber || 'Not set'}</div>

                            <div className="text-muted fs-7 mt-2 mb-1">Received</div>
                            <div className="fw-bold">{item.receivingDate || 'Unknown'}</div>

                            <div className="text-muted fs-7 mt-2 mb-1">Status</div>
                            <div>
                              <span className={`badge ${
                                item.status === 'china_warehouse' ? 'badge-light-warning' :
                                item.status === 'in_transit' ? 'badge-light-info' :
                                item.status === 'arrived_ghana' ? 'badge-light-primary' :
                                'badge-light-success'
                              }`}>
                                {item.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Add Details Button */}
                          <button
                            className="btn btn-primary w-100"
                            onClick={() => handleOpenDetailsModal(item)}
                          >
                            <i className="bi bi-pencil-square me-2"></i>
                            Add Item Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tagged Items - For Reference */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-check-circle me-2 text-success"></i>
                Tagged Items ({filteredTaggedItems.length})
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading items...</div>
                </div>
              ) : filteredTaggedItems.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <i className="bi bi-inbox fs-3x"></i>
                  <div className="mt-3">No tagged items yet.</div>
                </div>
              ) : (
                <div className="row g-5">
                  {filteredTaggedItems.map((item) => (
                    <div key={item.id} className="col-md-3 col-sm-6">
                      <div className="card card-flush h-100 border border-success">
                        <div className="card-body p-3">
                          {/* Photo */}
                          <div className="position-relative mb-3">
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={
                                  typeof item.photos[0] === 'string'
                                    ? item.photos[0]
                                    : (item.photos[0] as any)?.url
                                }
                                alt="Item"
                                className="w-100 rounded"
                                style={{ height: '150px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="w-100 rounded bg-light d-flex align-items-center justify-content-center"
                                style={{ height: '150px' }}
                              >
                                <i className="bi bi-image fs-3x text-muted"></i>
                              </div>
                            )}

                            {/* Success Badge */}
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className="badge badge-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Tagged
                              </span>
                            </div>
                          </div>

                          {/* Item Info */}
                          <div className="mb-2">
                            <div className="text-muted fs-8 mb-1">Customer</div>
                            <div className="fw-bold fs-6 mb-2">{getCustomerName(item.customerId)}</div>

                            <div className="text-muted fs-8 mb-1">Tracking</div>
                            <div className="fw-bold fs-7">{item.trackingNumber}</div>

                            {item.name && (
                              <>
                                <div className="text-muted fs-8 mt-2 mb-1">Item</div>
                                <div className="fs-7">{item.name}</div>
                              </>
                            )}

                            <div className="text-muted fs-8 mt-2 mb-1">CBM</div>
                            <div className="fs-7">{item.cbm?.toFixed(6) || '0'} m³</div>
                          </div>

                          {/* Actions */}
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-light-primary flex-fill"
                              onClick={() => handleOpenDetailsModal(item)}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-light-danger"
                              onClick={() => handleUnassignCustomer(item.id)}
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </div>
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
      {selectedItem && (
        <ItemDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedItem(null);
          }}
          onSubmit={handleSubmitDetails}
          item={selectedItem}
          customers={customers}
        />
      )}
    </div>
  );
}
