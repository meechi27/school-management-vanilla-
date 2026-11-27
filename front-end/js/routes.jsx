import { Navigate } from 'react-router-dom';

import { Layout } from './components/Layout.jsx';
import { useApp } from './context/AppContext.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { DriverRoutePage } from './pages/DriverRoutePage.jsx';
import { InventoryStockPage } from './pages/InventoryStockPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ManagerProcurementPage } from './pages/ManagerProcurementPage.jsx';
import { PrincipalProcurementPage } from './pages/PrincipalProcurementPage.jsx';
import { SchoolRecordsPage } from './pages/SchoolRecordsPage.jsx';
import { SupplierQuotationsPage } from './pages/SupplierQuotationsPage.jsx';
import { SupplyRequestsPage } from './pages/SupplyRequestsPage.jsx';
import { TransportationManagementPage } from './pages/TransportationManagementPage.jsx';

export const dashboardPath = {
  principal: '/principal/dashboard',
  inventory_manager: '/inventory/dashboard',
  teacher: '/teacher/dashboard',
  supplier: '/supplier/dashboard',
  driver: '/driver/dashboard',
};

export const navigationByActor = {
  principal: [
    ['Dashboard', '/principal/dashboard'],
    ['School Records', '/principal/school'],
    ['Procurement Approval', '/principal/procurement'],
    ['Transportation Management', '/principal/transportation'],
  ],
  inventory_manager: [
    ['Dashboard', '/inventory/dashboard'],
    ['Inventory & Stock', '/inventory/stock'],
    ['Procurement Management', '/inventory/procurement'],
  ],
  teacher: [
    ['Dashboard', '/teacher/dashboard'],
    ['Supply Requests', '/teacher/requests'],
  ],
  supplier: [
    ['Dashboard', '/supplier/dashboard'],
    ['Supplier Quotations', '/supplier/quotations'],
  ],
  driver: [
    ['Dashboard', '/driver/dashboard'],
    ['My Route', '/driver/route'],
  ],
};

function ProtectedPage({ role, children }) {
  const { user } = useApp();
  if (!user) return <Navigate replace to="/login" />;
  if (user.actorId !== role) {
    return <Navigate replace to={dashboardPath[user.actorId] ?? '/login'} />;
  }
  return <Layout>{children}</Layout>;
}

function rolePage(role, page) {
  return <ProtectedPage role={role}>{page}</ProtectedPage>;
}

export const routeDefinitions = [
  { path: '/', element: <Navigate replace to="/login" /> },
  { path: '/access', element: <Navigate replace to="/login" /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/principal/dashboard', element: rolePage('principal', <DashboardPage />) },
  { path: '/inventory/dashboard', element: rolePage('inventory_manager', <DashboardPage />) },
  { path: '/teacher/dashboard', element: rolePage('teacher', <DashboardPage />) },
  { path: '/supplier/dashboard', element: rolePage('supplier', <DashboardPage />) },
  { path: '/driver/dashboard', element: rolePage('driver', <DashboardPage />) },
  { path: '/principal/school', element: rolePage('principal', <SchoolRecordsPage />) },
  { path: '/inventory/stock', element: rolePage('inventory_manager', <InventoryStockPage />) },
  { path: '/teacher/requests', element: rolePage('teacher', <SupplyRequestsPage />) },
  { path: '/inventory/procurement', element: rolePage('inventory_manager', <ManagerProcurementPage />) },
  { path: '/principal/procurement', element: rolePage('principal', <PrincipalProcurementPage />) },
  { path: '/supplier/quotations', element: rolePage('supplier', <SupplierQuotationsPage />) },
  { path: '/principal/transportation', element: rolePage('principal', <TransportationManagementPage />) },
  { path: '/driver/route', element: rolePage('driver', <DriverRoutePage />) },
  { path: '*', element: <Navigate replace to="/login" /> },
];
