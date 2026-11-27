import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import {
  Button, ConfirmAction, DataTable, FormDialog, PageHeader, RecordDrawer,
  StatCards, StatusBadge, Tabs, formatMoney,
} from '../components/ui.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const makeReference = (prefix, list) => `${prefix}-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
const status = (value) => <StatusBadge value={value} />;
const money = (value) => formatMoney(value);

function useScreen() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('');
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  return { state, dispatch, tab, setTab, form, setForm, selected, setSelected };
}

function ActionForm({ config, state, dispatch, onClose }) {
  const { type, title, fields, transform, submitLabel } = config;
  return (
    <FormDialog
      fields={typeof fields === 'function' ? fields(state) : fields}
      initialValues={config.initialValues}
      onClose={onClose}
      onSubmit={(values) => {
        dispatch({ type, payload: transform ? transform(values, state) : values });
        onClose();
      }}
      submitLabel={submitLabel}
      title={title}
      size="large"
    />
  );
}

function ScreenFrame({ title, description, action, tabs, activeTab, onTab, children }) {
  return (
    <>
      <PageHeader action={action} description={description} title={title} />
      {tabs && <Tabs items={tabs} onChange={onTab} value={activeTab} />}
      {children}
    </>
  );
}

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

export function SchoolRecordsPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Students';
  const [classFilter, setClassFilter] = useState('');
  const student = screen.selected;
  const className = (id) => state.classes.find((item) => item.id === id)?.name ?? '—';
  const studentFields = [
    { name: 'id', label: 'Student ID', required: true },
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'classId', label: 'Class', type: 'select', required: true, options: state.classes.map((item) => ({ value: item.id, label: item.name })) },
    { name: 'academicYear', label: 'Academic year', required: true, defaultValue: state.academicYear },
    { name: 'guardianName', label: 'Guardian name' },
    { name: 'guardianPhone', label: 'Guardian phone', type: 'tel' },
  ];
  const formConfig = screen.form?.kind === 'student'
    ? { type: screen.form.record ? 'UPDATE_STUDENT' : 'ADD_STUDENT', title: screen.form.record ? 'Edit student' : 'Register student', fields: studentFields,
      initialValues: screen.form.record,
      transform: (values) => screen.form.record ? { ...values, originalId: screen.form.record.id } : values }
    : screen.form?.kind === 'class'
      ? { type: 'CHANGE_STUDENT_CLASS', title: 'Change class', fields: [{ name: 'classId', label: 'New class', type: 'select', required: true, options: state.classes.map((item) => ({ value: item.id, label: item.name })) }],
        transform: (values) => ({ ...values, studentId: student.id }) }
      : null;
  const filtered = state.students.filter((item) => !classFilter || item.classId === classFilter);
  return (
    <>
      <ScreenFrame activeTab={tab} action={tab === 'Students' && <Button onClick={() => screen.setForm({ kind: 'student' })}>Register Student</Button>} description="Manage students and their academic assignments." onTab={screen.setTab} tabs={['Students', 'Classes', 'Enrollment']} title="School Records">
        <StatCards items={[{ label: 'Total Students', value: state.students.length }, { label: 'Classes', value: state.classes.length }, { label: 'Academic Year', value: state.academicYear }]} />
        {tab === 'Students' && <><label className="filter-field">Filter by class <select onChange={(event) => setClassFilter(event.target.value)} value={classFilter}><option value="">All classes</option>{state.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><DataTable columns={[{ key: 'id', label: 'Student ID' }, { key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' }, { key: 'classId', label: 'Class', render: (item) => className(item.classId) }, { key: 'academicYear', label: 'Academic Year' }, { key: 'actions', label: 'Actions', render: (item) => <Button onClick={(event) => { event.stopPropagation(); screen.setSelected(item); }} variant="quiet">Details</Button> }]} onRowClick={screen.setSelected} rows={filtered} searchKeys={['firstName', 'lastName', 'id']} /></>}
        {tab === 'Classes' && <DataTable columns={[{ key: 'name', label: 'Class' }, { key: 'academicYear', label: 'Academic Year' }, { key: 'students', label: 'Students', render: (item) => state.students.filter((studentItem) => studentItem.classId === item.id).length }]} onRowClick={(item) => screen.setSelected({ ...item, isClass: true })} rows={state.classes} />}
        {tab === 'Enrollment' && <section className="content-card"><h2>Enrollment by class</h2>{state.classes.map((item) => { const count = state.students.filter((studentItem) => studentItem.classId === item.id).length; return <div className="bar-row" key={item.id}><span>{item.name} · {count} students</span><div className="bar-track"><span style={{ width: `${state.students.length ? count / state.students.length * 100 : 0}%` }} /></div></div>; })}</section>}
      </ScreenFrame>
      {formConfig && <ActionForm config={formConfig} dispatch={dispatch} onClose={() => screen.setForm(null)} state={state} />}
      {student && <RecordDrawer fields={student.isClass ? [['Class', student.name], ['Academic year', student.academicYear], ['Students', state.students.filter((item) => item.classId === student.id).map((item) => `${item.firstName} ${item.lastName}`).join(', ')]] : [['Student ID', student.id], ['Name', `${student.firstName} ${student.lastName}`], ['Class', className(student.classId)], ['Academic year', student.academicYear], ['Guardian', student.guardianName], ['Guardian phone', student.guardianPhone]]} onClose={() => screen.setSelected(null)} record={student} title={student.isClass ? 'Class details' : 'Student details'} actions={!student.isClass && <><Button onClick={() => { screen.setForm({ kind: 'student', record: student }); screen.setSelected(null); }} variant="secondary">Edit</Button><Button onClick={() => screen.setForm({ kind: 'class' })} variant="secondary">Change Class</Button></>} />}
    </>
  );
}

export function InventoryStockPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Items';
  const [detail, setDetail] = useState(null);
  const itemOptions = state.items.map((item) => ({ value: item.id, label: `${item.name} (${item.quantity} ${item.unit})` }));
  const supplierOptions = state.suppliers.map((item) => ({ value: item.id, label: item.name }));
  const itemFields = [{ name: 'code', label: 'Item code', required: true }, { name: 'name', label: 'Item name', required: true }, { name: 'description', label: 'Description', type: 'textarea', wide: true }, { name: 'category', label: 'Category', required: true }, { name: 'unit', label: 'Unit', required: true }, { name: 'supplierId', label: 'Supplier', type: 'select', options: supplierOptions }, { name: 'countryOfOrigin', label: 'Country of origin' }, { name: 'quantity', label: 'Available quantity', type: 'number', min: 0, defaultValue: 0 }, { name: 'minimumStock', label: 'Minimum stock', type: 'number', min: 0, defaultValue: 0 }, { name: 'purchasePrice', label: 'Purchase price', type: 'number', min: 0, defaultValue: 0 }, { name: 'location', label: 'Storage location', required: true }];
  const fields = screen.form?.kind === 'item' ? itemFields : screen.form?.kind === 'movement' ? [
    { name: 'itemId', label: 'Item', type: 'select', options: itemOptions, required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true },
    { name: 'date', label: 'Date', type: 'date', defaultValue: today(), required: true },
    ...(screen.form.type === 'issue' ? [{ name: 'recipient', label: 'Recipient', required: true }] : []),
    ...(screen.form.type === 'transfer' ? [{ name: 'source', label: 'From location', required: true }, { name: 'destination', label: 'To location', required: true }] : []),
    ...(screen.form.type === 'delivery' ? [{ name: 'source', label: 'Supplier / source' }] : []),
    ...(screen.form.type === 'return' ? [{ name: 'recipient', label: 'Original recipient', required: true }, { name: 'condition', label: 'Condition', required: true }] : []),
  ] : null;
  const config = fields && {
    type: screen.form.kind === 'item' ? (screen.form.record ? 'UPDATE_ITEM' : 'ADD_ITEM') : 'RECORD_STOCK_MOVEMENT',
    title: screen.form.kind === 'item' ? (screen.form.record ? 'Edit inventory item' : 'Add inventory item') : `${screen.form.type[0].toUpperCase()}${screen.form.type.slice(1)} stock`,
    fields,
    initialValues: screen.form.kind === 'item' ? screen.form.record : undefined,
    transform: (values) => screen.form.kind === 'item'
      ? { ...values, id: screen.form.record?.id ?? makeId('item'), quantity: Number(values.quantity), minimumStock: Number(values.minimumStock), purchasePrice: Number(values.purchasePrice) }
      : { ...values, id: makeId('movement'), reference: makeReference('MV', state.movements), type: screen.form.type },
  };
  const requestColumns = [
    { key: 'reference', label: 'Request' },
    { key: 'requesterName', label: 'Requester' },
    { key: 'department', label: 'Department' },
    { key: 'createdAt', label: 'Date' },
    { key: 'status', label: 'Status', render: (item) => status(item.status) },
    { key: 'action', label: 'Action', render: (item) => (
      <ConfirmAction
        disabled={item.status !== 'pending'}
        message={`Issue all requested materials for ${item.reference}? Stock will be checked before anything is changed.`}
        onConfirm={() => dispatch({
          type: 'FULFILL_SUPPLY_REQUEST',
          payload: {
            requestId: item.id,
            issuedAt: today(),
            movementBase: { id: makeId('movement'), reference: makeReference('MV', state.movements) },
          },
        })}
      >
        Issue Materials
      </ConfirmAction>
    ) },
  ];
  return (
    <>
      <ScreenFrame activeTab={tab} action={tab === 'Items' && <Button onClick={() => screen.setForm({ kind: 'item' })}>Add Item</Button>} description="Manage school items, stock movements and departmental requests." onTab={screen.setTab} tabs={['Items', 'Stock Movements', 'Department Requests']} title="Inventory & Stock">
        <StatCards items={[{ label: 'Inventory Items', value: state.items.length }, { label: 'Low Stock', value: state.items.filter((item) => item.quantity < item.minimumStock).length }, { label: 'Available Units', value: state.items.reduce((sum, item) => sum + item.quantity, 0) }]} />
        {tab === 'Items' && <DataTable columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'quantity', label: 'Quantity', render: (item) => <>{item.quantity} {item.unit} {item.quantity < item.minimumStock && <StatusBadge value="Low stock" />}</> }, { key: 'minimumStock', label: 'Minimum' }, { key: 'location', label: 'Location' }, { key: 'actions', label: 'Actions', render: (item) => <Button onClick={(event) => { event.stopPropagation(); setDetail(item); }} variant="quiet">Details</Button> }]} onRowClick={setDetail} rows={state.items} searchKeys={['name', 'code', 'category']} />}
        {tab === 'Stock Movements' && <><div className="action-row">{['delivery', 'issue', 'transfer', 'return'].map((type) => <Button key={type} onClick={() => screen.setForm({ kind: 'movement', type })} variant="secondary">{type[0].toUpperCase() + type.slice(1)}</Button>)}</div><DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'date', label: 'Date' }, { key: 'itemId', label: 'Item', render: (item) => state.items.find((record) => record.id === item.itemId)?.name }, { key: 'type', label: 'Type', render: (item) => status(item.type) }, { key: 'quantity', label: 'Quantity' }, { key: 'recipient', label: 'Source / Recipient', render: (item) => item.recipient ?? item.source ?? item.destination ?? '—' }]} rows={[...state.movements].reverse()} /></>}
        {tab === 'Department Requests' && <DataTable columns={requestColumns} rows={state.supplyRequests} searchKeys={['reference', 'requesterName', 'department']} />}
      </ScreenFrame>
      {config && <ActionForm config={config} dispatch={dispatch} onClose={() => screen.setForm(null)} state={state} />}
      {screen.selected && <RecordDrawer fields={[['Reference', screen.selected.reference], ['Requester', screen.selected.requesterName], ['Department', screen.selected.department], ['Justification', screen.selected.reason], ['Items', screen.selected.items.map((line) => `${state.items.find((item) => item.id === line.itemId)?.name}: ${line.quantity}`).join(', ')], ['Submitted', screen.selected.createdAt], ['Status', screen.selected.status], ['Issued', screen.selected.issuedAt]]} onClose={() => screen.setSelected(null)} record={screen.selected} title="Supply request details" />}
      {detail && <RecordDrawer fields={[['Code', detail.code], ['Name', detail.name], ['Category', detail.category], ['Description', detail.description], ['Available quantity', `${detail.quantity} ${detail.unit}`], ['Minimum stock', detail.minimumStock], ['Status', detail.quantity < detail.minimumStock ? 'Low stock' : 'In stock'], ['Storage location', detail.location], ['Recent movements', state.movements.filter((item) => item.itemId === detail.id).slice(-4).map((item) => `${item.date}: ${item.type} ${item.quantity}`).join('; ') || 'No movements']]} onClose={() => setDetail(null)} record={detail} title="Item details" actions={<Button onClick={() => { screen.setForm({ kind: 'item', record: detail }); setDetail(null); }} variant="secondary">Edit Item</Button>} />}
    </>
  );
}

