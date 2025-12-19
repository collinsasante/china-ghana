import { useState, useEffect } from 'react';
import { getAllItems, getItemsByContainerNumber, updateItemsByContainer } from '../../services/airtable';
import ConfirmModal from '../../components/common/ConfirmModal';
import type { Container, Item } from '../../types/index';

// Virtual container interface built from items
interface VirtualContainer {
  id: string;
  containerNumber: string;
  receivingDate: string;
  expectedArrivalGhana: string;
  actualArrivalGhana?: string;
  status: string;
  itemCount: number;
  items: Item[];
}

export default function ContainerArrivalPage() {
  const [containers, setContainers] = useState<VirtualContainer[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [containerItems, setContainerItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // Show all containers by default
  const [notification, setNotification] = useState<{type: 'success'|'error'|'warning'|'info', title: string, message: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      setLoading(true);
      console.log('[ContainerArrival] Loading items to build containers...');

      // Get all items
      const allItems = await getAllItems();
      console.log('[ContainerArrival] Total items:', allItems.length);

      // Group items by container number
      const containerMap = new Map<string, Item[]>();

      allItems.forEach((item) => {
        if (item.containerNumber) {
          const existing = containerMap.get(item.containerNumber) || [];
          containerMap.set(item.containerNumber, [...existing, item]);
        }
      });

      console.log('[ContainerArrival] Unique containers found:', containerMap.size);

      // Build virtual containers from grouped items
      const virtualContainers: VirtualContainer[] = Array.from(containerMap.entries()).map(
        ([containerNumber, items]) => {
          // Determine container status from items (all items should have same status if container-driven)
          const statuses = items.map(i => i.status);
          const containerStatus = statuses[0] || 'china_warehouse';

          // Get earliest receiving date
          const receivingDates = items.map(i => i.receivingDate).filter(Boolean);
          const earliestReceivingDate = receivingDates.length > 0
            ? receivingDates.sort()[0]
            : new Date().toISOString();

          return {
            id: containerNumber, // Use container number as ID
            containerNumber,
            receivingDate: earliestReceivingDate,
            expectedArrivalGhana: '', // Not stored with items, would need separate Container table
            status: containerStatus,
            itemCount: items.length,
            items,
          };
        }
      );

      console.log('[ContainerArrival] Virtual containers built:', virtualContainers.length);
      setContainers(virtualContainers);
    } catch (error) {
      console.error('[ContainerArrival] Failed to load containers:', error);
      setNotification({type: 'error', title: 'Error', message: 'Failed to load containers. Please refresh the page.'});
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadContainerItems = async (containerNumber: string) => {
    try {
      setLoadingItems(true);
      const items = await getItemsByContainerNumber(containerNumber);
      setContainerItems(items);
    } catch (error) {
      console.error('Failed to load container items:', error);
      setNotification({type: 'error', title: 'Error', message: 'Failed to load container items.'});
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewContainer = async (container: VirtualContainer) => {
    setSelectedContainer(container as any);
    // Items are already loaded in the virtual container
    setContainerItems(container.items);
  };

  const handleMarkAsArrived = (container: VirtualContainer) => {
    setConfirmModal({
      isOpen: true,
      title: 'Mark Container as Arrived',
      message: `Are you sure you want to mark container ${container.containerNumber} as arrived in Ghana? This will update the status of all ${container.itemCount} items in this container to "Arrived Ghana".`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          // Update all items in container to arrived_ghana status
          const updatedCount = await updateItemsByContainer(container.containerNumber, {
            status: 'arrived_ghana',
          });

          await loadContainers();
          if (selectedContainer?.containerNumber === container.containerNumber) {
            const updatedItems = await getItemsByContainerNumber(container.containerNumber);
            setContainerItems(updatedItems);
          }

          setNotification({
            type: 'success',
            title: 'Container Arrived!',
            message: `Container ${container.containerNumber} marked as arrived. ${updatedCount} items updated to "Arrived Ghana" status.`
          });
          setTimeout(() => setNotification(null), 5000);
        } catch (error) {
          console.error('Failed to mark container as arrived:', error);
          setNotification({type: 'error', title: 'Error', message: 'Failed to mark container as arrived. Please try again.'});
          setTimeout(() => setNotification(null), 3000);
        }
      },
    });
  };

  // Filter containers
  const filteredContainers = containers.filter((container) => {
    const matchesSearch = !searchQuery ||
      container.containerNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || container.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log('[ContainerArrival] Total containers:', containers.length);
  console.log('[ContainerArrival] Search query:', searchQuery);
  console.log('[ContainerArrival] Status filter:', statusFilter);
  console.log('[ContainerArrival] Filtered containers:', filteredContainers.length);
  console.log('[ContainerArrival] Container statuses:', containers.map(c => ({ id: c.containerNumber, status: c.status })));

  // Sort: In transit first, then by expected arrival
  const sortedContainers = [...filteredContainers].sort((a, b) => {
    // Prioritize in_transit containers
    if (a.status === 'in_transit' && b.status !== 'in_transit') return -1;
    if (a.status !== 'in_transit' && b.status === 'in_transit') return 1;

    // Then sort by expected arrival date
    const dateA = new Date(a.expectedArrivalGhana || a.receivingDate).getTime();
    const dateB = new Date(b.expectedArrivalGhana || b.receivingDate).getTime();
    return dateA - dateB;
  });

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Container Arrival Scanning
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Ghana Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Container Arrival</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">

          {/* Info Alert */}
          <div className="alert alert-light-primary mb-5">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle fs-2 me-3"></i>
              <div>
                <strong>Container Arrival Process:</strong> When a container arrives in Ghana, scan or select it here to mark all items as "Arrived Ghana".
                Items will then be available for individual scanning and customer assignment in the Tagging page.
              </div>
            </div>
          </div>

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
                      placeholder="Search by container number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select form-select-lg form-select-solid"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="china_warehouse">China Warehouse</option>
                    <option value="in_transit">In Transit</option>
                    <option value="arrived_ghana">Arrived Ghana</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Containers List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-box-seam me-2"></i>
                Containers ({sortedContainers.length})
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading containers...</div>
                </div>
              ) : sortedContainers.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <i className="bi bi-inbox fs-3x"></i>
                  <div className="mt-3">No containers found matching your criteria.</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-300 align-middle gy-5">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th className="ps-5">Container Number</th>
                        <th>Items</th>
                        <th>Expected Arrival</th>
                        <th>Actual Arrival</th>
                        <th>Status</th>
                        <th className="text-end pe-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedContainers.map((container) => (
                        <tr key={container.id}>
                          <td className="ps-5">
                            <div className="d-flex align-items-center">
                              <div className="symbol symbol-circle symbol-50px overflow-hidden me-3">
                                <div className="symbol-label bg-light-primary">
                                  <i className="bi bi-box-seam fs-2 text-primary"></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-bold text-gray-800 fs-6">{container.containerNumber}</div>
                                <div className="text-muted fs-7">ID: {container.id.substring(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-light-primary fs-6">
                              {container.itemCount} items
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold">
                              {container.expectedArrivalGhana ?
                                new Date(container.expectedArrivalGhana).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                                : 'Not set'}
                            </div>
                          </td>
                          <td>
                            {container.actualArrivalGhana ? (
                              <div className="text-success fw-bold">
                                {new Date(container.actualArrivalGhana).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              container.status === 'china_warehouse' ? 'badge-warning' :
                              container.status === 'in_transit' ? 'badge-info' :
                              container.status === 'arrived_ghana' ? 'badge-success' :
                              'badge-secondary'
                            }`}>
                              {container.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="text-end pe-5">
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-light-primary"
                                onClick={() => handleViewContainer(container)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                View Items
                              </button>
                              {container.status === 'in_transit' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleMarkAsArrived(container)}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Mark as Arrived
                                </button>
                              )}
                            </div>
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

      {/* Container Details Modal */}
      {selectedContainer && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h3 className="modal-title text-white">
                  <i className="bi bi-box-seam me-2"></i>
                  Container: {selectedContainer.containerNumber}
                </h3>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setSelectedContainer(null);
                    setContainerItems([]);
                  }}
                ></button>
              </div>

              <div className="modal-body">
                {/* Container Info */}
                <div className="card mb-5 border border-primary">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="text-muted mb-1">Container Number</div>
                        <div className="fw-bold fs-5">{selectedContainer.containerNumber}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted mb-1">Total Items</div>
                        <div className="fw-bold fs-5">{selectedContainer.itemCount}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted mb-1">Expected Arrival</div>
                        <div className="fw-bold fs-5">
                          {selectedContainer.expectedArrivalGhana ?
                            new Date(selectedContainer.expectedArrivalGhana).toLocaleDateString()
                            : 'Not set'}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-muted mb-1">Status</div>
                        <span className={`badge ${
                          selectedContainer.status === 'china_warehouse' ? 'badge-warning' :
                          selectedContainer.status === 'in_transit' ? 'badge-info' :
                          selectedContainer.status === 'arrived_ghana' ? 'badge-success' :
                          'badge-secondary'
                        } fs-6`}>
                          {selectedContainer.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items in Container */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title mb-0">Items in Container</h4>
                  </div>
                  <div className="card-body">
                    {loadingItems ? (
                      <div className="text-center py-5">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Loading items...
                      </div>
                    ) : containerItems.length === 0 ? (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        No items found in this container.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-row-bordered align-middle">
                          <thead>
                            <tr className="fw-bold text-muted bg-light">
                              <th>Tracking Number</th>
                              <th>Item Name</th>
                              <th>Customer</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {containerItems.map((item) => (
                              <tr key={item.id}>
                                <td className="fw-bold">{item.trackingNumber}</td>
                                <td>{item.name || '-'}</td>
                                <td>{item.customerId ? 'Assigned' : <span className="text-muted">Unassigned</span>}</td>
                                <td>
                                  <span className={`badge ${
                                    item.status === 'china_warehouse' ? 'badge-light-warning' :
                                    item.status === 'in_transit' ? 'badge-light-info' :
                                    item.status === 'arrived_ghana' ? 'badge-light-success' :
                                    'badge-light-primary'
                                  }`}>
                                    {item.status.replace(/_/g, ' ').toUpperCase()}
                                  </span>
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

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setSelectedContainer(null);
                    setContainerItems([]);
                  }}
                >
                  Close
                </button>
                {selectedContainer.status === 'in_transit' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => handleMarkAsArrived(selectedContainer)}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Mark as Arrived in Ghana
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmButtonClass="btn-success"
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
