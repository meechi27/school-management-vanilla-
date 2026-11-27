import { useState } from 'react';

import {
  Button, ConfirmAction, DataTable, RecordDrawer, StatCards,
} from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { makeId, makeReference, today } from '../shared/record-utils.js';
import { status } from '../shared/presentation.jsx';

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
