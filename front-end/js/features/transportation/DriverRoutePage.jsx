import { useState } from 'react';

import {
  Button, ConfirmAction, DataTable, PageHeader, RecordDrawer, Tabs,
} from '../../components/ui.jsx';
import { ActionForm, useScreen } from '../shared/ScreenParts.jsx';
import { status } from '../shared/presentation.jsx';

export function DriverRoutePage() {
  const screen = useScreen();
  const { state, sendAction } = screen;
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
      ...(reportType === 'maintenance' ? [{ name: 'problemType', label: 'Problem type', required: true }, { name: 'requestedIntervention', label: 'Requested intervention', type: 'textarea', required: true, wide: true }] : []),
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
    ],
    transform: (values) => ({ ...values, type: reportType, vehicleId: vehicle?.id ?? null, journeyId: journey?.id ?? null }),
  };
  const startJourney = () => sendAction({ type: 'START_JOURNEY', payload: { journeyId: journey.id } });
  const finishJourney = () => sendAction({ type: 'FINISH_JOURNEY', payload: { journeyId: journey.id } });
  return (
    <>
      <PageHeader description="Your approved assignment, passengers and journey controls." title="My Route" />
      {route ? <section className="assignment-grid"><article className="content-card"><h2>Vehicle</h2><p><strong>{vehicle?.registration}</strong> · {vehicle?.capacity} seats</p><p>Condition: {vehicle?.condition}</p></article><article className="content-card"><h2>{route.name}</h2><p>{route.stops.map((stop) => `${stop.name} ${stop.time}`).join(' → ')}</p><p>{route.scheduledDeparture}–{route.scheduledArrival} · {route.studentIds.length} students</p></article></section> : <section className="content-card"><h2>No approved route assigned</h2><p>Contact the principal if you expect a route assignment.</p></section>}
      <div className="action-row journey-controls">{journey?.status === 'scheduled' && <ConfirmAction message="Start the assigned journey now?" onConfirm={startJourney}>Start Journey</ConfirmAction>}{journey?.status === 'in_progress' && <ConfirmAction message="Finish the current journey?" onConfirm={finishJourney}>Finish Journey</ConfirmAction>}<Button onClick={() => setReportType('incident')} variant="secondary">Report Incident</Button><Button onClick={() => setReportType('maintenance')} variant="secondary">Report Maintenance</Button></div>
      <Tabs items={['Authorized Students', 'Journey History']} onChange={screen.setTab} value={tab} />
      {tab === 'Authorized Students' && <DataTable columns={[{ key: 'id', label: 'Student ID' }, { key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' }, { key: 'classId', label: 'Class', render: (item) => state.classes.find((record) => record.id === item.classId)?.name }]} rows={state.students.filter((student) => route?.studentIds.includes(student.id))} />}
      {tab === 'Journey History' && <><DataTable columns={[{ key: 'date', label: 'Date' }, { key: 'routeId', label: 'Route', render: (item) => state.routes.find((record) => record.id === item.routeId)?.name }, { key: 'scheduledDeparture', label: 'Scheduled departure' }, { key: 'actualDeparture', label: 'Actual departure' }, { key: 'actualArrival', label: 'Actual arrival' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }]} rows={state.journeys.filter((item) => item.driverId === actor.id)} /><h2>My reports</h2><DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'type', label: 'Type', render: (item) => status(item.type) }, { key: 'date', label: 'Date' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'administrativeNote', label: 'Administrative note' }]} onRowClick={setDetail} rows={state.driverReports.filter((item) => item.driverId === actor.id)} /></>}
      {reportConfig && <ActionForm config={reportConfig} sendAction={sendAction} onClose={() => setReportType('')} state={state} />}
      {detail && <RecordDrawer fields={[['Reference', detail.reference], ['Type', detail.type], ['Description', detail.description], ['Status', detail.status], ['Administrative note', detail.administrativeNote]]} onClose={() => setDetail(null)} record={detail} title="Report details" />}
    </>
  );
}
