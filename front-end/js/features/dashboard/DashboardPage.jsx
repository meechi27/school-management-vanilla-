import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useApp } from '../../context/AppContext.jsx';
import { PageHeader, StatCards, StatusBadge, formatMoney } from '../../components/ui.jsx';

const money = (value) => formatMoney(value);

export function DashboardPage() {
  const { state } = useApp();
  const actor = state.actors.find((item) => item.id === state.currentActorId);
  const stats = useMemo(() => {
    const pendingSupply = state.supplyRequests.filter((item) => item.status === 'pending').length;
    const lowStock = state.items.filter((item) => item.quantity < item.minimumStock).length;
    const pendingPurchase = state.purchaseRequests.filter((item) => item.status === 'pending_approval').length;
    const route = state.routes.find((item) => item.driverId === actor.id && item.status === 'approved');
    const journey = state.journeys.find((item) => item.routeId === route?.id && item.driverId === actor.id && item.status !== 'completed');
    if (actor.role === 'principal') return [
      ['Total Students', state.students.length], ['Pending Approvals', pendingPurchase],
      ['Low Stock Items', lowStock], ['Total Vehicles', state.vehicles.length],
    ];
    if (actor.role === 'inventory_manager') return [
      ['Total Items', state.items.length], ['Low Stock', lowStock],
      ['Department Requests', pendingSupply], ['Purchase Requests', pendingPurchase],
    ];
    if (actor.role === 'teacher') {
      const mine = state.supplyRequests.filter((item) => item.requesterId === actor.id);
      return [['My Requests', mine.length], ['Pending', mine.filter((item) => item.status === 'pending').length],
        ['Fulfilled', mine.filter((item) => item.status === 'fulfilled').length],
        ['Received Materials', mine.filter((item) => item.status === 'fulfilled').reduce((n, item) => n + item.items.length, 0)]];
    }
    if (actor.role === 'supplier') {
      const offers = state.offers.filter((offer) => offer.supplierId === state.currentSupplierId);
      const requests = state.consultations.filter((consultation) => consultation.status === 'open' && consultation.supplierIds.includes(state.currentSupplierId));
      return [['New Requests', requests.length], ['Submitted Offers', offers.length],
        ['Selected Offers', offers.filter((offer) => offer.status === 'selected').length],
        ['Pending Responses', requests.filter((request) => !offers.some((offer) => offer.consultationId === request.id)).length]];
    }
    return [['Assigned Vehicle', state.vehicles.find((item) => item.id === route?.vehicleId)?.registration ?? '—'],
      ['Assigned Route', route?.name ?? '—'], ['Next Journey', journey?.date ?? '—'],
      ['Open Reports', state.driverReports.filter((item) => item.driverId === actor.id && item.status !== 'resolved').length]];
  }, [state, actor]);
  const quickLinks = {
    principal: [['School Records', '/principal/school'], ['Procurement Approval', '/principal/procurement'], ['Transportation Management', '/principal/transportation']],
    inventory_manager: [['Inventory & Stock', '/inventory/stock'], ['Procurement Management', '/inventory/procurement']],
    teacher: [['Supply Requests', '/teacher/requests']],
    supplier: [['Supplier Quotations', '/supplier/quotations']],
    driver: [['My Route', '/driver/route']],
  }[actor.role];
  const dashboardRows = actor.role === 'principal'
    ? [
      ['Pending purchase approvals', state.purchaseRequests.filter((item) => item.status === 'pending_approval').map((item) => `${item.reference} · ${money(item.estimatedTotal)}`)],
      ['Inventory warnings', state.items.filter((item) => item.quantity < item.minimumStock).map((item) => `${item.name} · ${item.quantity} left`)],
      ['Transportation alerts', state.driverReports.filter((item) => item.status !== 'resolved').map((item) => `${item.reference} · ${item.type}: ${item.description}`)],
      ['Recent school activity', state.movements.slice(-4).reverse().map((item) => `${item.date} · ${item.type} ${state.items.find((product) => product.id === item.itemId)?.name ?? 'item'}`)],
    ]
    : actor.role === 'inventory_manager'
      ? [
        ['Recent stock movements', state.movements.slice(-4).reverse().map((item) => `${item.date} · ${item.type} ${item.quantity} ${state.items.find((product) => product.id === item.itemId)?.name ?? 'item'}`)],
        ['Department requests', state.supplyRequests.filter((item) => item.status === 'pending').map((item) => `${item.reference} · ${item.department}`)],
        ['Low-stock items', state.items.filter((item) => item.quantity < item.minimumStock).map((item) => `${item.name} · ${item.quantity}/${item.minimumStock}`)],
        ['Purchase requests', state.purchaseRequests.slice(0, 4).map((item) => `${item.reference} · ${item.status}`)],
      ]
      : actor.role === 'teacher'
        ? [['Recent requests', state.supplyRequests.filter((item) => item.requesterId === actor.id).slice(0, 5).map((item) => `${item.reference} · ${item.department} · ${item.status}`)],
          ['Received materials', state.supplyRequests.filter((item) => item.requesterId === actor.id && item.status === 'fulfilled').flatMap((request) => request.items.map((line) => `${state.items.find((item) => item.id === line.itemId)?.name} · ${line.quantity} · ${request.issuedAt}`))]]
        : actor.role === 'supplier'
          ? [['Incoming quotation requests', state.consultations.filter((item) => item.status === 'open' && item.supplierIds.includes(state.currentSupplierId)).map((item) => `${item.reference} · deadline ${item.deadline}`)],
            ['Recent offers', state.offers.filter((item) => item.supplierId === state.currentSupplierId).map((item) => `${item.reference} · ${money(item.totalAmount)} · ${item.status}`)]]
          : (() => {
            const route = state.routes.find((item) => item.driverId === actor.id && item.status === 'approved');
            const vehicle = state.vehicles.find((item) => item.id === route?.vehicleId);
            return [
              ['Today’s transport schedule', route ? [`${route.name} · ${route.scheduledDeparture}–${route.scheduledArrival}`] : []],
              ['Vehicle and passengers', route ? [`${vehicle?.registration} · ${route.studentIds.length}/${vehicle?.capacity} passengers`] : []],
              ['Journey history', state.journeys.filter((item) => item.driverId === actor.id).slice(0, 4).map((item) => `${item.date} · ${item.status}`)],
              ['Recent reports', state.driverReports.filter((item) => item.driverId === actor.id).slice(0, 4).map((item) => `${item.reference} · ${item.status}`)],
            ];
          })();
  return (
    <>
      <PageHeader description={`Welcome back, ${actor.name}. Here is the latest activity for your workspace.`} title="Dashboard" />
      <StatCards items={stats.map(([label, value]) => ({ label, value }))} />
      <section className="content-card">
        <h2>Quick actions</h2>
        <div className="quick-links">{quickLinks.map(([label, href]) => <Link className="button button--secondary" key={href} to={href}>{label}</Link>)}</div>
      </section>
      <div className="dashboard-panels">
        {dashboardRows.map(([heading, rows]) => <section className="content-card" key={heading}><h2>{heading}</h2>{rows.length ? <ul className="activity-list">{rows.map((row, index) => <li key={`${heading}-${index}`}>{row}</li>)}</ul> : <p className="muted-copy">Nothing to review right now.</p>}</section>)}
      </div>
      <section className="content-card">
        <h2>Recent activity</h2>
        {state.notifications.length ? <ul className="activity-list">{state.notifications.slice(0, 4).map((item) => <li key={item.id}><StatusBadge value={item.type} /> {item.message}</li>)}</ul> : <p>No recent activity yet.</p>}
      </section>
    </>
  );
}