export function SupplyRequestsPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'My Requests';
  const mine = state.supplyRequests.filter((item) => item.requesterId === 'teacher');
  const config = screen.form && {
    type: 'CREATE_SUPPLY_REQUEST', title: 'New Supply Request',
    fields: [
      { name: 'department', label: 'Department', required: true },
      { name: 'requesterName', label: 'Requester', required: true, defaultValue: state.actors.find((item) => item.id === 'teacher').name },
      { name: 'createdAt', label: 'Date', type: 'date', defaultValue: today(), required: true },
      { name: 'reason', label: 'Justification', type: 'textarea', wide: true, required: true },
      { name: 'items', label: 'Requested items', type: 'item-lines', items: state.items, wide: true, required: true },
    ],
    transform: (values) => ({ ...values, id: makeId('sreq'), reference: makeReference('SR', state.supplyRequests), requesterId: 'teacher', items: values.items.map((line) => ({ itemId: line.itemId, quantity: Number(line.quantity) })) }),
  };
  const received = mine.filter((request) => request.status === 'fulfilled').flatMap((request) => request.items.map((line) => ({ ...line, id: `${request.id}-${line.itemId}`, request })));
  return (
    <>
      <ScreenFrame activeTab={tab} action={tab === 'My Requests' && <Button onClick={() => screen.setForm(true)}>New Request</Button>} description="Request school materials and review completed deliveries." onTab={screen.setTab} tabs={['My Requests', 'Received Materials']} title="Supply Requests">
        {tab === 'My Requests' && <><StatCards items={[{ label: 'Total Requests', value: mine.length }, { label: 'Pending', value: mine.filter((item) => item.status === 'pending').length }, { label: 'Fulfilled', value: mine.filter((item) => item.status === 'fulfilled').length }]} /><DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'createdAt', label: 'Date' }, { key: 'items', label: 'Items', render: (item) => item.items.length }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'reason', label: 'Justification' }]} onRowClick={screen.setSelected} rows={mine} searchKeys={['reference', 'department']} /></>}
        {tab === 'Received Materials' && <DataTable columns={[{ key: 'itemId', label: 'Item', render: (line) => state.items.find((item) => item.id === line.itemId)?.name }, { key: 'quantity', label: 'Quantity' }, { key: 'issuedAt', label: 'Issue Date', render: (line) => line.request.issuedAt }, { key: 'reference', label: 'Request', render: (line) => line.request.reference }]} rows={received} />}
      </ScreenFrame>
      {config && <ActionForm config={config} dispatch={dispatch} onClose={() => screen.setForm(null)} state={state} />}
    </>
  );
}

