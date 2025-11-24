export default function DashboardPage() {
  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Dashboard
            </h1>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          <div className="row g-5 g-xl-10">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="card card-flush">
                <div className="card-body text-center">
                  <h3 className="text-primary">Welcome to AFREQ</h3>
                  <p className="text-gray-600">Delivery Tracking System</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
