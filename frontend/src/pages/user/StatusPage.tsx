import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getItemsByCustomerId } from '../../services/airtable';
import { getFirstPhotoUrl } from '../../utils/photos';
import ItemDetailsModal from '../../components/common/ItemDetailsModal';
import type { Item, ShipmentStatus } from '../../types/index';

export default function StatusPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | ShipmentStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

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
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.name?.toLowerCase().includes(query) ||
        item.trackingNumber?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

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

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setShowItemModal(true);
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
    <>
      {/* Toolbar */}
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

      {/* Content */}
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

          {/* Shipments Table */}
          <div className="card card-flush">
            {/* Card Header */}
            <div className="card-header align-items-center py-5 gap-2 gap-md-5">
              {/* Card Title - Search */}
              <div className="card-title">
                <div className="d-flex align-items-center position-relative my-1">
                  <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-4">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <input
                    type="text"
                    className="form-control form-control-solid w-250px ps-12"
                    placeholder="Search Shipments"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {/* end Card Title */}

              {/* Card Toolbar */}
              <div className="card-toolbar flex-row-fluid justify-content-end gap-5">
                {/* Date Range Picker */}
                <div className="input-group w-250px">
                  <input
                    type="date"
                    className="form-control form-control-solid"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    className="form-control form-control-solid"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <button
                    className="btn btn-icon btn-light"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                  >
                    <i className="ki-duotone ki-cross fs-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                    </i>
                  </button>
                </div>
                {/* end Date Range Picker */}

                {/* Status Filter */}
                <div className="w-100 mw-150px">
                  <select
                    className="form-select form-select-solid"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                  >
                    <option value="all">All Status</option>
                    {statusSteps.map((step) => (
                      <option key={step.key} value={step.key}>
                        {step.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* end Status Filter */}

                {/* Refresh Button */}
                <button className="btn btn-light btn-sm" onClick={loadItems}>
                  <i className="ki-duotone ki-arrows-circle fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  Refresh
                </button>
                {/* end Refresh Button */}
              </div>
              {/* end Card Toolbar */}
            </div>
            {/* end Card Header */}

            {/* Card Body */}
            <div className="card-body pt-0">
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
                  {/* Table */}
                  <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                      <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                        <th className="text-start w-10px pe-2">
                          <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </th>
                        <th className="min-w-150px">Item</th>
                        <th className="min-w-140px">Tracking Number</th>
                        <th className="min-w-120px">Receiving Date</th>
                        <th className="text-end min-w-100px">Cost</th>
                        <th className="text-end min-w-100px">Status</th>
                        <th className="text-end min-w-100px">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="fw-semibold text-gray-600">
                      {filteredItems.map((item) => {
                        return (
                          <tr key={item.id}>
                            {/* Checkbox */}
                            <td className="text-start">
                              <div className="form-check form-check-sm form-check-custom form-check-solid">
                                <input className="form-check-input" type="checkbox" />
                              </div>
                            </td>

                            {/* Item with Photo */}
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

                            {/* Tracking Number */}
                            <td>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleItemClick(item);
                                }}
                                className="text-gray-800 text-hover-primary fw-bold"
                              >
                                {item.trackingNumber}
                              </a>
                            </td>

                            {/* Receiving Date */}
                            <td>
                              <span className="text-gray-600 fw-semibold">
                                {new Date(item.receivingDate).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Cost */}
                            <td className="text-end">
                              <span className="text-gray-900 fw-bold d-block">
                                ${item.costUSD.toFixed(2)}
                              </span>
                              <span className="text-gray-500 fw-semibold d-block fs-7">
                                ₵{item.costCedis.toFixed(2)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="text-end">
                              <span className={`badge badge-light-${getStatusColor(item.status)}`}>
                                {statusSteps.find((s) => s.key === item.status)?.label}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-icon btn-light btn-active-light-primary"
                                onClick={() => handleItemClick(item)}
                              >
                                <i className="ki-duotone ki-eye fs-2">
                                  <span className="path1"></span>
                                  <span className="path2"></span>
                                  <span className="path3"></span>
                                </i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* end Table */}
                </div>
              )}
            </div>
            {/* end Card Body */}
          </div>
          {/* end Shipments Table */}
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
    </>
  );
}
