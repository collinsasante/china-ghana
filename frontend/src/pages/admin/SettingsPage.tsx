import { useState, useEffect } from 'react';
import type { Warehouse, SystemSettings } from '../../types/index';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  getSystemSettings,
  updateSystemSettings,
  getAllWarehouses,
  createWarehouse as createWarehouseInAirtable,
  updateWarehouse as updateWarehouseInAirtable,
  deleteWarehouse as deleteWarehouseFromAirtable
} from '../../services/airtable';

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    id: 'default',
    usdToGhsRate: 15.0,
    usdToCnyRate: 7.2,
    seaShippingRatePerCBM: 1000,
    airShippingRatePerKg: 5,
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success'|'error'|'warning'|'info', title: string, message: string} | null>(null);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    country: '',
    city: '',
    address: '',
    isOrigin: false,
    isDestination: false,
  });

  const showNotification = (type: 'success'|'error'|'warning'|'info', title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings from Airtable
      const settingsData = await getSystemSettings();
      if (settingsData) {
        setSettings(settingsData);
      }

      // Load warehouses from Airtable
      const warehousesData = await getAllWarehouses();
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showNotification('error', 'Error', 'Failed to load settings from Airtable');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (field: keyof SystemSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const updatedSettings = await updateSystemSettings({
        usdToGhsRate: settings.usdToGhsRate,
        usdToCnyRate: settings.usdToCnyRate,
        seaShippingRatePerCBM: settings.seaShippingRatePerCBM,
        airShippingRatePerKg: settings.airShippingRatePerKg,
      });

      setSettings(updatedSettings);
      showNotification('success', 'Settings Saved!', 'System settings have been updated in Airtable');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('error', 'Save Failed', 'Failed to save settings to Airtable');
    }
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouse.name.trim()) {
      showNotification('warning', 'Missing Information', 'Please enter warehouse name');
      return;
    }
    if (!newWarehouse.country.trim()) {
      showNotification('warning', 'Missing Information', 'Please enter country');
      return;
    }
    if (!newWarehouse.city.trim()) {
      showNotification('warning', 'Missing Information', 'Please enter city');
      return;
    }
    if (!newWarehouse.isOrigin && !newWarehouse.isDestination) {
      showNotification('warning', 'Missing Information', 'Please select at least one: Origin or Destination');
      return;
    }

    try {
      const warehouse = await createWarehouseInAirtable({
        ...newWarehouse,
        isActive: true,
      });

      setWarehouses(prev => [...prev, warehouse]);
      setNewWarehouse({
        name: '',
        country: '',
        city: '',
        address: '',
        isOrigin: false,
        isDestination: false,
      });
      setShowAddWarehouseModal(false);
      showNotification('success', 'Warehouse Added!', `${warehouse.name} has been added to Airtable`);
    } catch (error) {
      console.error('Failed to add warehouse:', error);
      showNotification('error', 'Failed', 'Could not add warehouse to Airtable');
    }
  };

  const handleToggleWarehouse = async (id: string) => {
    const warehouse = warehouses.find(wh => wh.id === id);
    if (!warehouse) return;

    try {
      const updatedWarehouse = await updateWarehouseInAirtable(id, {
        isActive: !warehouse.isActive,
      });

      setWarehouses(prev => prev.map(wh => wh.id === id ? updatedWarehouse : wh));
      showNotification('info', 'Warehouse Updated', 'Warehouse status has been updated in Airtable');
    } catch (error) {
      console.error('Failed to toggle warehouse:', error);
      showNotification('error', 'Update Failed', 'Could not update warehouse status');
    }
  };

  const handleDeleteWarehouse = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Warehouse',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteWarehouseFromAirtable(id);
          setWarehouses(prev => prev.filter(wh => wh.id !== id));
          showNotification('success', 'Warehouse Deleted', `${name} has been removed from Airtable`);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
          console.error('Failed to delete warehouse:', error);
          showNotification('error', 'Delete Failed', 'Could not delete warehouse from Airtable');
          setConfirmModal({ ...confirmModal, isOpen: false });
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
              System Settings
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Admin</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Settings</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">

          {loading ? (
            <div className="text-center py-20">
              <span className="spinner-border spinner-border-lg me-2"></span>
              <div className="mt-3 text-muted">Loading settings...</div>
            </div>
          ) : (
            <>
              {/* Exchange Rates & Shipping Rates */}
              <div className="card mb-5">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-currency-exchange me-2 text-primary"></i>
                    Exchange Rates & Shipping Costs
                  </h3>
                </div>
                <div className="card-body">
                  <div className="alert alert-light-info mb-5">
                    <i className="bi bi-info-circle me-2"></i>
                    These rates are used to automatically calculate shipping costs and convert currencies. Update them as market rates change.
                  </div>

                  <div className="row g-5">
                    {/* Exchange Rates */}
                    <div className="col-md-6">
                      <h4 className="mb-4">Exchange Rates</h4>

                      <div className="mb-4">
                        <label className="form-label required">USD to Ghana Cedis (GHS)</label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text">1 USD =</span>
                          <input
                            type="number"
                            className="form-control"
                            value={settings.usdToGhsRate}
                            onChange={(e) => handleSettingsChange('usdToGhsRate', parseFloat(e.target.value))}
                            step="0.01"
                            min="0"
                          />
                          <span className="input-group-text">GHS</span>
                        </div>
                        <div className="form-text">Current exchange rate from USD to Ghana Cedis</div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label required">USD to Chinese Yuan (CNY)</label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text">1 USD =</span>
                          <input
                            type="number"
                            className="form-control"
                            value={settings.usdToCnyRate}
                            onChange={(e) => handleSettingsChange('usdToCnyRate', parseFloat(e.target.value))}
                            step="0.01"
                            min="0"
                          />
                          <span className="input-group-text">CNY</span>
                        </div>
                        <div className="form-text">Current exchange rate from USD to Chinese Yuan</div>
                      </div>
                    </div>

                    {/* Shipping Rates */}
                    <div className="col-md-6">
                      <h4 className="mb-4">Shipping Rates</h4>

                      <div className="mb-4">
                        <label className="form-label required">Sea Shipping Rate (per CBM)</label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={settings.seaShippingRatePerCBM}
                            onChange={(e) => handleSettingsChange('seaShippingRatePerCBM', parseFloat(e.target.value))}
                            step="1"
                            min="0"
                          />
                          <span className="input-group-text">per m³</span>
                        </div>
                        <div className="form-text">Cost per cubic meter for sea freight</div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label required">Air Shipping Rate (per kg)</label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={settings.airShippingRatePerKg}
                            onChange={(e) => handleSettingsChange('airShippingRatePerKg', parseFloat(e.target.value))}
                            step="0.1"
                            min="0"
                          />
                          <span className="input-group-text">per kg</span>
                        </div>
                        <div className="form-text">Cost per kilogram for air freight</div>
                      </div>
                    </div>
                  </div>

                  <div className="separator my-5"></div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">
                      <i className="bi bi-clock me-2"></i>
                      Last updated: {new Date(settings.updatedAt).toLocaleString()}
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveSettings}>
                      <i className="bi bi-check-circle me-2"></i>
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Warehouses */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="bi bi-geo-alt me-2 text-success"></i>
                    Warehouse Locations
                  </h3>
                  <div className="card-toolbar">
                    <button className="btn btn-sm btn-light-primary" onClick={() => setShowAddWarehouseModal(true)}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Add Warehouse
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="alert alert-light-info mb-5">
                    <i className="bi bi-info-circle me-2"></i>
                    Configure warehouse locations for origin (shipping from) and destination (receiving at) points. These appear in dropdown menus throughout the system.
                  </div>

                  {warehouses.length === 0 ? (
                    <div className="text-center py-10">
                      <i className="bi bi-inbox fs-3x text-muted"></i>
                      <div className="mt-3 text-muted">No warehouses configured yet</div>
                      <button className="btn btn-sm btn-primary mt-3" onClick={() => setShowAddWarehouseModal(true)}>
                        Add Your First Warehouse
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-row-bordered align-middle">
                        <thead>
                          <tr className="fw-bold text-muted">
                            <th>Warehouse Name</th>
                            <th>Location</th>
                            <th className="text-center">Type</th>
                            <th className="text-center">Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warehouses.map((warehouse) => (
                            <tr key={warehouse.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className={`bi bi-building fs-2 me-3 ${warehouse.isActive ? 'text-success' : 'text-muted'}`}></i>
                                  <div>
                                    <div className="fw-bold">{warehouse.name}</div>
                                    {warehouse.address && (
                                      <div className="text-muted fs-7">{warehouse.address}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-bold">{warehouse.city}</div>
                                <div className="text-muted fs-7">{warehouse.country}</div>
                              </td>
                              <td className="text-center">
                                <div className="d-flex flex-column gap-1">
                                  {warehouse.isOrigin && (
                                    <span className="badge badge-light-primary badge-sm">
                                      <i className="bi bi-arrow-up-right me-1"></i>
                                      Origin
                                    </span>
                                  )}
                                  {warehouse.isDestination && (
                                    <span className="badge badge-light-success badge-sm">
                                      <i className="bi bi-arrow-down-left me-1"></i>
                                      Destination
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                {warehouse.isActive ? (
                                  <span className="badge badge-light-success">Active</span>
                                ) : (
                                  <span className="badge badge-light-danger">Inactive</span>
                                )}
                              </td>
                              <td className="text-end">
                                <button
                                  className={`btn btn-sm ${warehouse.isActive ? 'btn-light-warning' : 'btn-light-success'} me-2`}
                                  onClick={() => handleToggleWarehouse(warehouse.id)}
                                >
                                  <i className={`bi ${warehouse.isActive ? 'bi-pause-circle' : 'bi-play-circle'} me-1`}></i>
                                  {warehouse.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  className="btn btn-sm btn-light-danger"
                                  onClick={() => handleDeleteWarehouse(warehouse.id, warehouse.name)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Warehouse Modal */}
      {showAddWarehouseModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h3 className="modal-title text-white">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Warehouse
                </h3>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddWarehouseModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <label className="form-label required">Warehouse Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="e.g., Guangzhou Main Warehouse"
                    value={newWarehouse.name}
                    onChange={(e) => setNewWarehouse(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label required">Country</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="e.g., China"
                    value={newWarehouse.country}
                    onChange={(e) => setNewWarehouse(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label required">City</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="e.g., Guangzhou"
                    value={newWarehouse.city}
                    onChange={(e) => setNewWarehouse(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Address (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Full address..."
                    value={newWarehouse.address}
                    onChange={(e) => setNewWarehouse(prev => ({ ...prev, address: e.target.value }))}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="form-label required">Warehouse Type</label>
                  <div className="form-check form-check-custom form-check-solid mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newWarehouse.isOrigin}
                      onChange={(e) => setNewWarehouse(prev => ({ ...prev, isOrigin: e.target.checked }))}
                    />
                    <label className="form-check-label">
                      <strong>Origin Warehouse</strong>
                      <div className="text-muted fs-7">Items are shipped FROM this location</div>
                    </label>
                  </div>
                  <div className="form-check form-check-custom form-check-solid">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newWarehouse.isDestination}
                      onChange={(e) => setNewWarehouse(prev => ({ ...prev, isDestination: e.target.checked }))}
                    />
                    <label className="form-check-label">
                      <strong>Destination Warehouse</strong>
                      <div className="text-muted fs-7">Items are received AT this location</div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowAddWarehouseModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddWarehouse}>
                  <i className="bi bi-check-circle me-2"></i>
                  Add Warehouse
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
        confirmButtonClass="btn-danger"
      />

      {/* Notification Toast */}
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
