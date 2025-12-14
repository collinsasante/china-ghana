import { useState, useEffect } from 'react';
import { getAllItems, updateItem } from '../../services/airtable';
import { getFirstPhotoUrl } from '../../utils/photos';
import ItemDetailsModal from '../../components/common/ItemDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import InputModal from '../../components/common/InputModal';
import { useToast } from '../../context/ToastContext';
import type { Item } from '../../types/index';

interface Container {
  containerNumber: string;
  items: Item[];
  totalCBM: number;
  totalValue: number;
  itemCount: number;
}

export default function ContainerManagementPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [containerNumber, setContainerNumber] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showNewContainerModal, setShowNewContainerModal] = useState(false);
  const [showAddToContainerModal, setShowAddToContainerModal] = useState(false);
  const [targetContainer, setTargetContainer] = useState<string>('');
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [inputModal, setInputModal] = useState<{isOpen: boolean, title: string, message: string, onSubmit: (value: string) => void}>({
    isOpen: false,
    title: '',
    message: '',
    onSubmit: () => {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const itemsData = await getAllItems();
      // Sort items by date descending (newest first)
      const sortedItems = itemsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.receivingDate).getTime();
        const dateB = new Date(b.createdAt || b.receivingDate).getTime();
        return dateB - dateA;
      });
      setItems(sortedItems);

      // Group items by container number
      const containerMap = new Map<string, Item[]>();

      sortedItems.forEach((item) => {
        if (item.containerNumber) {
          const existing = containerMap.get(item.containerNumber) || [];
          containerMap.set(item.containerNumber, [...existing, item]);
        }
      });

      // Create container objects
      const containerList: Container[] = Array.from(containerMap.entries()).map(
        ([number, items]) => ({
          containerNumber: number,
          items,
          totalCBM: items.reduce((sum, item) => sum + (item.cbm || 0), 0),
          totalValue: items.reduce((sum, item) => sum + (item.costUSD || 0), 0),
          itemCount: items.length,
        })
      );

      setContainers(containerList.sort((a, b) => b.containerNumber.localeCompare(a.containerNumber)));
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('error', 'Error', 'Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Get items that are ready to be loaded (items with photos but not in a container)
  const availableItems = items.filter(
    (item) => !item.containerNumber && item.status === 'china_warehouse' && item.photos && item.photos.length > 0
  );

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedItems.size === availableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(availableItems.map((item) => item.id)));
    }
  };

  const handleLoadContainer = () => {
    if (selectedItems.size === 0) {
      showToast('warning', 'No Items Selected', 'Please select at least one item to load.');
      return;
    }

    if (!containerNumber.trim()) {
      showToast('warning', 'Missing Information', 'Please enter a container number.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Load Container',
      message: `Load ${selectedItems.size} item(s) into container ${containerNumber}?`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setIsAssigning(true);

        try {
          const updatePromises = Array.from(selectedItems).map((itemId) =>
            updateItem(itemId, {
              containerNumber: containerNumber.trim().toUpperCase(),
              status: 'in_transit',
            })
          );

          await Promise.all(updatePromises);

          showToast('success', 'Success', `Successfully loaded ${selectedItems.size} item(s) into container ${containerNumber}!`);

          setSelectedItems(new Set());
          setContainerNumber('');
          setShowNewContainerModal(false);
          await loadData();
        } catch (error) {
          console.error('Failed to load container:', error);
          showToast('error', 'Error', 'Failed to load items into container. Please try again.');
        } finally {
          setIsAssigning(false);
        }
      },
    });
  };

  const handleRemoveFromContainer = (itemId: string, _containerNum: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Item',
      message: 'Remove this item from the container?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await updateItem(itemId, {
            containerNumber: '',
            status: 'china_warehouse',
          });

          showToast('success', 'Success', 'Item removed from container!');
          await loadData();
        } catch (error) {
          console.error('Failed to remove item:', error);
          showToast('error', 'Error', 'Failed to remove item. Please try again.');
        }
      },
    });
  };

  const handleAddToExistingContainer = (containerNum: string) => {
    setTargetContainer(containerNum);
    setShowAddToContainerModal(true);
  };

  const handleAddItemsToContainer = () => {
    if (selectedItems.size === 0) {
      showToast('warning', 'No Items Selected', 'Please select at least one item to add.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Add to Container',
      message: `Add ${selectedItems.size} item(s) to container ${targetContainer}?`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setIsAssigning(true);

        try {
          const updatePromises = Array.from(selectedItems).map((itemId) =>
            updateItem(itemId, {
              containerNumber: targetContainer,
              status: 'in_transit',
            })
          );

          await Promise.all(updatePromises);

          showToast('success', 'Success', `Successfully added ${selectedItems.size} item(s) to container ${targetContainer}!`);

          setSelectedItems(new Set());
          setShowAddToContainerModal(false);
          setTargetContainer('');
          await loadData();
        } catch (error) {
          console.error('Failed to add items to container:', error);
          showToast('error', 'Error', 'Failed to add items to container. Please try again.');
        } finally {
          setIsAssigning(false);
        }
      },
    });
  };

  const toggleContainer = (containerNum: string) => {
    setExpandedContainer(expandedContainer === containerNum ? null : containerNum);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Container Management
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Admin</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Containers</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-light-info fs-6">
              {containers.length} containers
            </span>
            <span className="badge badge-light-warning fs-6">
              {availableItems.length} items available
            </span>
            {selectedItems.size > 0 && (
              <span className="badge badge-primary fs-6">
                {selectedItems.size} selected
              </span>
            )}
            <button
              className="btn btn-sm btn-light-primary"
              onClick={loadData}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Stats Cards */}
          <div className="row g-5 mb-5">
            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-primary">
                        <i className="bi bi-box-seam fs-2x text-primary"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-gray-400">Total Containers</div>
                      <div className="fs-2x fw-bold text-gray-800">{containers.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-success">
                        <i className="bi bi-boxes fs-2x text-success"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-gray-400">Items Loaded</div>
                      <div className="fs-2x fw-bold text-gray-800">
                        {containers.reduce((sum, c) => sum + c.itemCount, 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-warning">
                        <i className="bi bi-exclamation-triangle fs-2x text-white"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-warning">Available to Load</div>
                      <div className="fs-2x fw-bold text-warning">{availableItems.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-info">
                        <i className="bi bi-rulers fs-2x text-info"></i>
                      </div>
                    </div>
                    <div>
                      <div className="fs-6 text-gray-400">Total CBM</div>
                      <div className="fs-2x fw-bold text-gray-800">
                        {containers.reduce((sum, c) => sum + c.totalCBM, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Load New Container Section */}
          {availableItems.length > 0 && (
            <div className="card mb-5">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="bi bi-plus-circle me-2 text-primary"></i>
                  Load Items into Container
                </h3>
                <div className="card-toolbar">
                  {selectedItems.size > 0 && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowNewContainerModal(true)}
                    >
                      <i className="bi bi-truck me-2"></i>
                      Load {selectedItems.size} Item{selectedItems.size > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="mb-1">Available Items ({availableItems.length})</h5>
                    <p className="text-muted fs-7 mb-0">
                      Items uploaded by China team, ready to be assigned to containers
                    </p>
                  </div>
                  {availableItems.length > 0 && (
                    <button className="btn btn-sm btn-light" onClick={selectAll}>
                      {selectedItems.size === availableItems.length ? (
                        <>
                          <i className="bi bi-x-square me-1"></i>
                          Deselect All
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-square me-1"></i>
                          Select All
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-300 gy-4">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th className="w-25px">
                          <div className="form-check form-check-sm form-check-custom">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedItems.size === availableItems.length && availableItems.length > 0}
                              onChange={selectAll}
                            />
                          </div>
                        </th>
                        <th>Photo</th>
                        <th>Tracking #</th>
                        <th>Carton #</th>
                        <th>CBM</th>
                        <th>Cost</th>
                        <th>Receiving Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          style={{ cursor: 'pointer' }}
                          className="hover-bg-light-primary"
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="form-check form-check-sm form-check-custom">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItemSelection(item.id)}
                              />
                            </div>
                          </td>
                          <td>
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={getFirstPhotoUrl(item.photos) || ''}
                                alt="Item"
                                className="rounded"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded d-flex align-items-center justify-content-center"
                                style={{ width: '50px', height: '50px' }}
                              >
                                <i className="bi bi-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="fw-bold">{item.trackingNumber}</span>
                            {item.name && <div className="text-muted fs-7">{item.name}</div>}
                          </td>
                          <td>
                            <span className="badge badge-light">{item.cartonNumber}</span>
                          </td>
                          <td>
                            {item.cbm ? (
                              <span className="badge badge-light">{item.cbm.toFixed(6)} m³</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div>${item.costUSD?.toFixed(2) || '0.00'}</div>
                            <div className="text-muted fs-7">
                              ₵{item.costCedis?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="text-muted">
                            {new Date(item.receivingDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Existing Containers */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-archive me-2 text-info"></i>
                Loaded Containers ({containers.length})
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-10">
                  <span className="spinner-border spinner-border-lg me-2"></span>
                  <div className="mt-3 text-muted">Loading containers...</div>
                </div>
              ) : containers.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  No containers loaded yet. Select items above to create your first container.
                </div>
              ) : (
                <div className="accordion" id="containersAccordion">
                  {containers.map((container) => (
                    <div key={container.containerNumber} className="accordion-item mb-3">
                      <div
                        className="accordion-header cursor-pointer"
                        onClick={() => toggleContainer(container.containerNumber)}
                      >
                        <div className="accordion-button collapsed p-5" style={{ cursor: 'pointer' }}>
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="d-flex align-items-center">
                              <i className={`bi ${expandedContainer === container.containerNumber ? 'bi-box-seam-fill' : 'bi-box-seam'} fs-2 text-primary me-4`}></i>
                              <div>
                                <h4 className="mb-1">{container.containerNumber}</h4>
                                <div className="d-flex gap-3 text-muted fs-7">
                                  <span>
                                    <i className="bi bi-boxes me-1"></i>
                                    {container.itemCount} items
                                  </span>
                                  <span>
                                    <i className="bi bi-rulers me-1"></i>
                                    {container.totalCBM.toFixed(2)} m³
                                  </span>
                                  <span>
                                    <i className="bi bi-currency-dollar me-1"></i>
                                    ${container.totalValue.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <i className={`bi ${expandedContainer === container.containerNumber ? 'bi-chevron-up' : 'bi-chevron-down'} fs-3`}></i>
                          </div>
                        </div>
                      </div>

                      {expandedContainer === container.containerNumber && (
                        <div className="accordion-collapse show">
                          <div className="accordion-body p-5">
                            {availableItems.length > 0 && (
                              <div className="mb-4 d-flex justify-content-between align-items-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light-primary"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAddToExistingContainer(container.containerNumber);
                                  }}
                                  disabled={selectedItems.size === 0}
                                >
                                  <i className="bi bi-plus-circle me-2"></i>
                                  Add {selectedItems.size > 0 ? `${selectedItems.size} ` : ''}Items to This Container
                                </button>
                                {selectedItems.size === 0 && (
                                  <span className="text-muted fs-7">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Select items from "Available Items" section above
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="table-responsive">
                              <table className="table table-row-bordered table-row-gray-300 gy-4">
                                <thead>
                                  <tr className="fw-bold text-muted bg-light">
                                    <th>Photo</th>
                                    <th>Tracking #</th>
                                    <th>Carton #</th>
                                    <th>CBM</th>
                                    <th>Cost</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {container.items.map((item) => (
                                    <tr
                                      key={item.id}
                                      onClick={() => handleItemClick(item)}
                                      style={{ cursor: 'pointer' }}
                                      className="hover-bg-light-primary"
                                    >
                                      <td>
                                        {item.photos && item.photos.length > 0 ? (
                                          <img
                                            src={
                                              typeof item.photos[0] === 'string'
                                                ? item.photos[0]
                                                : (item.photos[0] as any)?.url
                                            }
                                            alt="Item"
                                            className="rounded"
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                          />
                                        ) : (
                                          <div
                                            className="bg-light rounded d-flex align-items-center justify-content-center"
                                            style={{ width: '50px', height: '50px' }}
                                          >
                                            <i className="bi bi-image text-muted"></i>
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        <span className="fw-bold">{item.trackingNumber}</span>
                                        {item.name && <div className="text-muted fs-7">{item.name}</div>}
                                      </td>
                                      <td>
                                        <span className="badge badge-light">{item.cartonNumber}</span>
                                      </td>
                                      <td>
                                        {item.cbm ? (
                                          <span className="badge badge-light">{item.cbm.toFixed(6)} m³</span>
                                        ) : (
                                          <span className="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        <div>${item.costUSD?.toFixed(2) || '0.00'}</div>
                                        <div className="text-muted fs-7">
                                          ₵{item.costCedis?.toFixed(2) || '0.00'}
                                        </div>
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          item.status === 'in_transit' ? 'badge-light-info' :
                                          item.status === 'arrived_ghana' ? 'badge-light-primary' :
                                          item.status === 'ready_for_pickup' ? 'badge-light-success' :
                                          'badge-light-dark'
                                        }`}>
                                          {item.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                      </td>
                                      <td onClick={(e) => e.stopPropagation()}>
                                        {item.status === 'in_transit' && (
                                          <button
                                            className="btn btn-sm btn-light-danger"
                                            onClick={() => handleRemoveFromContainer(item.id, container.containerNumber)}
                                          >
                                            <i className="bi bi-x-circle me-1"></i>
                                            Remove
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Item Details Modal */}
          <ItemDetailsModal
            item={selectedItem}
            isOpen={showItemModal}
            onClose={() => setShowItemModal(false)}
          />
        </div>
      </div>

      {/* New Container Modal */}
      {showNewContainerModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Load Items into Container</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNewContainerModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <label className="form-label required">Container Number</label>
                  <select
                    className="form-control form-control-lg"
                    value={containerNumber}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setInputModal({
                          isOpen: true,
                          title: 'Create New Container',
                          message: 'Enter new container number (e.g., CONT-2024-001):',
                          onSubmit: (value) => {
                            setContainerNumber(value.toUpperCase());
                            setInputModal({ ...inputModal, isOpen: false });
                          },
                        });
                      } else {
                        setContainerNumber(e.target.value);
                      }
                    }}
                    autoFocus
                  >
                    <option value="">-- Select Container or Create New --</option>
                    {containers.map((container) => (
                      <option key={container.containerNumber} value={container.containerNumber}>
                        {container.containerNumber} ({container.itemCount} items)
                      </option>
                    ))}
                    <option value="__new__" className="fw-bold text-primary">
                      + Create New Container
                    </option>
                  </select>
                  <div className="form-text">
                    Select existing container or create a new one
                  </div>
                </div>

                <div className="alert alert-light-primary">
                  <div className="fw-bold mb-2">Loading Summary:</div>
                  <div>
                    <i className="bi bi-boxes me-2"></i>
                    {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                  </div>
                  <div>
                    <i className="bi bi-rulers me-2"></i>
                    {availableItems
                      .filter((item) => selectedItems.has(item.id))
                      .reduce((sum, item) => sum + (item.cbm || 0), 0)
                      .toFixed(6)}{' '}
                    m³ total CBM
                  </div>
                  <div>
                    <i className="bi bi-currency-dollar me-2"></i>$
                    {availableItems
                      .filter((item) => selectedItems.has(item.id))
                      .reduce((sum, item) => sum + (item.costUSD || 0), 0)
                      .toFixed(2)}{' '}
                    / ₵
                    {availableItems
                      .filter((item) => selectedItems.has(item.id))
                      .reduce((sum, item) => sum + (item.costCedis || 0), 0)
                      .toFixed(2)}{' '}
                    total value
                  </div>
                </div>

                <div className="alert alert-warning">
                  <i className="bi bi-info-circle me-2"></i>
                  Items will automatically be marked as "In Transit" when loaded.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowNewContainerModal(false)}
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleLoadContainer}
                  disabled={isAssigning || !containerNumber.trim()}
                >
                  {isAssigning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-truck me-2"></i>
                      Load Container
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Existing Container Modal */}
      {showAddToContainerModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Add Items to Container {targetContainer}</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddToContainerModal(false);
                    setTargetContainer('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-light-primary">
                  <div className="fw-bold mb-2">Adding Summary:</div>
                  <div>
                    <i className="bi bi-boxes me-2"></i>
                    {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                  </div>
                  <div>
                    <i className="bi bi-rulers me-2"></i>
                    {availableItems
                      .filter((item) => selectedItems.has(item.id))
                      .reduce((sum, item) => sum + (item.cbm || 0), 0)
                      .toFixed(6)}{' '}
                    m³ total CBM
                  </div>
                  <div>
                    <i className="bi bi-currency-dollar me-2"></i>$
                    {availableItems
                      .filter((item) => selectedItems.has(item.id))
                      .reduce((sum, item) => sum + (item.costUSD || 0), 0)
                      .toFixed(2)}{' '}
                    / ₵
                    {availableItems
                      .filter((item) => selectedItems.has(item.id))
                      .reduce((sum, item) => sum + (item.costCedis || 0), 0)
                      .toFixed(2)}{' '}
                    total value
                  </div>
                </div>

                <div className="alert alert-warning">
                  <i className="bi bi-info-circle me-2"></i>
                  These items will be added to container <strong>{targetContainer}</strong> and marked as "In Transit".
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowAddToContainerModal(false);
                    setTargetContainer('');
                  }}
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddItemsToContainer}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Add to Container
                    </>
                  )}
                </button>
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
      />

      {/* Input Modal */}
      <InputModal
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal({ ...inputModal, isOpen: false })}
        onSubmit={inputModal.onSubmit}
        title={inputModal.title}
        message={inputModal.message}
        placeholder="e.g., CONT-2024-001"
      />
    </div>
  );
}