export function ManagerProcurementPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Purchase Requests';
  const [detail, setDetail] = useState(null);
  const formConfig = screen.form?.kind === 'purchase' ? {
    type: 'CREATE_PURCHASE_REQUEST', title: 'Create Purchase Request',
    fields: [
      { name: 'justification', label: 'Justification', type: 'textarea', required: true, wide: true },
      { name: 'items', label: 'Requested items', type: 'item-lines', items: state.items, withPrice: true, required: true, wide: true },
    ],
    transform: (values) => ({ ...values, id: makeId('pr'), reference: makeReference('PR', state.purchaseRequests), requesterId: 'inventory_manager', createdAt: today(), items: values.items.map((line) => ({ ...line, quantity: Number(line.quantity), estimatedUnitPrice: Number(line.unitPrice) })) }),
  } : screen.form?.kind === 'consultation' ? {
    type: 'CREATE_CONSULTATION', title: 'Create Supplier Consultation',
    fields: [
      { name: 'purchaseRequestId', label: 'Approved purchase request', type: 'select', required: true, options: state.purchaseRequests.filter((item) => item.status === 'approved').map((item) => ({ value: item.id, label: `${item.reference} · ${money(item.estimatedTotal)}` })) },
      { name: 'supplierIds', label: 'Suppliers', type: 'multi-select', required: true, options: state.suppliers.map((item) => ({ value: item.id, label: item.name })) },
      { name: 'deadline', label: 'Response deadline', type: 'date', required: true },
    ],
    transform: (values) => ({ ...values, id: makeId('con'), reference: makeReference('SC', state.consultations), createdAt: today() }),
  } : screen.form?.kind === 'order' ? {
    type: 'CREATE_PURCHASE_ORDER', title: 'Create Purchase Order',
    fields: [
      { name: 'offerId', label: 'Selected offer', type: 'select', required: true, options: state.offers.filter((offer) => offer.status === 'selected' && !state.purchaseOrders.some((order) => order.offerId === offer.id)).map((offer) => ({ value: offer.id, label: `${offer.reference} · ${money(offer.totalAmount)}` })) },
      { name: 'expectedDeliveryDate', label: 'Expected delivery', type: 'date', required: true },
    ],
    transform: (values) => ({ ...values, id: makeId('po'), reference: makeReference('PO', state.purchaseOrders), createdAt: today() }),
  } : screen.form?.kind === 'receive' ? {
    type: 'RECEIVE_ORDER', title: `Receive ${screen.form.order.reference}`,
    fields: [
      { name: 'date', label: 'Delivery date', type: 'date', required: true, defaultValue: today() },
      { name: 'items', label: 'Received quantities', type: 'item-lines', items: screen.form.order.items.map((line) => ({ ...state.items.find((item) => item.id === line.itemId), quantity: line.quantity - line.receivedQuantity })), required: true, wide: true },
    ],
    transform: (values) => ({ ...values, orderId: screen.form.order.id, movementBase: { id: makeId('movement'), reference: makeReference('MV', state.movements) }, items: values.items.map((line) => ({ itemId: line.itemId, quantity: Number(line.quantity) })) }),
  } : null;
  const actionConfig = formConfig;
  return (
    <>
      <ScreenFrame activeTab={tab} action={tab === 'Purchase Requests' ? <Button onClick={() => screen.setForm({ kind: 'purchase' })}>Create Purchase Request</Button> : tab === 'Supplier Consultations' ? <Button onClick={() => screen.setForm({ kind: 'consultation' })}>Create Consultation</Button> : tab === 'Orders & Deliveries' && state.offers.some((offer) => offer.status === 'selected' && !state.purchaseOrders.some((order) => order.offerId === offer.id)) ? <Button onClick={() => screen.setForm({ kind: 'order' })}>Create Order from Selected Offer</Button> : null} description="Prepare purchasing requests, supplier consultations and purchase orders." onTab={screen.setTab} tabs={['Purchase Requests', 'Supplier Consultations', 'Orders & Deliveries']} title="Procurement Management">
        {tab === 'Purchase Requests' && <DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'createdAt', label: 'Created' }, { key: 'items', label: 'Items', render: (item) => item.items.length }, { key: 'estimatedTotal', label: 'Estimated total', render: (item) => money(item.estimatedTotal) }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'actions', label: 'Details', render: (item) => <Button onClick={() => setDetail(item)} variant="quiet">View</Button> }]} rows={state.purchaseRequests} />}
        {tab === 'Supplier Consultations' && <DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'purchaseRequestId', label: 'Purchase Request', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.reference }, { key: 'supplierIds', label: 'Suppliers', render: (item) => item.supplierIds.map((id) => state.suppliers.find((supplier) => supplier.id === id)?.name).join(', ') }, { key: 'deadline', label: 'Deadline' }, { key: 'offers', label: 'Offers', render: (item) => state.offers.filter((offer) => offer.consultationId === item.id).length }, { key: 'status', label: 'Status', render: (item) => status(item.status) }]} rows={state.consultations} />}
        {tab === 'Orders & Deliveries' && <DataTable columns={[{ key: 'reference', label: 'Order' }, { key: 'supplierId', label: 'Supplier', render: (item) => state.suppliers.find((supplier) => supplier.id === item.supplierId)?.name }, { key: 'createdAt', label: 'Order date' }, { key: 'expectedDeliveryDate', label: 'Expected delivery' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'actions', label: 'Action', render: (item) => <Button disabled={item.status === 'received'} onClick={() => screen.setForm({ kind: 'receive', order: item })}>Receive Goods</Button> }]} rows={state.purchaseOrders} />}
      </ScreenFrame>
      {actionConfig && <ActionForm config={actionConfig} dispatch={dispatch} onClose={() => screen.setForm(null)} state={state} />}
      {detail && <RecordDrawer fields={[['Reference', detail.reference], ['Justification', detail.justification], ['Estimated total', money(detail.estimatedTotal)], ['Status', detail.status], ['Decision', detail.decisionNote], ['Items', detail.items.map((line) => `${state.items.find((item) => item.id === line.itemId)?.name}: ${line.quantity}`).join(', ')] ]} onClose={() => setDetail(null)} record={detail} title="Purchase request details" />}
    </>
  );
}

