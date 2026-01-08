import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  useEffect(() => {
    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      // Reinitialize Bootstrap components after React renders
      if (typeof window !== 'undefined' && (window as any).KTComponents) {
        try {
          (window as any).KTComponents.init();
        } catch (error) {
          // Silently handle initialization errors
        }
      }

      // Manually reinitialize specific components
      if (typeof window !== 'undefined') {
        try {
          // Reinitialize menus
          if ((window as any).KTMenu) {
            (window as any).KTMenu.createInstances('[data-kt-menu="true"]');
          }

          // Reinitialize toggles
          if ((window as any).KTToggle) {
            (window as any).KTToggle.createInstances('[data-kt-toggle]');
          }

          // Reinitialize drawers
          if ((window as any).KTDrawer) {
            (window as any).KTDrawer.createInstances('[data-kt-drawer="true"]');
          }

          // Reinitialize theme mode
          if ((window as any).KTThemeMode) {
            (window as any).KTThemeMode.init();
          }
        } catch (error) {
          // Silently handle initialization errors
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="d-flex flex-column flex-root app-root" id="kt_app_root">
      <div className="app-page flex-column flex-column-fluid" id="kt_app_page">
        <Header />

        <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
          <Sidebar />

          <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
            <Outlet />

            <div id="kt_app_footer" className="app-footer">
              <div className="app-container container-xxl d-flex flex-column flex-md-row flex-center flex-md-stack py-3">
                <div className="text-gray-900 order-2 order-md-1">
                  <span className="text-muted fw-semibold me-1">2025©</span>
                  <a href="#" className="text-gray-800 text-hover-primary">AFREQ Logistics</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
