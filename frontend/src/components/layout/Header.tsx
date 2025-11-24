import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div id="kt_app_header" className="app-header" data-kt-sticky="true" data-kt-sticky-activate="{default: true, lg: true}" data-kt-sticky-name="app-header-minimize" data-kt-sticky-offset="{default: '200px', lg: '0'}" data-kt-sticky-animation="false">
      <div className="app-container container-xxl d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
        <div className="d-flex align-items-center d-lg-none ms-n3 me-1 me-md-2" title="Show sidebar menu">
          <div className="btn btn-icon btn-active-color-primary w-35px h-35px" id="kt_app_sidebar_mobile_toggle">
            <i className="ki-duotone ki-abstract-14 fs-2 fs-md-1">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
          </div>
        </div>

        <div className="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
          <a href="/dashboard" className="d-lg-none">
            <span className="text-gray-900 fw-bold fs-3">AFREQ</span>
          </a>
        </div>

        <div className="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
          <div className="app-header-menu app-header-mobile-drawer align-items-stretch" data-kt-drawer="true" data-kt-drawer-name="app-header-menu" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="250px" data-kt-drawer-direction="end" data-kt-drawer-toggle="#kt_app_header_menu_toggle" data-kt-swapper="true" data-kt-swapper-mode="{default: 'append', lg: 'prepend'}" data-kt-swapper-parent="{default: '#kt_app_body', lg: '#kt_app_header_wrapper'}">
          </div>

          <div className="app-navbar flex-shrink-0">
            {/* Theme Mode Toggle */}
            <div className="app-navbar-item ms-1 ms-md-4">
              <a href="#" className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
                <i className="ki-duotone ki-night-day theme-light-show fs-1">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                  <span className="path5"></span>
                  <span className="path6"></span>
                  <span className="path7"></span>
                  <span className="path8"></span>
                  <span className="path9"></span>
                  <span className="path10"></span>
                </i>
                <i className="ki-duotone ki-moon theme-dark-show fs-1">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
              </a>

              {/* Theme Menu Dropdown */}
              <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-title-gray-700 menu-icon-gray-500 menu-active-bg menu-state-color fw-semibold py-4 fs-base w-150px" data-kt-menu="true" data-kt-element="theme-mode-menu">
                <div className="menu-item px-3 my-0">
                  <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="light">
                    <span className="menu-icon" data-kt-element="icon">
                      <i className="ki-duotone ki-night-day fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                        <span className="path6"></span>
                        <span className="path7"></span>
                        <span className="path8"></span>
                        <span className="path9"></span>
                        <span className="path10"></span>
                      </i>
                    </span>
                    <span className="menu-title">Light</span>
                  </a>
                </div>

                <div className="menu-item px-3 my-0">
                  <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="dark">
                    <span className="menu-icon" data-kt-element="icon">
                      <i className="ki-duotone ki-moon fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                    </span>
                    <span className="menu-title">Dark</span>
                  </a>
                </div>

                <div className="menu-item px-3 my-0">
                  <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="system">
                    <span className="menu-icon" data-kt-element="icon">
                      <i className="ki-duotone ki-screen fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                      </i>
                    </span>
                    <span className="menu-title">System</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="app-navbar-item ms-1 ms-md-4" id="kt_header_user_menu_toggle">
              <div className="cursor-pointer symbol symbol-35px" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
                <div className="symbol-label fs-5 fw-semibold text-success">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-color fw-semibold py-4 fs-6 w-275px" data-kt-menu="true">
                <div className="menu-item px-3">
                  <div className="menu-content d-flex align-items-center px-3">
                    <div className="symbol symbol-50px me-5">
                      <div className="symbol-label fs-3 fw-semibold text-success">
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="d-flex flex-column">
                      <div className="fw-bold d-flex align-items-center fs-5">
                        {user?.name}
                      </div>
                      <a href="#" className="fw-semibold text-muted text-hover-primary fs-7">
                        {user?.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="separator my-2"></div>

                <div className="menu-item px-5">
                  <a href="#" className="menu-link px-5">
                    <span className="menu-text">My Profile</span>
                  </a>
                </div>

                <div className="menu-item px-5">
                  <button onClick={handleLogout} className="menu-link px-5 btn btn-link text-start w-100">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
