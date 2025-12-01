import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  // Customer menu items
  { path: '/packages', label: 'Dashboard', icon: 'bi-box-seam', roles: ['customer'] },
  { path: '/status', label: 'Shipment Status', icon: 'bi-truck', roles: ['customer'] },
  { path: '/arrival', label: 'Estimated Arrival', icon: 'bi-calendar-event', roles: ['customer'] },
  { path: '/items', label: 'My Items', icon: 'bi-box', roles: ['customer'] },
  { path: '/announcements', label: 'Announcements', icon: 'bi-megaphone', roles: ['customer'] },
  { path: '/invoices', label: 'Invoices', icon: 'bi-receipt', roles: ['customer'] },
  { path: '/support', label: 'Support', icon: 'bi-headset', roles: ['customer'] },

  // China Team menu items
  { path: '/china/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['china_team', 'ghana_team', 'admin'] },
  { path: '/china/receiving', label: 'Upload Photos', icon: 'bi-camera', roles: ['china_team', 'admin'] },

  // Ghana Team menu items
  { path: '/ghana/tagging', label: 'Item Tagging', icon: 'bi-tag', roles: ['ghana_team', 'admin'] },
  { path: '/ghana/sorting', label: 'Sorting & Scanning', icon: 'bi-upc-scan', roles: ['ghana_team', 'admin'] },
  { path: '/ghana/csv-import', label: 'CSV Import', icon: 'bi-file-earmark-spreadsheet', roles: ['ghana_team', 'admin'] },

  // Admin menu items
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: 'bi-speedometer', roles: ['admin'] },
  { path: '/admin/packaging', label: 'Packaging', icon: 'bi-boxes', roles: ['admin'] },
  { path: '/admin/containers', label: 'Container Management', icon: 'bi-stack', roles: ['admin'] },
  { path: '/admin/support-requests', label: 'Support Requests', icon: 'bi-headset', roles: ['admin', 'ghana_team', 'china_team'] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  // Determine dashboard path based on user role
  const getDashboardPath = () => {
    switch (user?.role) {
      case 'customer':
        return '/packages';
      case 'china_team':
        return '/china/dashboard';
      case 'ghana_team':
        return '/ghana/tagging';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  const dashboardPath = getDashboardPath();

  return (
    <div id="kt_app_sidebar" className="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
      <div className="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
        <Link to={dashboardPath}>
          <span className="text-white fw-bold fs-3">AFREQ</span>
        </Link>

        <div id="kt_app_sidebar_toggle" className="app-sidebar-toggle btn btn-icon btn-shadow btn-sm btn-color-muted btn-active-color-primary h-30px w-30px position-absolute top-50 start-100 translate-middle rotate" data-kt-toggle="true" data-kt-toggle-state="active" data-kt-toggle-target="body" data-kt-toggle-name="app-sidebar-collapse">
          <i className="ki-duotone ki-black-left-line fs-3 rotate-180">
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
        </div>
      </div>

      <div className="app-sidebar-menu overflow-hidden flex-column-fluid">
        <div id="kt_app_sidebar_menu_wrapper" className="app-sidebar-wrapper">
          <div id="kt_app_sidebar_menu_scroll" className="scroll-y my-5 mx-3" data-kt-scroll="true" data-kt-scroll-activate="true" data-kt-scroll-height="auto" data-kt-scroll-dependencies="#kt_app_sidebar_logo, #kt_app_sidebar_footer" data-kt-scroll-wrappers="#kt_app_sidebar_menu" data-kt-scroll-offset="5px">
            <div className="menu menu-column menu-rounded menu-sub-indention fw-semibold fs-6" id="kt_app_sidebar_menu" data-kt-menu="true" data-kt-menu-expand="false">

              {filteredMenuItems.length > 0 && (
                <div className="menu-item pt-5">
                  <div className="menu-content">
                    <span className="menu-heading fw-bold text-uppercase fs-7">Menu</span>
                  </div>
                </div>
              )}

              {filteredMenuItems.map((item) => (
                <div key={item.path} className="menu-item">
                  <Link to={item.path} className={`menu-link ${location.pathname === item.path ? 'active' : ''}`}>
                    <span className="menu-icon">
                      <i className={`${item.icon} fs-2`}></i>
                    </span>
                    <span className="menu-title">{item.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
