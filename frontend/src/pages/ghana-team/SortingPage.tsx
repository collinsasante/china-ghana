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
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Container Sorting
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Ghana Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Sorting</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">

          {/* Info Alert */}
          <div className="alert alert-light-info mb-5">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle fs-2 me-3"></i>
              <div>
                <strong>Container Sorting:</strong> View items organized by container. Expand containers to see their contents and verify items before individual scanning.
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
                <div className="accordion" id="containerAccordion">
                  {sortedContainers.map((container) => {
                    const isExpanded = expandedContainers.has(container.id);
                    const containerItems = containerItemsMap.get(container.containerNumber) || [];

                    return (
                      <div key={container.id} className="accordion-item mb-3 border rounded">
                        {/* Container Header - Always visible */}
                        <div
                          className="accordion-header"
                          id={`heading-${container.id}`}
                        >
                          <button
                            className={`accordion-button ${isExpanded ? '' : 'collapsed'} bg-light-primary`}
                            type="button"
                            onClick={() => toggleContainer(container)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center w-100">
                              <div className="symbol symbol-50px me-4">
                                <div className="symbol-label bg-primary">
                                  <i className="bi bi-box-seam fs-2x text-white"></i>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-bold fs-4 text-gray-900">{container.containerNumber}</div>
                                    <div className="text-muted fs-7">
                                      <i className="bi bi-box me-1"></i>
                                      {container.itemCount} items
                                      {container.expectedArrivalGhana && (
                                        <>
                                          {' • '}
                                          <i className="bi bi-calendar me-1"></i>
                                          Expected: {new Date(container.expectedArrivalGhana).toLocaleDateString()}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="me-5">
                                    <span className={`badge fs-6 ${
                                      container.status === 'china_warehouse' ? 'badge-warning' :
                                      container.status === 'in_transit' ? 'badge-info' :
                                      container.status === 'arrived_ghana' ? 'badge-success' :
                                      'badge-secondary'
                                    }`}>
                                      {container.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* Container Body - Collapsible */}
                        {isExpanded && (
                          <div className="accordion-collapse show">
                            <div className="accordion-body">
                              {containerItems.length === 0 ? (
                                <div className="text-center py-5">
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Loading items...
                                </div>
                              ) : (
                                <div className="table-responsive">
                                  <table className="table table-row-bordered table-hover align-middle">
                                    <thead>
                                      <tr className="fw-bold text-muted bg-light">
                                        <th className="ps-4">Tracking Number</th>
                                        <th>Item Name</th>
                                        <th>Customer</th>
                                        <th>Dimensions</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {containerItems.map((item) => (
                                        <tr key={item.id}>
                                          <td className="ps-4">
                                            <div className="fw-bold text-gray-800">{item.trackingNumber}</div>
                                          </td>
                                          <td>{item.name || <span className="text-muted">-</span>}</td>
                                          <td>
                                            {item.customerId ? (
                                              <span className="badge badge-light-success">
                                                <i className="bi bi-check-circle me-1"></i>
                                                Assigned
                                              </span>
                                            ) : (
                                              <span className="badge badge-light-warning">
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                Unassigned
                                              </span>
                                            )}
                                          </td>
                                          <td>
                                            {item.length && item.width && item.height ? (
                                              <span className="text-muted">
                                                {item.length}×{item.width}×{item.height} {item.dimensionUnit}
                                                <br />
                                                <small className="text-gray-600">CBM: {item.cbm?.toFixed(4)}</small>
                                              </span>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
