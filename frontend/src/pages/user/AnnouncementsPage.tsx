import { useState, useEffect } from 'react';
import { getActiveAnnouncements } from '../../services/airtable';
import type { Announcement } from '../../types/index';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getActiveAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'important':
        return 'ki-notification-on';
      case 'update':
        return 'ki-information';
      case 'promotion':
        return 'ki-discount';
      default:
        return 'ki-message-text';
    }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { class: string; label: string }> = {
      important: { class: 'badge-danger', label: 'Important' },
      update: { class: 'badge-info', label: 'Update' },
      promotion: { class: 'badge-success', label: 'Promotion' },
      general: { class: 'badge-secondary', label: 'General' },
    };

    const badge = config[type] || config.general;
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const openAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column flex-column-fluid">
        <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
          <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
            <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
              <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                Announcements
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
                <p className="text-gray-600 mt-5">Loading announcements...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Announcements
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/dashboard" className="text-muted text-hover-primary">Home</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Announcements</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {announcements.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-20">
                <i className="ki-duotone ki-message-text-2 fs-5x text-gray-400 mb-5">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
                <h3 className="text-gray-800 mb-3">No Announcements</h3>
                <p className="text-gray-600">
                  There are no active announcements at the moment. Check back later for updates.
                </p>
              </div>
            </div>
          ) : (
            <div className="row g-6">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="col-md-6 col-lg-4">
                  <div
                    className={`card card-flush border h-100 hover-elevate-up cursor-pointer ${
                      announcement.type === 'important' ? 'border-danger' : ''
                    }`}
                    onClick={() => openAnnouncement(announcement)}
                  >
                    <div className="card-body p-6">
                      {/* Icon and Badge */}
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="symbol symbol-50px">
                          <div
                            className={`symbol-label ${
                              announcement.type === 'important'
                                ? 'bg-light-danger'
                                : announcement.type === 'update'
                                ? 'bg-light-info'
                                : announcement.type === 'promotion'
                                ? 'bg-light-success'
                                : 'bg-light-secondary'
                            }`}
                          >
                            <i
                              className={`ki-duotone ${getTypeIcon(announcement.type)} fs-2x ${
                                announcement.type === 'important'
                                  ? 'text-danger'
                                  : announcement.type === 'update'
                                  ? 'text-info'
                                  : announcement.type === 'promotion'
                                  ? 'text-success'
                                  : 'text-secondary'
                              }`}
                            >
                              <span className="path1"></span>
                              <span className="path2"></span>
                              <span className="path3"></span>
                            </i>
                          </div>
                        </div>
                        {getTypeBadge(announcement.type)}
                      </div>

                      {/* Title */}
                      <h3 className="fs-4 fw-bold text-gray-900 mb-3">
                        {announcement.title}
                      </h3>

                      {/* Preview */}
                      <p className="text-gray-600 fs-6 mb-4" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {announcement.message}
                      </p>

                      {/* Date */}
                      <div className="d-flex align-items-center text-gray-500 fs-7">
                        <i className="ki-duotone ki-calendar fs-6 me-2">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcement Detail Modal */}
      {showModal && selectedAnnouncement && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <div className="symbol symbol-40px me-3">
                    <div
                      className={`symbol-label ${
                        selectedAnnouncement.type === 'important'
                          ? 'bg-light-danger'
                          : selectedAnnouncement.type === 'update'
                          ? 'bg-light-info'
                          : selectedAnnouncement.type === 'promotion'
                          ? 'bg-light-success'
                          : 'bg-light-secondary'
                      }`}
                    >
                      <i
                        className={`ki-duotone ${getTypeIcon(selectedAnnouncement.type)} fs-2x ${
                          selectedAnnouncement.type === 'important'
                            ? 'text-danger'
                            : selectedAnnouncement.type === 'update'
                            ? 'text-info'
                            : selectedAnnouncement.type === 'promotion'
                            ? 'text-success'
                            : 'text-secondary'
                        }`}
                      >
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                      </i>
                    </div>
                  </div>
                  <div>
                    <h2 className="modal-title mb-0">{selectedAnnouncement.title}</h2>
                    <div className="text-gray-600 fs-7 mt-1">
                      {new Date(selectedAnnouncement.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">{getTypeBadge(selectedAnnouncement.type)}</div>
                <div className="fs-5 text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedAnnouncement.message}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
