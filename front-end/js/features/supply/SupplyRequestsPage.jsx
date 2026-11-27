import { Button, DataTable, StatCards } from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { makeId, makeReference, today } from '../shared/record-utils.js';
import { status } from '../shared/presentation.jsx';

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
