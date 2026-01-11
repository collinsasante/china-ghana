import { useState, useEffect } from 'react';
import { getAllContainers, getItemsByContainerNumber } from '../../services/airtable';
import type { Container, Item } from '../../types/index';

export default function SortingPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [containerItemsMap, setContainerItemsMap] = useState<Map<string, Item[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('arrived_ghana'); // Default to arrived containers
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      setLoading(true);
      const containersData = await getAllContainers();
      setContainers(containersData);
    } catch (error) {
      console.error('Failed to load containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContainerItems = async (containerNumber: string) => {
    try {
      const items = await getItemsByContainerNumber(containerNumber);
      setContainerItemsMap(prev => new Map(prev).set(containerNumber, items));
    } catch (error) {
      console.error('Failed to load container items:', error);
    }
  };

  const toggleContainer = async (container: Container) => {
    const newExpanded = new Set(expandedContainers);
    if (newExpanded.has(container.id)) {
      newExpanded.delete(container.id);
    } else {
      newExpanded.add(container.id);
      // Load items when expanding if not already loaded
      if (!containerItemsMap.has(container.containerNumber)) {
        await loadContainerItems(container.containerNumber);
      }
    }
    setExpandedContainers(newExpanded);
  };

  // Filter containers
  const filteredContainers = containers.filter((container) => {
    const matchesSearch = !searchQuery ||
      container.containerNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || container.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort: Arrived Ghana first, then by expected arrival
  const sortedContainers = [...filteredContainers].sort((a, b) => {
    // Prioritize arrived_ghana containers
    if (a.status === 'arrived_ghana' && b.status !== 'arrived_ghana') return -1;
    if (a.status !== 'arrived_ghana' && b.status === 'arrived_ghana') return 1;

    // Then sort by expected arrival date
    const dateA = new Date(a.expectedArrivalGhana || a.receivingDate).getTime();
    const dateB = new Date(b.expectedArrivalGhana || b.receivingDate).getTime();
    return dateB - dateA;
  });

  return (
    <>
      {/* Toolbar */}
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          {/* Page title */}
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Container Sorting
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/ghana" className="text-muted text-hover-primary">Ghana Team</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Sorting</li>
            </ul>
          </div>
          {/* end Page title */}
        </div>
      </div>
      {/* end Toolbar */}

      {/* Content */}
      <div id="kt_app_content" className="app-content flex-column-fluid">

        {/* Content container */}
        <div id="kt_app_content_container" className="app-container container-xxl">

          {/* Info Alert */}
          <div className="notice d-flex bg-light-info rounded border-info border border-dashed p-6 mb-5">
            <i className="ki-duotone ki-information fs-2tx text-info me-4">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
            </i>
            <div className="d-flex flex-stack flex-grow-1">
              <div className="fw-semibold">
                <h4 className="text-gray-900 fw-bold">Container Sorting</h4>
                <div className="fs-6 text-gray-700">
                  View items organized by container. Expand containers to see their contents and verify items before individual scanning.
                </div>
              </div>
            </div>
          </div>
          {/* end Info Alert */}

          {/* Search & Filter */}
          <div className="card card-flush mb-5">
            <div className="card-header align-items-center py-5 gap-2 gap-md-5">
              <div className="card-title">
                <div className="d-flex align-items-center position-relative my-1">
                  <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-4">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <input
                    type="text"
                    className="form-control form-control-solid w-250px ps-12"
                    placeholder="Search containers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-toolbar">
                <select
                  className="form-select form-select-solid w-150px"
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
          {/* end Search & Filter */}

          {/* Containers List */}
          <div className="card card-flush">
            <div className="card-header align-items-center py-5 gap-2 gap-md-5">
              <div className="card-title">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">
                    <i className="ki-duotone ki-package me-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                      <span className="path3"></span>
                    </i>
                    Containers ({sortedContainers.length})
                  </span>
                  <span className="text-gray-500 mt-1 fw-semibold fs-6">Expand to view container contents</span>
                </h3>
              </div>
            </div>
            <div className="card-body pt-0">
              {loading ? (
                <div className="text-center py-20">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-gray-600 mt-5">Loading containers...</p>
                </div>
              ) : sortedContainers.length === 0 ? (
                <div className="text-center py-20">
                  <i className="ki-duotone ki-package fs-5x text-gray-400 mb-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  <p className="text-gray-600 fs-5">No containers found</p>
                  <p className="text-gray-500">No containers match your search criteria.</p>
                </div>
              ) : (
                <div className="accordion" id="containerAccordion">
                  {sortedContainers.map((container) => {
                    const isExpanded = expandedContainers.has(container.id);
                    const containerItems = containerItemsMap.get(container.containerNumber) || [];

                    return (
                      <div key={container.id} className="accordion-item mb-3">
                        {/* Container Header - Always visible */}
                        <div
                          className="accordion-header cursor-pointer"
                          onClick={() => toggleContainer(container)}
                        >
                          <div className="accordion-button collapsed p-5" style={{ cursor: 'pointer' }}>
                            <div className="d-flex justify-content-between align-items-center w-100">
                              <div className="d-flex align-items-center">
                                <i className="ki-duotone ki-package fs-2x text-primary me-4">
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
                                    {container.expectedArrivalGhana && (
                                      <span>
                                        <i className="ki-duotone ki-calendar fs-3 me-1">
                                          <span className="path1"></span>
                                          <span className="path2"></span>
                                        </i>
                                        Expected: {new Date(container.expectedArrivalGhana).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3">
                                <span className={`badge ${
                                  container.status === 'china_warehouse' ? 'badge-light-warning' :
                                  container.status === 'in_transit' ? 'badge-light-info' :
                                  container.status === 'arrived_ghana' ? 'badge-light-success' :
                                  'badge-light-secondary'
                                }`}>
                                  {container.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                                <i className={`ki-duotone ki-${isExpanded ? 'up' : 'down'} fs-1`}>
                                  <span className="path1"></span>
                                  <span className="path2"></span>
                                </i>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Container Body - Collapsible */}
                        {isExpanded && (
                          <div className="accordion-collapse show">
                            <div className="accordion-body p-5">
                              {containerItems.length === 0 ? (
                                <div className="text-center py-5">
                                  <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                  <p className="text-gray-600 mt-3">Loading items...</p>
                                </div>
                              ) : (
                                <div className="table-responsive">
                                  <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                      <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                        <th className="min-w-125px">Tracking Number</th>
                                        <th className="min-w-100px">Item Name</th>
                                        <th className="min-w-100px">Customer</th>
                                        <th className="min-w-100px">Dimensions</th>
                                        <th className="text-end min-w-100px">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                      {containerItems.map((item) => (
                                        <tr key={item.id}>
                                          <td>
                                            <span className="text-gray-800 fw-bold">{item.trackingNumber}</span>
                                          </td>
                                          <td>
                                            <span className="text-gray-700">{item.name || <span className="text-muted">-</span>}</span>
                                          </td>
                                          <td>
                                            {item.customerId ? (
                                              <span className="badge badge-light-success">
                                                <i className="ki-duotone ki-check-circle fs-3 me-1">
                                                  <span className="path1"></span>
                                                  <span className="path2"></span>
                                                </i>
                                                Assigned
                                              </span>
                                            ) : (
                                              <span className="badge badge-light-warning">
                                                <i className="ki-duotone ki-information fs-3 me-1">
                                                  <span className="path1"></span>
                                                  <span className="path2"></span>
                                                  <span className="path3"></span>
                                                </i>
                                                Unassigned
                                              </span>
                                            )}
                                          </td>
                                          <td>
                                            {item.length && item.width && item.height ? (
                                              <div>
                                                <div className="text-gray-800 fw-semibold">
                                                  {item.length}×{item.width}×{item.height} {item.dimensionUnit}
                                                </div>
                                                <div className="text-gray-500 fs-7">CBM: {item.cbm?.toFixed(4)}</div>
                                              </div>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td className="text-end">
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* end Containers List */}
        </div>
        {/* end Content container */}
      </div>
      {/* end Content */}
    </>
  );
}
