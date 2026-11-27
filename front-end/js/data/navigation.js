export const dashboardPath = Object.freeze({
  principal: '/principal/dashboard',
  inventory_manager: '/inventory/dashboard',
  teacher: '/teacher/dashboard',
  supplier: '/supplier/dashboard',
  driver: '/driver/dashboard',
});

export const navigationByActor = Object.freeze({
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
  teacher: [['Dashboard', '/teacher/dashboard'], ['Supply Requests', '/teacher/requests']],
  supplier: [['Dashboard', '/supplier/dashboard'], ['Supplier Quotations', '/supplier/quotations']],
  driver: [['Dashboard', '/driver/dashboard'], ['My Route', '/driver/route']],
});
