import { Navigate } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { SchoolRecordsPage } from '../features/school/SchoolRecordsPage.jsx';
import { InventoryStockPage } from '../features/inventory/InventoryStockPage.jsx';
import { SupplyRequestsPage } from '../features/supply/SupplyRequestsPage.jsx';
import { ManagerProcurementPage } from '../features/procurement/ManagerProcurementPage.jsx';
import { PrincipalProcurementPage } from '../features/procurement/PrincipalProcurementPage.jsx';
import { SupplierQuotationsPage } from '../features/procurement/SupplierQuotationsPage.jsx';
import { AccessPage } from '../features/access/AccessPage.jsx';
import { TransportationManagementPage } from '../features/transportation/TransportationManagementPage.jsx';
import { DriverRoutePage } from '../features/transportation/DriverRoutePage.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { dashboardPath } from '../data/navigation.js';

function ProtectedPage({ role, children }) {
  const { state } = useApp();
  if (!state.currentActorId) return <Navigate replace to="/access" />;
  if (state.currentActorId !== role) {
    return <Navigate replace to={dashboardPath[state.currentActorId] ?? '/access'} />;
  }
  return <AppLayout>{children}</AppLayout>;
}

function roleElement(role, child) {
  return <ProtectedPage role={role}>{child}</ProtectedPage>;
}

export const routeDefinitions = [
  { path: '/access', element: <AccessPage /> },
  { path: '/principal/dashboard', element: roleElement('principal', <DashboardPage />) },
  { path: '/inventory/dashboard', element: roleElement('inventory_manager', <DashboardPage />) },
  { path: '/teacher/dashboard', element: roleElement('teacher', <DashboardPage />) },
  { path: '/supplier/dashboard', element: roleElement('supplier', <DashboardPage />) },
  { path: '/driver/dashboard', element: roleElement('driver', <DashboardPage />) },
  { path: '/principal/school', element: roleElement('principal', <SchoolRecordsPage />) },
  { path: '/inventory/stock', element: roleElement('inventory_manager', <InventoryStockPage />) },
  { path: '/teacher/requests', element: roleElement('teacher', <SupplyRequestsPage />) },
  { path: '/inventory/procurement', element: roleElement('inventory_manager', <ManagerProcurementPage />) },
  { path: '/principal/procurement', element: roleElement('principal', <PrincipalProcurementPage />) },
  { path: '/supplier/quotations', element: roleElement('supplier', <SupplierQuotationsPage />) },
  { path: '/principal/transportation', element: roleElement('principal', <TransportationManagementPage />) },
  { path: '/driver/route', element: roleElement('driver', <DriverRoutePage />) },
  { path: '*', element: <Navigate replace to="/access" /> },
];

