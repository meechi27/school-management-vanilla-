import { Button, DataTable, StatCards } from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { status } from '../shared/presentation.jsx';

export function SupplyRequestsPage() {
  const page = useScreen();
  const { state, sendAction } = page;
  const activeTab = page.tab || 'My Requests';

  const mySupplyRequests = state.supplyRequests.filter(
    (supplyRequest) => supplyRequest.requesterId === 'teacher',
  );

  const supplyRequestForm = page.form && {
    type: 'CREATE_SUPPLY_REQUEST',
    title: 'New Supply Request',
    fields: [
      { name: 'department', label: 'Department', required: true },
      {
        name: 'reason',
        label: 'Justification',
        type: 'textarea',
        wide: true,
        required: true,
      },
      {
        name: 'items',
        label: 'Requested items',
        type: 'item-lines',
        items: state.items,
        wide: true,
        required: true,
      },
    ],
    transform: (formValues) => ({
      department: formValues.department,
      reason: formValues.reason,
      items: formValues.items.map((requestedItem) => ({
        itemId: requestedItem.itemId,
        quantity: Number(requestedItem.quantity),
      })),
    }),
  };

  const receivedMaterials = mySupplyRequests
    .filter((supplyRequest) => supplyRequest.status === 'fulfilled')
    .flatMap((supplyRequest) =>
      supplyRequest.items.map((requestedItem) => ({
        ...requestedItem,
        id: `${supplyRequest.id}-${requestedItem.itemId}`,
        supplyRequest,
      })),
    );

  const supplyRequestColumns = [
    { key: 'reference', label: 'Reference' },
    { key: 'createdAt', label: 'Date' },
    {
      key: 'items',
      label: 'Items',
      render: (supplyRequest) => supplyRequest.items.length,
    },
    {
      key: 'status',
      label: 'Status',
      render: (supplyRequest) => status(supplyRequest.status),
    },
    { key: 'reason', label: 'Justification' },
  ];

  const receivedMaterialColumns = [
    {
      key: 'itemId',
      label: 'Item',
      render: (requestedItem) =>
        state.items.find((stockItem) => stockItem.id === requestedItem.itemId)?.name,
    },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'issuedAt',
      label: 'Issue Date',
      render: (requestedItem) => requestedItem.supplyRequest.issuedAt,
    },
    {
      key: 'reference',
      label: 'Request',
      render: (requestedItem) => requestedItem.supplyRequest.reference,
    },
  ];

  return (
    <>
      <ScreenFrame
        activeTab={activeTab}
        action={
          activeTab === 'My Requests' && (
            <Button onClick={() => page.setForm(true)}>New Request</Button>
          )
        }
        description="Request school materials and review completed deliveries."
        onTab={page.setTab}
        tabs={['My Requests', 'Received Materials']}
        title="Supply Requests"
      >
        {activeTab === 'My Requests' && (
          <>
            <StatCards
              items={[
                { label: 'Total Requests', value: mySupplyRequests.length },
                {
                  label: 'Pending',
                  value: mySupplyRequests.filter(
                    (supplyRequest) => supplyRequest.status === 'pending',
                  ).length,
                },
                {
                  label: 'Fulfilled',
                  value: mySupplyRequests.filter(
                    (supplyRequest) => supplyRequest.status === 'fulfilled',
                  ).length,
                },
              ]}
            />
            <DataTable
              columns={supplyRequestColumns}
              onRowClick={page.setSelected}
              rows={mySupplyRequests}
              searchKeys={['reference', 'department']}
            />
          </>
        )}

        {activeTab === 'Received Materials' && (
          <DataTable columns={receivedMaterialColumns} rows={receivedMaterials} />
        )}
      </ScreenFrame>

      {supplyRequestForm && (
        <ActionForm
          config={supplyRequestForm}
          sendAction={sendAction}
          onClose={() => page.setForm(null)}
          state={state}
        />
      )}
    </>
  );
}
