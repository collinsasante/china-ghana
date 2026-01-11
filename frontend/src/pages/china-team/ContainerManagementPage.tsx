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

  // Log state changes
  console.log('[ContainerManagement] State:', {
    containerNumber,
    showNewContainerModal,
    inputModalOpen: inputModal.isOpen,
    containersCount: containers.length,
    selectedItemsCount: selectedItems.size
  });

  useEffect(() => {
    loadData();
  }, []);

  // Track containerNumber changes
  useEffect(() => {
    console.log('[ContainerManagement] containerNumber changed to:', containerNumber);
  }, [containerNumber]);

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
    <>
      {/* Toolbar */}
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          {/* Page title */}
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Container Management
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/china" className="text-muted text-hover-primary">China Team</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Container Management</li>
            </ul>
          </div>
          {/* end Page title */}

          {/* Actions */}
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
              <i className="ki-duotone ki-arrows-circle fs-2">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              Refresh
            </button>
          </div>
          {/* end Actions */}
        </div>
      </div>
      {/* end Toolbar */}

      {/* Content */}
      <div id="kt_app_content" className="app-content flex-column-fluid">

        {/* Content container */}
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Stats Cards */}
          <div className="row g-5 g-xl-10 mb-5 mb-xl-10">
            {/* Total Containers Card */}
            <div className="col-md-3">
              <div
                className="card card-flush h-100 cursor-pointer hover-shadow"
                onClick={() => document.getElementById('loaded-containers')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-primary">
                        <i className="ki-duotone ki-package fs-2x text-primary">
                          <span className="path1"></span>
                          <span className="path2"></span>
                          <span className="path3"></span>
                        </i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fs-6 text-gray-400">Total Containers</div>
                      <div className="fs-2x fw-bold text-gray-800">{containers.length}</div>
                      <div className="text-primary fs-8 fw-bold mt-1">
                        <i className="ki-duotone ki-arrow-down fs-3">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                        View All
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end Total Containers Card */}

            {/* Items Loaded Card */}
            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-success">
                        <i className="ki-duotone ki-cube-3 fs-2x text-success">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
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
            {/* end Items Loaded Card */}

            {/* Available to Load Card */}
            <div className="col-md-3">
              <div className="card card-flush h-100 bg-light-warning">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-warning">
                        <i className="ki-duotone ki-information fs-2x text-white">
                          <span className="path1"></span>
                          <span className="path2"></span>
                          <span className="path3"></span>
                        </i>
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
            {/* end Available to Load Card */}

            {/* Total CBM Card */}
            <div className="col-md-3">
              <div className="card card-flush h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                      <div className="symbol-label bg-light-info">
                        <i className="ki-duotone ki-chart-line-up fs-2x text-info">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
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
            {/* end Total CBM Card */}
          </div>
          {/* end Stats Cards */}

          {/* Load New Container Section */}
          {availableItems.length > 0 && (
            <div className="card card-flush mb-5 mb-xl-10">
              {/* Card header */}
              <div className="card-header align-items-center py-5 gap-2 gap-md-5">
                {/* Card title */}
                <div className="card-title">
                  <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-800">Load Items into Container</span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Select items to assign to a container</span>
                  </h3>
                </div>
                {/* end Card title */}

                {/* Card toolbar */}
                <div className="card-toolbar">
                  {selectedItems.size > 0 && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        console.log('[ContainerManagement] Load Container button clicked');
                        setShowNewContainerModal(true);
                      }}
                    >
                      <i className="ki-duotone ki-rocket fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                      Load {selectedItems.size} Item{selectedItems.size > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
                {/* end Card toolbar */}
              </div>
              {/* end Card header */}

              {/* Card body */}
              <div className="card-body pt-0">
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
                          <i className="ki-duotone ki-cross-square fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                          </i>
                          Deselect All
                        </>
                      ) : (
                        <>
                          <i className="ki-duotone ki-check-square fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          Select All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                      <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                        <th className="w-10px pe-2">
                          <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedItems.size === availableItems.length && availableItems.length > 0}
                              onChange={selectAll}
                            />
                          </div>
                        </th>
                        <th className="min-w-50px">Photo</th>
                        <th className="min-w-125px">Tracking #</th>
                        <th className="min-w-100px">Carton #</th>
                        <th className="text-end min-w-100px">CBM</th>
                        <th className="text-end min-w-100px">Cost</th>
                        <th className="text-end min-w-100px">Receiving Date</th>
                      </tr>
                    </thead>
                    <tbody className="fw-semibold text-gray-600">
                      {availableItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          style={{ cursor: 'pointer' }}
                          className="hover-bg-light-primary"
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="form-check form-check-sm form-check-custom form-check-solid">
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
                              <div
                                className="symbol symbol-50px"
                                style={{
                                  backgroundImage: `url(${getFirstPhotoUrl(item.photos)})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }}
                              />
                            ) : (
                              <div className="symbol symbol-50px">
                                <div className="symbol-label bg-light">
                                  <i className="ki-duotone ki-picture fs-2x text-gray-400">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                  </i>
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="text-gray-800 fw-bold">{item.trackingNumber}</span>
                            {item.name && <div className="text-gray-500 fw-semibold fs-7">{item.name}</div>}
                          </td>
                          <td>
                            <span className="badge badge-light-primary">{item.cartonNumber}</span>
                          </td>
                          <td className="text-end">
                            {item.cbm ? (
                              <span className="text-gray-800 fw-bold">{item.cbm.toFixed(6)} m³</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="text-gray-800 fw-bold">${item.costUSD?.toFixed(2) || '0.00'}</div>
                            <div className="text-gray-500 fw-semibold fs-7">
                              ₵{item.costCedis?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="text-end text-gray-600 fw-semibold">
                            {new Date(item.receivingDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* end Table */}
                </div>
              </div>
              {/* end Card body */}
            </div>
          )}
          {/* end Load New Container Section */}

          {/* Loaded Containers */}
          <div className="card card-flush" id="loaded-containers">
            {/* Card header */}
            <div className="card-header align-items-center py-5 gap-2 gap-md-5">
              {/* Card title */}
              <div className="card-title">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">Loaded Containers</span>
                  <span className="text-gray-500 mt-1 fw-semibold fs-6">{containers.length} container{containers.length !== 1 ? 's' : ''} in transit</span>
                </h3>
              </div>
              {/* end Card title */}
            </div>
            {/* end Card header */}

            {/* Card body */}
            <div className="card-body pt-0">
              {loading ? (
                <div className="text-center py-20">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-gray-600 mt-5">Loading containers...</p>
                </div>
              ) : containers.length === 0 ? (
                <div className="text-center py-20">
                  <i className="ki-duotone ki-package fs-5x text-gray-400 mb-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  <p className="text-gray-600 fs-5">No containers loaded yet</p>
                  <p className="text-gray-500">Select items above to create your first container.</p>
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
                              <i className={`ki-duotone ki-package fs-2x text-primary me-4`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                              </i>
                              <div>
                                <h4 className="mb-1 fw-bold">{container.containerNumber}</h4>
                                <div className="d-flex gap-3 text-muted fs-7 fw-semibold">
                                  <span>
                                    <i className="ki-duotone ki-cube-3 fs-3 me-1">
                                      <span className="path1"></span>
                                      <span className="path2"></span>
                                    </i>
                                    {container.itemCount} items
                                  </span>
                                  <span>
                                    <i className="ki-duotone ki-chart-line-up fs-3 me-1">
                                      <span className="path1"></span>
                                      <span className="path2"></span>
                                    </i>
                                    {container.totalCBM.toFixed(2)} m³
                                  </span>
                                  <span>
                                    <i className="ki-duotone ki-dollar fs-3 me-1">
                                      <span className="path1"></span>
                                      <span className="path2"></span>
                                      <span className="path3"></span>
                                    </i>
                                    ${container.totalValue.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <i className={`ki-duotone ki-${expandedContainer === container.containerNumber ? 'up' : 'down'} fs-1`}>
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
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
                                  <i className="ki-duotone ki-plus fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                  </i>
                                  Add {selectedItems.size > 0 ? `${selectedItems.size} ` : ''}Items to This Container
                                </button>
                                {selectedItems.size === 0 && (
                                  <span className="text-muted fs-7 fw-semibold">
                                    <i className="ki-duotone ki-information-5 fs-2 me-1">
                                      <span className="path1"></span>
                                      <span className="path2"></span>
                                      <span className="path3"></span>
                                    </i>
                                    Select items from "Available Items" section above
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Table */}
                            <div className="table-responsive">
                              <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                  <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                    <th className="min-w-50px">Photo</th>
                                    <th className="min-w-125px">Tracking #</th>
                                    <th className="min-w-100px">Carton #</th>
                                    <th className="text-end min-w-100px">CBM</th>
                                    <th className="text-end min-w-100px">Cost</th>
                                    <th className="text-end min-w-100px">Status</th>
                                    <th className="text-end min-w-70px">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="fw-semibold text-gray-600">
                                  {container.items.map((item) => (
                                    <tr
                                      key={item.id}
                                      onClick={() => handleItemClick(item)}
                                      style={{ cursor: 'pointer' }}
                                      className="hover-bg-light-primary"
                                    >
                                      <td>
                                        {item.photos && item.photos.length > 0 ? (
                                          <div
                                            className="symbol symbol-50px"
                                            style={{
                                              backgroundImage: `url(${
                                                typeof item.photos[0] === 'string'
                                                  ? item.photos[0]
                                                  : (item.photos[0] as any)?.url
                                              })`,
                                              backgroundSize: 'cover',
                                              backgroundPosition: 'center',
                                            }}
                                          />
                                        ) : (
                                          <div className="symbol symbol-50px">
                                            <div className="symbol-label bg-light">
                                              <i className="ki-duotone ki-picture fs-2x text-gray-400">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                              </i>
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        <span className="text-gray-800 fw-bold">{item.trackingNumber}</span>
                                        {item.name && <div className="text-gray-500 fw-semibold fs-7">{item.name}</div>}
                                      </td>
                                      <td>
                                        <span className="badge badge-light-primary">{item.cartonNumber}</span>
                                      </td>
                                      <td className="text-end">
                                        {item.cbm ? (
                                          <span className="text-gray-800 fw-bold">{item.cbm.toFixed(6)} m³</span>
                                        ) : (
                                          <span className="text-gray-500">-</span>
                                        )}
                                      </td>
                                      <td className="text-end">
                                        <div className="text-gray-800 fw-bold">${item.costUSD?.toFixed(2) || '0.00'}</div>
                                        <div className="text-gray-500 fw-semibold fs-7">
                                          ₵{item.costCedis?.toFixed(2) || '0.00'}
                                        </div>
                                      </td>
                                      <td className="text-end">
                                        <span className={`badge ${
                                          item.status === 'in_transit' ? 'badge-light-info' :
                                          item.status === 'arrived_ghana' ? 'badge-light-primary' :
                                          item.status === 'ready_for_pickup' ? 'badge-light-success' :
                                          'badge-light-dark'
                                        }`}>
                                          {item.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                        {item.status === 'in_transit' && (
                                          <button
                                            className="btn btn-sm btn-icon btn-light-danger"
                                            onClick={() => handleRemoveFromContainer(item.id, container.containerNumber)}
                                          >
                                            <i className="ki-duotone ki-cross fs-2">
                                              <span className="path1"></span>
                                              <span className="path2"></span>
                                            </i>
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {/* end Table */}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* end Card body */}
          </div>
          {/* end Loaded Containers */}
        </div>
        {/* end Content container */}
      </div>
      {/* end Content */}

      {/* Item Details Modal */}
      <ItemDetailsModal
        item={selectedItem}
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
      />

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
                      console.log('[ContainerManagement] Dropdown changed:', e.target.value);
                      if (e.target.value === '__new__') {
                        console.log('[ContainerManagement] Opening InputModal for new container');
                        setInputModal({
                          isOpen: true,
                          title: 'Create New Container',
                          message: 'Enter new container number (e.g., CONT-2024-001):',
                          onSubmit: (value) => {
                            console.log('[ContainerManagement] InputModal submitted:', value);
                            setContainerNumber(value.toUpperCase());
                            setInputModal({ ...inputModal, isOpen: false });
                          },
                        });
                      } else {
                        console.log('[ContainerManagement] Selected existing container:', e.target.value);
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
    </>
  );
}
