import { useState, useEffect } from 'react';
import { getAllItems, getAllCustomers, updateItem, deleteItem } from '../../services/airtable';
import ItemDetailsModal from '../../components/ghana-team/ItemDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { getFirstPhotoUrl } from '../../utils/photos';
import type { Item, User } from '../../types/index';

export default function TaggingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [containerFilter, setContainerFilter] = useState<string>(''); // Filter by container
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set()); // Start with all groups expanded (empty set)
  const [showTaggedItems, setShowTaggedItems] = useState(true); // Tagged items section expanded by default
  const [notification, setNotification] = useState<{type: 'success'|'error'|'warning'|'info', title: string, message: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

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
      setNotification({type: 'error', title: 'Error', message: 'Failed to load data. Please refresh the page.'});
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Get unique container numbers for filter dropdown
  const uniqueContainers = Array.from(new Set(items.map(item => item.containerNumber).filter(Boolean))).sort();

  // Get items without customer assignment (untagged) - sorted by containers when not in Ghana
  const untaggedItems = items
    .filter((item) => !item.customerId)
    .filter((item) => !containerFilter || item.containerNumber === containerFilter)
    .sort((a, b) => {
      // If items are not yet in Ghana (china_warehouse or in_transit), sort by container
      const aNotInGhana = a.status === 'china_warehouse' || a.status === 'in_transit';
      const bNotInGhana = b.status === 'china_warehouse' || b.status === 'in_transit';

      if (aNotInGhana && bNotInGhana) {
        // Both not in Ghana - sort by container number, then by date
        if (a.containerNumber && b.containerNumber) {
          const containerCompare = a.containerNumber.localeCompare(b.containerNumber);
          if (containerCompare !== 0) return containerCompare;
        } else if (a.containerNumber) {
          return -1; // Items with containers come first
        } else if (b.containerNumber) {
          return 1;
        }
      }

      // Default: sort by creation date (newest first)
      const dateA = new Date(a.createdAt || a.receivingDate).getTime();
      const dateB = new Date(b.createdAt || b.receivingDate).getTime();
      return dateB - dateA;
    });

  // Get items with customer assignment (tagged) - sorted by most recently tagged
  const taggedItems = items
    .filter((item) => item.customerId)
    .filter((item) => !containerFilter || item.containerNumber === containerFilter)
    .sort((a, b) => {
      // Sort by updatedAt descending (most recently tagged first)
      const dateA = new Date(a.updatedAt || a.createdAt || a.receivingDate).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || b.receivingDate).getTime();
      return dateB - dateA;
    });

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

  // Group items by upload date
  const groupItemsByDate = (items: Item[]) => {
    const groups = new Map<string, Item[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    items.forEach((item) => {
      const itemDate = new Date(item.createdAt || item.receivingDate);
      itemDate.setHours(0, 0, 0, 0);

      let label = '';
      if (itemDate.getTime() === today.getTime()) {
        label = 'Today';
      } else if (itemDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        label = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(item);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  };

  const groupedUntaggedItems = groupItemsByDate(filteredUntaggedItems);

  // Groups start expanded by default (no auto-collapse)

  const toggleGroupCollapse = (label: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(label)) {
      newCollapsed.delete(label);
    } else {
      newCollapsed.add(label);
    }
    setCollapsedGroups(newCollapsed);
  };

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

  // Group tagged items by date
  const groupedTaggedItems = groupItemsByDate(filteredTaggedItems);

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

  const handleUnassignCustomer = (itemId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Customer Assignment',
      message: 'Are you sure you want to remove customer assignment from this item?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await updateItem(itemId, { customerId: '' });
          await loadData();
          setNotification({type: 'success', title: 'Success!', message: 'Customer unassigned successfully!'});
          setTimeout(() => setNotification(null), 3000);
        } catch (error) {
          console.error('Failed to unassign customer:', error);
          setNotification({type: 'error', title: 'Error', message: 'Failed to unassign customer. Please try again.'});
          setTimeout(() => setNotification(null), 3000);
        }
      },
    });
  };

  const handleDeleteItem = (itemId: string, trackingNumber: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete item ${trackingNumber}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await deleteItem(itemId);
          await loadData();
          setNotification({type: 'success', title: 'Success!', message: 'Item deleted successfully!'});
          setTimeout(() => setNotification(null), 3000);
        } catch (error) {
          console.error('Failed to delete item:', error);
          setNotification({type: 'error', title: 'Error', message: 'Failed to delete item. Please try again.'});
          setTimeout(() => setNotification(null), 3000);
        }
      },
    });
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

          {/* Search & Filter */}
          <div className="card mb-5">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-8">
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
                <div className="col-md-4">
                  <select
                    className="form-select form-select-lg form-select-solid"
                    value={containerFilter}
                    onChange={(e) => setContainerFilter(e.target.value)}
                  >
                    <option value="">All Containers</option>
                    {uniqueContainers.map((container) => (
                      <option key={container} value={container}>
                        {container}
                      </option>
                    ))}
                  </select>
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
                <>
                  {groupedUntaggedItems.map((group) => {
                    const isCollapsed = collapsedGroups.has(group.label);
                    return (
                    <div key={group.label} className="mb-5">
                      <div
                        className="d-flex align-items-center mb-4 cursor-pointer hover-bg-light p-3 rounded"
                        onClick={() => toggleGroupCollapse(group.label)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'} fs-3 text-primary me-2`}></i>
                        <i className="bi bi-calendar3 fs-3 text-primary me-3"></i>
                        <h4 className="mb-0 text-primary">{group.label}</h4>
                        <span className="badge badge-light-primary ms-3">{group.items.length} items</span>
                      </div>
                      {!isCollapsed && (
                      <div className="row g-5">
                        {group.items.map((item) => (
                    <div key={item.id} className="col-md-3 col-sm-6">
                      <div className="card card-flush h-100 shadow-sm">
                        <div className="card-body p-3">
                          {/* Photo */}
                          <div className="position-relative mb-3">
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={getFirstPhotoUrl(item.photos) || ''}
                                alt="Item"
                                className="w-100 rounded cursor-pointer"
                                style={{ height: '200px', objectFit: 'cover' }}
                                onClick={() => handleOpenDetailsModal(item)}
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

                            {/* Container Number - Important for shipping flow */}
                            {item.containerNumber && (
                              <>
                                <div className="text-muted fs-7 mt-2 mb-1">
                                  <i className="bi bi-box-seam me-1"></i>
                                  Container
                                </div>
                                <div className="fw-bold text-primary">{item.containerNumber}</div>
                              </>
                            )}

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

                            {/* Show container-based tracking notice */}
                            {item.containerNumber && (item.status === 'china_warehouse' || item.status === 'in_transit') && (
                              <div className="alert alert-light-info p-2 mt-2 mb-0">
                                <small>
                                  <i className="bi bi-info-circle me-1"></i>
                                  Tracked by container
                                </small>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary flex-grow-1"
                              onClick={() => handleOpenDetailsModal(item)}
                            >
                              <i className="bi bi-pencil-square me-2"></i>
                              Add Item Details
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteItem(item.id, item.trackingNumber)}
                              title="Delete item"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                        ))}
                      </div>
                      )}
                    </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Tagged Items - For Reference */}
          <div className="card">
            <div
              className="card-header cursor-pointer hover-bg-light"
              onClick={() => setShowTaggedItems(!showTaggedItems)}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="d-flex align-items-center">
                <i className={`bi ${showTaggedItems ? 'bi-chevron-down' : 'bi-chevron-right'} fs-3 text-success me-2`}></i>
                <h3 className="card-title mb-0">
                  <i className="bi bi-check-circle me-2 text-success"></i>
                  Tagged Items ({filteredTaggedItems.length})
                </h3>
              </div>
            </div>
            {showTaggedItems && (
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
                <>
                  {groupedTaggedItems.map((group) => {
                    const isCollapsed = collapsedGroups.has(`tagged-${group.label}`);
                    return (
                    <div key={`tagged-${group.label}`} className="mb-5">
                      <div
                        className="d-flex align-items-center mb-4 cursor-pointer hover-bg-light p-3 rounded"
                        onClick={() => toggleGroupCollapse(`tagged-${group.label}`)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'} fs-3 text-success me-2`}></i>
                        <i className="bi bi-calendar3 fs-3 text-success me-3"></i>
                        <h4 className="mb-0 text-success">{group.label}</h4>
                        <span className="badge badge-light-success ms-3">{group.items.length} items</span>
                      </div>
                      {!isCollapsed && (
                      <div className="row g-5">
                        {group.items.map((item) => (
                    <div key={item.id} className="col-md-3 col-sm-6">
                      <div className="card card-flush h-100 border border-success">
                        <div className="card-body p-3">
                          {/* Photo */}
                          <div className="position-relative mb-3">
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={getFirstPhotoUrl(item.photos) || ''}
                                alt="Item"
                                className="w-100 rounded cursor-pointer"
                                style={{ height: '150px', objectFit: 'cover' }}
                                onClick={() => handleOpenDetailsModal(item)}
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

                            {item.costUSD > 0 && (
                              <>
                                <div className="text-muted fs-8 mt-2 mb-1">Cost</div>
                                <div className="fw-bold fs-7 text-primary">
                                  ${item.costUSD.toFixed(2)}
                                </div>
                                <div className="fs-8 text-muted">
                                  ₵{item.costCedis.toFixed(2)}
                                </div>
                              </>
                            )}
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
                    );
                  })}
                </>
              )}
            </div>
            )}
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmButtonClass="btn-danger"
      />

      {/* Toast Notification */}
      {notification && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, marginTop: '70px' }}>
          <div className={`toast show align-items-center text-white bg-${notification.type} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <strong>{notification.title}</strong>
                <div className="small">{notification.message}</div>
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setNotification(null)}></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
