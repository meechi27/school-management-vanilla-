import { useState } from 'react';

import {
  Button, ConfirmAction, DataTable, RecordDrawer, StatCards, StatusBadge,
} from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { makeId, makeReference, today } from '../shared/record-utils.js';
import { status } from '../shared/presentation.jsx';

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
