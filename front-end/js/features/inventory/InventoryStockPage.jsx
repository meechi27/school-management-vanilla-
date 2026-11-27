import { useState } from 'react';

import {
  Button,
  ConfirmAction,
  DataTable,
  RecordDrawer,
  StatCards,
  StatusBadge,
} from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { status } from '../shared/presentation.jsx';

export function InventoryStockPage() {
  const page = useScreen();
  const { state, sendAction } = page;
  const activeTab = page.tab || 'Items';
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  const stockItemOptions = state.items.map((stockItem) => ({
    value: stockItem.id,
    label: `${stockItem.name} (${stockItem.quantity} ${stockItem.unit})`,
  }));
  const supplierOptions = state.suppliers.map((supplier) => ({
    value: supplier.id,
    label: supplier.name,
  }));

  const stockItemFields = [
    { name: 'code', label: 'Item code', required: true },
    { name: 'name', label: 'Item name', required: true },
    { name: 'description', label: 'Description', type: 'textarea', wide: true },
    { name: 'category', label: 'Category', required: true },
    { name: 'unit', label: 'Unit', required: true },
    {
      name: 'supplierId',
      label: 'Supplier',
      type: 'select',
      options: supplierOptions,
    },
    { name: 'countryOfOrigin', label: 'Country of origin' },
    {
      name: 'quantity',
      label: 'Available quantity',
      type: 'number',
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'minimumStock',
      label: 'Minimum stock',
      type: 'number',
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'purchasePrice',
      label: 'Purchase price',
      type: 'number',
      min: 0,
      defaultValue: 0,
    },
    { name: 'location', label: 'Storage location', required: true },
  ];

  const movementFields = [
    {
      name: 'itemId',
      label: 'Item',
      type: 'select',
      options: stockItemOptions,
      required: true,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
    },
    ...(page.form?.type === 'issue'
      ? [{ name: 'recipient', label: 'Recipient', required: true }]
      : []),
    ...(page.form?.type === 'transfer'
      ? [
        { name: 'source', label: 'From location', required: true },
        { name: 'destination', label: 'To location', required: true },
      ]
      : []),
    ...(page.form?.type === 'delivery'
      ? [{ name: 'source', label: 'Supplier / source' }]
      : []),
    ...(page.form?.type === 'return'
      ? [
        { name: 'recipient', label: 'Original recipient', required: true },
        { name: 'condition', label: 'Condition', required: true },
      ]
      : []),
  ];

  const activeFormFields = page.form?.kind === 'item'
    ? stockItemFields
    : page.form?.kind === 'movement'
      ? movementFields
      : null;

  const formConfig = activeFormFields && {
    type: page.form.kind === 'item'
      ? page.form.record
        ? 'UPDATE_ITEM'
        : 'ADD_ITEM'
      : 'RECORD_STOCK_MOVEMENT',
    title: page.form.kind === 'item'
      ? page.form.record
        ? 'Edit inventory item'
        : 'Add inventory item'
      : `${page.form.type[0].toUpperCase()}${page.form.type.slice(1)} stock`,
    fields: activeFormFields,
    initialValues: page.form.kind === 'item' ? page.form.record : undefined,
    transform: (formValues) => {
      if (page.form.kind === 'item') {
        return {
          ...formValues,
          ...(page.form.record ? { id: page.form.record.id } : {}),
          quantity: Number(formValues.quantity),
          minimumStock: Number(formValues.minimumStock),
          purchasePrice: Number(formValues.purchasePrice),
        };
      }

      return {
        ...formValues,
        type: page.form.type,
      };
    },
  };

  const requestColumns = [
    { key: 'reference', label: 'Request' },
    { key: 'requesterName', label: 'Requester' },
    { key: 'department', label: 'Department' },
    { key: 'createdAt', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (supplyRequest) => status(supplyRequest.status),
    },
    {
      key: 'action',
      label: 'Action',
      render: (supplyRequest) => (
        <ConfirmAction
          disabled={supplyRequest.status !== 'pending'}
          message={`Issue all requested materials for ${supplyRequest.reference}? Stock will be checked before anything is changed.`}
          onConfirm={() => sendAction({
            type: 'FULFILL_SUPPLY_REQUEST',
            payload: {
              requestId: supplyRequest.id,
            },
          })}
        >
          Issue Materials
        </ConfirmAction>
      ),
    },
  ];

  const stockItemColumns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Item' },
    { key: 'category', label: 'Category' },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (stockItem) => (
        <>
          {stockItem.quantity} {stockItem.unit}{' '}
          {stockItem.quantity < stockItem.minimumStock && (
            <StatusBadge value="Low stock" />
          )}
        </>
      ),
    },
    { key: 'minimumStock', label: 'Minimum' },
    { key: 'location', label: 'Location' },
    {
      key: 'actions',
      label: 'Actions',
      render: (stockItem) => (
        <Button
          onClick={(event) => {
            event.stopPropagation();
            setSelectedStockItem(stockItem);
          }}
          variant="quiet"
        >
          Details
        </Button>
      ),
    },
  ];

  const stockMovementColumns = [
    { key: 'reference', label: 'Reference' },
    { key: 'date', label: 'Date' },
    {
      key: 'itemId',
      label: 'Item',
      render: (stockMovement) =>
        state.items.find((stockItem) => stockItem.id === stockMovement.itemId)?.name,
    },
    {
      key: 'type',
      label: 'Type',
      render: (stockMovement) => status(stockMovement.type),
    },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'recipient',
      label: 'Source / Recipient',
      render: (stockMovement) =>
        stockMovement.recipient ??
        stockMovement.source ??
        stockMovement.destination ??
        '—',
    },
  ];

  return (
    <>
      <ScreenFrame
        activeTab={activeTab}
        action={
          activeTab === 'Items' && (
            <Button onClick={() => page.setForm({ kind: 'item' })}>
              Add Item
            </Button>
          )
        }
        description="Manage school items, stock movements and departmental requests."
        onTab={page.setTab}
        tabs={['Items', 'Stock Movements', 'Department Requests']}
        title="Inventory & Stock"
      >
        <StatCards
          items={[
            { label: 'Inventory Items', value: state.items.length },
            {
              label: 'Low Stock',
              value: state.items.filter(
                (stockItem) => stockItem.quantity < stockItem.minimumStock,
              ).length,
            },
            {
              label: 'Available Units',
              value: state.items.reduce(
                (total, stockItem) => total + stockItem.quantity,
                0,
              ),
            },
          ]}
        />

        {activeTab === 'Items' && (
          <DataTable
            columns={stockItemColumns}
            onRowClick={setSelectedStockItem}
            rows={state.items}
            searchKeys={['name', 'code', 'category']}
          />
        )}

        {activeTab === 'Stock Movements' && (
          <>
            <div className="action-row">
              {['delivery', 'issue', 'transfer', 'return'].map((movementType) => (
                <Button
                  key={movementType}
                  onClick={() => page.setForm({ kind: 'movement', type: movementType })}
                  variant="secondary"
                >
                  {movementType[0].toUpperCase()}{movementType.slice(1)}
                </Button>
              ))}
            </div>
            <DataTable
              columns={stockMovementColumns}
              rows={[...state.movements].reverse()}
            />
          </>
        )}

        {activeTab === 'Department Requests' && (
          <DataTable
            columns={requestColumns}
            rows={state.supplyRequests}
            searchKeys={['reference', 'requesterName', 'department']}
          />
        )}
      </ScreenFrame>

      {formConfig && (
        <ActionForm
          config={formConfig}
          sendAction={sendAction}
          onClose={() => page.setForm(null)}
          state={state}
        />
      )}

      {page.selected && (
        <RecordDrawer
          fields={[
            ['Reference', page.selected.reference],
            ['Requester', page.selected.requesterName],
            ['Department', page.selected.department],
            ['Justification', page.selected.reason],
            [
              'Items',
              page.selected.items
                .map((requestedItem) => {
                  const stockItem = state.items.find(
                    (item) => item.id === requestedItem.itemId,
                  );
                  return `${stockItem?.name}: ${requestedItem.quantity}`;
                })
                .join(', '),
            ],
            ['Submitted', page.selected.createdAt],
            ['Status', page.selected.status],
            ['Issued', page.selected.issuedAt],
          ]}
          onClose={() => page.setSelected(null)}
          record={page.selected}
          title="Supply request details"
        />
      )}

      {selectedStockItem && (
        <RecordDrawer
          fields={[
            ['Code', selectedStockItem.code],
            ['Name', selectedStockItem.name],
            ['Category', selectedStockItem.category],
            ['Description', selectedStockItem.description],
            [
              'Available quantity',
              `${selectedStockItem.quantity} ${selectedStockItem.unit}`,
            ],
            ['Minimum stock', selectedStockItem.minimumStock],
            [
              'Status',
              selectedStockItem.quantity < selectedStockItem.minimumStock
                ? 'Low stock'
                : 'In stock',
            ],
            ['Storage location', selectedStockItem.location],
            [
              'Recent movements',
              state.movements
                .filter((stockMovement) => stockMovement.itemId === selectedStockItem.id)
                .slice(-4)
                .map(
                  (stockMovement) =>
                    `${stockMovement.date}: ${stockMovement.type} ${stockMovement.quantity}`,
                )
                .join('; ') || 'No movements',
            ],
          ]}
          onClose={() => setSelectedStockItem(null)}
          record={selectedStockItem}
          title="Item details"
          actions={(
            <Button
              onClick={() => {
                page.setForm({ kind: 'item', record: selectedStockItem });
                setSelectedStockItem(null);
              }}
              variant="secondary"
            >
              Edit Item
            </Button>
          )}
        />
      )}
    </>
  );
}