export function PrincipalProcurementPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Purchase Requests';
  const [rejecting, setRejecting] = useState(null);
  const pending = state.purchaseRequests.filter((item) => item.status === 'pending_approval');
  return (
    <>
      <ScreenFrame activeTab={tab} description="Review purchasing requests, authorize consultations and compare supplier offers." onTab={screen.setTab} tabs={['Purchase Requests', 'Consultations', 'Supplier Offers', 'Budget']} title="Procurement Approval">
        {tab === 'Purchase Requests' && <><StatCards items={[{ label: 'Pending', value: pending.length }, { label: 'Approved', value: state.purchaseRequests.filter((item) => item.status === 'approved').length }, { label: 'Rejected', value: state.purchaseRequests.filter((item) => item.status === 'rejected').length }]} /><DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'createdAt', label: 'Date' }, { key: 'estimatedTotal', label: 'Estimated total', render: (item) => money(item.estimatedTotal) }, { key: 'justification', label: 'Justification' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Decision', render: (item) => item.status === 'pending_approval' ? <div className="action-row"><ConfirmAction message={`Approve ${item.reference} for supplier consultation?`} onConfirm={() => dispatch({ type: 'DECIDE_PURCHASE_REQUEST', payload: { requestId: item.id, status: 'approved', decidedAt: today() } })}>Approve</ConfirmAction><Button onClick={() => setRejecting(item)} variant="danger">Reject</Button></div> : item.decisionNote || '—' }]} rows={state.purchaseRequests} /></>}
        {tab === 'Consultations' && <DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'purchaseRequestId', label: 'Purchase Request', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.reference }, { key: 'supplierIds', label: 'Suppliers', render: (item) => item.supplierIds.map((id) => state.suppliers.find((supplier) => supplier.id === id)?.name).join(', ') }, { key: 'deadline', label: 'Deadline' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Action', render: (item) => item.status === 'pending_authorization' ? <ConfirmAction message={`Open ${item.reference} to its selected suppliers?`} onConfirm={() => dispatch({ type: 'AUTHORIZE_CONSULTATION', payload: { consultationId: item.id } })}>Authorize</ConfirmAction> : '—' }]} rows={state.consultations} />}
        {tab === 'Supplier Offers' && <DataTable columns={[{ key: 'reference', label: 'Offer' }, { key: 'consultationId', label: 'Consultation', render: (item) => state.consultations.find((record) => record.id === item.consultationId)?.reference }, { key: 'supplierId', label: 'Supplier', render: (item) => state.suppliers.find((record) => record.id === item.supplierId)?.name }, { key: 'totalAmount', label: 'Total', render: (item) => money(item.totalAmount) }, { key: 'deliveryDays', label: 'Delivery days' }, { key: 'warranty', label: 'Warranty' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Action', render: (item) => <ConfirmAction disabled={item.status === 'selected'} message={`Select ${item.reference}? Competing offers will be marked not selected.`} onConfirm={() => dispatch({ type: 'SELECT_OFFER', payload: { offerId: item.id } })}>Select Supplier</ConfirmAction> }]} rows={state.offers} />}
        {tab === 'Budget' && <StatCards items={[{ label: 'Allocated Budget', value: money(1200000) }, { label: 'Recorded Expenditure', value: money(state.purchaseOrders.filter((item) => item.status === 'received').reduce((sum, order) => sum + (state.offers.find((offer) => offer.id === order.offerId)?.totalAmount ?? 0), 0)) }, { label: 'Available Balance', value: money(1200000 - state.purchaseOrders.filter((item) => item.status === 'received').reduce((sum, order) => sum + (state.offers.find((offer) => offer.id === order.offerId)?.totalAmount ?? 0), 0)) }, { label: 'Pending Estimates', value: money(pending.reduce((sum, request) => sum + request.estimatedTotal, 0)) }]} />}
      </ScreenFrame>
      {rejecting && <FormDialog fields={[{ name: 'decisionNote', label: 'Reason for rejection', type: 'textarea', required: true, wide: true }]} onClose={() => setRejecting(null)} onSubmit={(values) => { dispatch({ type: 'DECIDE_PURCHASE_REQUEST', payload: { requestId: rejecting.id, status: 'rejected', decisionNote: values.decisionNote, decidedAt: today() } }); setRejecting(null); }} title={`Reject ${rejecting.reference}`} />}
    </>
  );
}

export function SupplierQuotationsPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Received Requests';
  const [consultation, setConsultation] = useState(null);
  const supplierId = state.currentSupplierId;
  const openConsultations = state.consultations.filter((item) => item.status === 'open' && item.supplierIds.includes(supplierId) && new Date(item.deadline) >= new Date(today()));
  const formConfig = consultation && {
    type: 'SUBMIT_OFFER', title: `Submit Offer · ${consultation.reference}`,
    fields: [
      { name: 'items', label: 'Item prices', type: 'item-lines', items: state.purchaseRequests.find((request) => request.id === consultation.purchaseRequestId)?.items.map((line) => ({ ...state.items.find((item) => item.id === line.itemId), quantity: line.quantity })) ?? [], withPrice: true, required: true, wide: true },
      { name: 'deliveryDays', label: 'Delivery time (days)', type: 'number', min: 1, required: true },
      { name: 'paymentTerms', label: 'Payment terms', required: true },
      { name: 'warranty', label: 'Warranty', required: true },
      { name: 'countryOfOrigin', label: 'Country of origin', required: true },
      { name: 'validityDate', label: 'Offer validity', type: 'date', required: true },
      { name: 'commercialNotes', label: 'Commercial notes', type: 'textarea', wide: true },
    ],
    transform: (values) => ({ ...values, id: makeId('offer'), reference: makeReference('OF', state.offers), consultationId: consultation.id, supplierId, submittedAt: today(), deliveryDays: Number(values.deliveryDays), items: values.items.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), specification: state.items.find((item) => item.id === line.itemId)?.description ?? '' })) }),
  };
  return (
    <>
      <ScreenFrame activeTab={tab} description="Review authorized school quotation requests and manage your commercial offers." onTab={screen.setTab} tabs={['Received Requests', 'My Offers']} title="Supplier Quotations">
        {tab === 'Received Requests' && <DataTable columns={[{ key: 'reference', label: 'Consultation' }, { key: 'purchaseRequestId', label: 'Purchase Request', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.reference }, { key: 'deadline', label: 'Deadline' }, { key: 'items', label: 'Products', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.items.length }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Action', render: (item) => <Button disabled={state.offers.some((offer) => offer.consultationId === item.id && offer.supplierId === supplierId)} onClick={() => setConsultation(item)}>Submit Offer</Button> }]} rows={openConsultations} />}
        {tab === 'My Offers' && <DataTable columns={[{ key: 'reference', label: 'Offer' }, { key: 'consultationId', label: 'Consultation', render: (item) => state.consultations.find((record) => record.id === item.consultationId)?.reference }, { key: 'totalAmount', label: 'Total', render: (item) => money(item.totalAmount) }, { key: 'submittedAt', label: 'Submitted' }, { key: 'validityDate', label: 'Valid until' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }]} rows={state.offers.filter((offer) => offer.supplierId === supplierId)} />}
      </ScreenFrame>
      {consultation && <ActionForm config={formConfig} dispatch={dispatch} onClose={() => setConsultation(null)} state={state} />}
    </>
  );
}

export function TransportationManagementPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Transportation Requests';
  const [detail, setDetail] = useState(null);
  const formConfig = screen.form?.kind === 'vehicle' ? {
    type: screen.form.record ? 'UPDATE_VEHICLE' : 'ADD_VEHICLE', title: screen.form.record ? 'Edit Vehicle' : 'Add Vehicle',
    initialValues: screen.form.record,
    fields: [
      { name: 'registration', label: 'Registration number', required: true },
      { name: 'capacity', label: 'Passenger capacity', type: 'number', min: 1, required: true },
      { name: 'mileage', label: 'Mileage', type: 'number', min: 0, defaultValue: 0 },
      { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['Good', 'Fair', 'Needs service'].map((value) => ({ value, label: value })) },
      { name: 'driverId', label: 'Assigned driver', type: 'select', options: state.actors.filter((actor) => actor.role === 'driver').map((actor) => ({ value: actor.id, label: actor.name })) },
    ],
    transform: (values) => ({ ...values, id: screen.form.record?.id ?? makeId('vehicle'), capacity: Number(values.capacity), mileage: Number(values.mileage) }),
  } : screen.form?.kind === 'route' ? {
    type: screen.form.record ? 'UPDATE_ROUTE' : 'CREATE_ROUTE', title: screen.form.record ? 'Edit Route' : 'Create Route',
    initialValues: screen.form.record ? { ...screen.form.record, stops: screen.form.record.stops.map((stop) => `${stop.name}, ${stop.time}`).join('\n') } : undefined,
    fields: [
      { name: 'name', label: 'Route name', required: true },
      { name: 'stops', label: 'Stops (one per line: stop name, time)', type: 'textarea', required: true, wide: true },
      { name: 'scheduledDeparture', label: 'Scheduled departure', type: 'time', required: true },
      { name: 'scheduledArrival', label: 'Scheduled arrival', type: 'time', required: true },
      { name: 'vehicleId', label: 'Vehicle', type: 'select', required: true, options: state.vehicles.map((item) => ({ value: item.id, label: `${item.registration} · ${item.capacity} seats` })) },
      { name: 'driverId', label: 'Driver', type: 'select', options: state.actors.filter((actor) => actor.role === 'driver').map((actor) => ({ value: actor.id, label: actor.name })) },
      { name: 'studentIds', label: 'Authorized students', type: 'multi-select', wide: true, options: state.students.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName} · ${item.id}` })) },
    ],
    transform: (values) => ({ ...values, id: screen.form.record?.id ?? makeId('route'), reference: screen.form.record?.reference ?? makeReference('RT', state.routes), studentIds: values.studentIds ?? [], stops: values.stops.split('\n').filter(Boolean).map((line) => { const [name, time] = line.split(','); return { name: name.trim(), time: time?.trim() ?? '' }; }) }),
  } : null;
  return (
    <>
      <ScreenFrame activeTab={tab} action={tab === 'Vehicles' ? <Button onClick={() => screen.setForm({ kind: 'vehicle' })}>Add Vehicle</Button> : tab === 'Routes' ? <Button onClick={() => screen.setForm({ kind: 'route' })}>Create Route</Button> : null} description="Manage school transport requests, vehicles, routes and driver reports." onTab={screen.setTab} tabs={['Transportation Requests', 'Vehicles', 'Routes', 'Driver Reports']} title="Transportation Management">
        {tab === 'Transportation Requests' && <DataTable columns={[{ key: 'reference', label: 'Request' }, { key: 'studentId', label: 'Student', render: (item) => { const student = state.students.find((record) => record.id === item.studentId); return student ? `${student.firstName} ${student.lastName}` : item.studentId; } }, { key: 'requestedAt', label: 'Date' }, { key: 'description', label: 'Need' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'actions', label: 'Decision', render: (item) => item.status === 'pending' ? <div className="action-row"><ConfirmAction message={`Approve ${item.reference}?`} onConfirm={() => dispatch({ type: 'DECIDE_TRANSPORT_REQUEST', payload: { requestId: item.id, status: 'approved' } })}>Approve</ConfirmAction><ConfirmAction message={`Reject ${item.reference}?`} onConfirm={() => dispatch({ type: 'DECIDE_TRANSPORT_REQUEST', payload: { requestId: item.id, status: 'rejected' } })} variant="danger">Reject</ConfirmAction></div> : '—' }]} rows={state.transportRequests} />}
        {tab === 'Vehicles' && <><StatCards items={[{ label: 'Vehicles', value: state.vehicles.length }, { label: 'Assigned', value: state.vehicles.filter((item) => item.driverId).length }, { label: 'Available', value: state.vehicles.filter((item) => !item.driverId).length }]} /><DataTable columns={[{ key: 'registration', label: 'Registration' }, { key: 'capacity', label: 'Capacity' }, { key: 'mileage', label: 'Mileage' }, { key: 'condition', label: 'Condition' }, { key: 'driverId', label: 'Assigned Driver', render: (item) => state.actors.find((actor) => actor.id === item.driverId)?.name ?? 'Unassigned' }, { key: 'actions', label: 'Actions', render: (item) => <Button onClick={(event) => { event.stopPropagation(); screen.setForm({ kind: 'vehicle', record: item }); }} variant="quiet">Edit</Button> }]} rows={state.vehicles} onRowClick={setDetail} /></>}
        {tab === 'Routes' && <DataTable columns={[{ key: 'reference', label: 'Route' }, { key: 'name', label: 'Name' }, { key: 'vehicleId', label: 'Vehicle', render: (item) => state.vehicles.find((vehicle) => vehicle.id === item.vehicleId)?.registration }, { key: 'driverId', label: 'Driver', render: (item) => state.actors.find((actor) => actor.id === item.driverId)?.name ?? 'Unassigned' }, { key: 'studentIds', label: 'Students', render: (item) => item.studentIds.length }, { key: 'scheduledDeparture', label: 'Schedule', render: (item) => `${item.scheduledDeparture}–${item.scheduledArrival}` }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'actions', label: 'Actions', render: (item) => <div className="action-row">{item.status === 'draft' && <ConfirmAction message={`Approve route ${item.name}?`} onConfirm={() => dispatch({ type: 'APPROVE_ROUTE', payload: { routeId: item.id, journeyId: makeId('journey'), date: today() } })}>Approve</ConfirmAction>}<Button onClick={(event) => { event.stopPropagation(); screen.setForm({ kind: 'route', record: item }); }} variant="quiet">Edit</Button></div> }]} onRowClick={setDetail} rows={state.routes} />}
        {tab === 'Driver Reports' && <DataTable columns={[{ key: 'reference', label: 'Report' }, { key: 'driverId', label: 'Driver', render: (item) => state.actors.find((actor) => actor.id === item.driverId)?.name }, { key: 'type', label: 'Type', render: (item) => status(item.type) }, { key: 'date', label: 'Date' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'actions', label: 'Actions', render: (item) => item.status !== 'resolved' ? <ConfirmAction message={`Mark report ${item.reference} resolved?`} onConfirm={() => dispatch({ type: 'UPDATE_DRIVER_REPORT', payload: { reportId: item.id, status: 'resolved', administrativeNote: 'Reviewed by school administration.' } })}>Resolve</ConfirmAction> : '—' }]} onRowClick={setDetail} rows={state.driverReports} />}
      </ScreenFrame>
      {formConfig && <ActionForm config={formConfig} dispatch={dispatch} onClose={() => screen.setForm(null)} state={state} />}
      {detail && <RecordDrawer fields={[['Registration', detail.registration], ['Capacity', detail.capacity], ['Mileage', detail.mileage], ['Condition', detail.condition], ['Assigned driver', state.actors.find((actor) => actor.id === detail.driverId)?.name ?? 'Unassigned'], ['Assigned route', state.routes.find((route) => route.vehicleId === detail.id)?.name ?? 'None']]} onClose={() => setDetail(null)} record={detail} title="Vehicle details" />}
      {detail?.reference && <RecordDrawer fields={[['Reference', detail.reference], ['Route', detail.name], ['Stops', detail.stops.map((stop) => `${stop.name} ${stop.time}`).join(' · ')], ['Schedule', `${detail.scheduledDeparture}–${detail.scheduledArrival}`], ['Vehicle', state.vehicles.find((item) => item.id === detail.vehicleId)?.registration], ['Driver', state.actors.find((item) => item.id === detail.driverId)?.name ?? 'Unassigned'], ['Passengers', `${detail.studentIds.length} / ${state.vehicles.find((item) => item.id === detail.vehicleId)?.capacity}`], ['Status', detail.status]]} onClose={() => setDetail(null)} record={detail} title="Route details" actions={<Button onClick={() => { screen.setForm({ kind: 'route', record: detail }); setDetail(null); }} variant="secondary">Edit Route</Button>} />}
    </>
  );
}

export function DriverRoutePage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Authorized Students';
  const actor = state.actors.find((item) => item.id === state.currentActorId);
  const route = state.routes.find((item) => item.driverId === actor.id && item.status === 'approved');
  const vehicle = state.vehicles.find((item) => item.id === route?.vehicleId);
  const journey = state.journeys.find((item) => item.routeId === route?.id && item.driverId === actor.id && item.status !== 'completed');
  const [reportType, setReportType] = useState('');
  const [detail, setDetail] = useState(null);
  const reportConfig = reportType && {
    type: 'REPORT_DRIVER_ISSUE', title: reportType === 'incident' ? 'Report Incident' : 'Report Maintenance',
    fields: [
      { name: 'date', label: 'Date', type: 'date', defaultValue: today(), required: true },
      ...(reportType === 'maintenance' ? [{ name: 'problemType', label: 'Problem type', required: true }, { name: 'requestedIntervention', label: 'Requested intervention', type: 'textarea', required: true, wide: true }] : []),
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
    ],
    transform: (values) => ({ ...values, id: makeId('report'), reference: makeReference('DR', state.driverReports), type: reportType, driverId: actor.id, vehicleId: vehicle?.id ?? null, journeyId: journey?.id ?? null }),
  };
  const startJourney = () => dispatch({ type: 'START_JOURNEY', payload: { journeyId: journey.id, actualDeparture: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } });
  const finishJourney = () => dispatch({ type: 'FINISH_JOURNEY', payload: { journeyId: journey.id, actualArrival: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } });
  return (
    <>
      <PageHeader description="Your approved assignment, passengers and journey controls." title="My Route" />
      {route ? <section className="assignment-grid"><article className="content-card"><h2>Vehicle</h2><p><strong>{vehicle?.registration}</strong> · {vehicle?.capacity} seats</p><p>Condition: {vehicle?.condition}</p></article><article className="content-card"><h2>{route.name}</h2><p>{route.stops.map((stop) => `${stop.name} ${stop.time}`).join(' → ')}</p><p>{route.scheduledDeparture}–{route.scheduledArrival} · {route.studentIds.length} students</p></article></section> : <section className="content-card"><h2>No approved route assigned</h2><p>Contact the principal if you expect a route assignment.</p></section>}
      <div className="action-row journey-controls">{journey?.status === 'scheduled' && <ConfirmAction message="Start the assigned journey now?" onConfirm={startJourney}>Start Journey</ConfirmAction>}{journey?.status === 'in_progress' && <ConfirmAction message="Finish the current journey?" onConfirm={finishJourney}>Finish Journey</ConfirmAction>}<Button onClick={() => setReportType('incident')} variant="secondary">Report Incident</Button><Button onClick={() => setReportType('maintenance')} variant="secondary">Report Maintenance</Button></div>
      <Tabs items={['Authorized Students', 'Journey History']} onChange={screen.setTab} value={tab} />
      {tab === 'Authorized Students' && <DataTable columns={[{ key: 'id', label: 'Student ID' }, { key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' }, { key: 'classId', label: 'Class', render: (item) => state.classes.find((record) => record.id === item.classId)?.name }]} rows={state.students.filter((student) => route?.studentIds.includes(student.id))} />}
      {tab === 'Journey History' && <><DataTable columns={[{ key: 'date', label: 'Date' }, { key: 'routeId', label: 'Route', render: (item) => state.routes.find((record) => record.id === item.routeId)?.name }, { key: 'scheduledDeparture', label: 'Scheduled departure' }, { key: 'actualDeparture', label: 'Actual departure' }, { key: 'actualArrival', label: 'Actual arrival' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }]} rows={state.journeys.filter((item) => item.driverId === actor.id)} /><h2>My reports</h2><DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'type', label: 'Type', render: (item) => status(item.type) }, { key: 'date', label: 'Date' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'administrativeNote', label: 'Administrative note' }]} onRowClick={setDetail} rows={state.driverReports.filter((item) => item.driverId === actor.id)} /></>}
      {reportConfig && <ActionForm config={reportConfig} dispatch={dispatch} onClose={() => setReportType('')} state={state} />}
      {detail && <RecordDrawer fields={[['Reference', detail.reference], ['Type', detail.type], ['Description', detail.description], ['Status', detail.status], ['Administrative note', detail.administrativeNote]]} onClose={() => setDetail(null)} record={detail} title="Report details" />}
    </>
  );
}

export const screenByFeature = {
  dashboard: DashboardPage,
  school: SchoolRecordsPage,
  inventory: InventoryStockPage,
  'supply-requests': SupplyRequestsPage,
  procurement: ManagerProcurementPage,
  'principal-procurement': PrincipalProcurementPage,
  suppliers: SupplierQuotationsPage,
  transportation: TransportationManagementPage,
  'driver-route': DriverRoutePage,
};


