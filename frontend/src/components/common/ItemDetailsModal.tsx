import type { Item } from '../../types/index';

interface ItemDetailsModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemDetailsModal({ item, isOpen, onClose }: ItemDetailsModalProps) {
  if (!item || !isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Item Details</h3>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {/* Item Photos */}
            {item.photos && item.photos.length > 0 && (
              <div className="mb-5">
                <div className="row g-3">
                  {item.photos.map((photo, index) => (
                    <div key={index} className="col-md-4">
                      <img
                        src={typeof photo === 'string' ? photo : photo.url}
                        alt={`Item ${index + 1}`}
                        className="img-fluid rounded"
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Information */}
            <div className="row g-5">
              <div className="col-md-6">
                <h5 className="mb-4">Basic Information</h5>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Item Name:</label>
                  <div className="text-gray-800 fw-bold">{item.name || 'Unnamed Item'}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Tracking Number:</label>
                  <div className="text-gray-800 fw-bold">{item.trackingNumber}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Container Number:</label>
                  <div className="text-gray-800">{item.containerNumber || 'N/A'}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Receiving Date:</label>
                  <div className="text-gray-800">{new Date(item.receivingDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="col-md-6">
                <h5 className="mb-4">Shipping Details</h5>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Status:</label>
                  <div>
                    <span className={`badge ${
                      item.status === 'china_warehouse' ? 'badge-light-info' :
                      item.status === 'in_transit' ? 'badge-light-primary' :
                      item.status === 'arrived_ghana' ? 'badge-light-warning' :
                      item.status === 'ready_for_pickup' ? 'badge-light-success' :
                      'badge-light-secondary'
                    }`}>
                      {item.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Shipping Method:</label>
                  <div className="text-gray-800">
                    {item.shippingMethod === 'sea' ? 'Sea Freight' : 'Air Freight'}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Dimensions:</label>
                  <div className="text-gray-800">
                    {item.length} × {item.width} × {item.height} {item.dimensionUnit}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">CBM:</label>
                  <div className="text-gray-800">{item.cbm.toFixed(6)} m³</div>
                </div>
                {item.weight && (
                  <div className="mb-3">
                    <label className="text-muted fw-semibold">Weight:</label>
                    <div className="text-gray-800">{item.weight} {item.weightUnit}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="separator my-5"></div>

            {/* Cost Information */}
            <div className="row g-5">
              <div className="col-md-6">
                <h5 className="mb-4">Cost</h5>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">USD:</label>
                  <div className="text-gray-800 fw-bold fs-3">${item.costUSD.toFixed(2)}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-semibold">Cedis:</label>
                  <div className="text-gray-800 fw-bold fs-3">₵{item.costCedis.toFixed(2)} GHS</div>
                </div>
              </div>

              {(item.isDamaged || item.isMissing) && (
                <div className="col-md-6">
                  <h5 className="mb-4">Flags</h5>
                  {item.isDamaged && (
                    <div className="alert alert-danger d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <span>This item is marked as damaged</span>
                    </div>
                  )}
                  {item.isMissing && (
                    <div className="alert alert-warning d-flex align-items-center">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      <span>This item is marked as missing</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
