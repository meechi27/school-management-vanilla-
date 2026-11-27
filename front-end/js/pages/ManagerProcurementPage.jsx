import { useState } from 'react';

import {
  ActionForm,
  Button,
  DataTable,
  RecordDrawer,
  ScreenFrame,
  StatusBadge,
  formatMoney,
  useScreen,
} from '../components/ui.jsx';

export function ManagerProcurementPage() {
  const screen = useScreen();
  const { state, sendAction } = screen;
  const tab = screen.tab || 'Purchase Requests';
  const [detail, setDetail] = useState(null);

  let formConfig = null;
  if (screen.form?.kind === 'purchase') {
    formConfig = {
      type: 'CREATE_PURCHASE_REQUEST',
      title: 'Create Purchase Request',
      fields: [
        { name: 'justification', label: 'Justification', type: 'textarea', required: true, wide: true },
        {
          name: 'items',
          label: 'Requested items',
          type: 'item-lines',
          items: state.items,
          withPrice: true,
          required: true,
          wide: true,
        },
      ],
      transform: (values) => ({
        ...values,
        items: values.items.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
          estimatedUnitPrice: Number(line.unitPrice),
        })),
      }),
    };
  } else if (screen.form?.kind === 'consultation') {
    formConfig = {
      type: 'CREATE_CONSULTATION',
      title: 'Create Supplier Consultation',
      fields: [
        {
          name: 'purchaseRequestId',
          label: 'Approved purchase request',
          type: 'select',
          required: true,
          options: state.purchaseRequests
            .filter((item) => item.status === 'approved')
            .map((item) => ({
              value: item.id,
              label: `${item.reference} · ${formatMoney(item.estimatedTotal)}`,
            })),
        },
        {
          name: 'supplierIds',
          label: 'Suppliers',
          type: 'multi-select',
          required: true,
          options: state.suppliers.map((item) => ({ value: item.id, label: item.name })),
        },
        { name: 'deadline', label: 'Response deadline', type: 'date', required: true },
      ],
    };
  } else if (screen.form?.kind === 'order') {
    formConfig = {
      type: 'CREATE_PURCHASE_ORDER',
      title: 'Create Purchase Order',
      fields: [
        {
          name: 'offerId',
          label: 'Selected offer',
          type: 'select',
          required: true,
          options: state.offers
            .filter(
              (offer) =>
                offer.status === 'selected' &&
                !state.purchaseOrders.some((order) => order.offerId === offer.id),
            )
            .map((offer) => ({
              value: offer.id,
              label: `${offer.reference} · ${formatMoney(offer.totalAmount)}`,
            })),
        },
        { name: 'expectedDeliveryDate', label: 'Expected delivery', type: 'date', required: true },
      ],
    };
  } else if (screen.form?.kind === 'receive') {
    formConfig = {
      type: 'RECEIVE_ORDER',
      title: `Receive ${screen.form.order.reference}`,
      fields: [
        { name: 'date', label: 'Delivery date', type: 'date', required: true },
        {
          name: 'items',
          label: 'Received quantities',
          type: 'item-lines',
          items: screen.form.order.items.map((line) => ({
            ...state.items.find((item) => item.id === line.itemId),
            quantity: line.quantity - line.receivedQuantity,
          })),
          required: true,
          wide: true,
        },
      ],
      transform: (values) => ({
        ...values,
        orderId: screen.form.order.id,
        items: values.items.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
        })),
      }),
    };
  }

  const hasOrderableOffer = state.offers.some(
    (offer) =>
      offer.status === 'selected' &&
      !state.purchaseOrders.some((order) => order.offerId === offer.id),
  );

  let headerAction = null;
  if (tab === 'Purchase Requests') {
    headerAction = (
      <Button onClick={() => screen.setForm({ kind: 'purchase' })}>
        Create Purchase Request
      </Button>
    );
  } else if (tab === 'Supplier Consultations') {
    headerAction = (
      <Button onClick={() => screen.setForm({ kind: 'consultation' })}>
        Create Consultation
      </Button>
    );
  } else if (tab === 'Orders & Deliveries' && hasOrderableOffer) {
    headerAction = (
      <Button onClick={() => screen.setForm({ kind: 'order' })}>
        Create Order from Selected Offer
      </Button>
    );
  }

  return (
    <>
      <ScreenFrame
        activeTab={tab}
        action={headerAction}
        description="Prepare purchasing requests, supplier consultations and purchase orders."
        onTab={screen.setTab}
        tabs={['Purchase Requests', 'Supplier Consultations', 'Orders & Deliveries']}
        title="Procurement Management"
      >
        {tab === 'Purchase Requests' && (
          <DataTable
            columns={[
              { key: 'reference', label: 'Reference' },
              { key: 'createdAt', label: 'Created' },
              { key: 'items', label: 'Items', render: (item) => item.items.length },
              {
                key: 'estimatedTotal',
                label: 'Estimated total',
                render: (item) => formatMoney(item.estimatedTotal),
              },
              {
                key: 'status',
                label: 'Status',
                render: (item) => <StatusBadge value={item.status} />,
              },
              {
                key: 'actions',
                label: 'Details',
                render: (item) => (
                  <Button onClick={() => setDetail(item)} variant="quiet">
                    View
                  </Button>
                ),
              },
            ]}
            rows={state.purchaseRequests}
          />
        )}

        {tab === 'Supplier Consultations' && (
          <DataTable
            columns={[
              { key: 'reference', label: 'Reference' },
              {
                key: 'purchaseRequestId',
                label: 'Purchase Request',
                render: (item) =>
                  state.purchaseRequests.find((req) => req.id === item.purchaseRequestId)?.reference,
              },
              {
                key: 'supplierIds',
                label: 'Suppliers',
                render: (item) =>
                  item.supplierIds
                    .map((id) => state.suppliers.find((supplier) => supplier.id === id)?.name)
                    .join(', '),
              },
              { key: 'deadline', label: 'Deadline' },
              {
                key: 'offers',
                label: 'Offers',
                render: (item) =>
                  state.offers.filter((offer) => offer.consultationId === item.id).length,
              },
              {
                key: 'status',
                label: 'Status',
                render: (item) => <StatusBadge value={item.status} />,
              },
            ]}
            rows={state.consultations}
          />
        )}

        {tab === 'Orders & Deliveries' && (
          <DataTable
            columns={[
              { key: 'reference', label: 'Order' },
              {
                key: 'supplierId',
                label: 'Supplier',
                render: (item) =>
                  state.suppliers.find((supplier) => supplier.id === item.supplierId)?.name,
              },
              { key: 'createdAt', label: 'Order date' },
              { key: 'expectedDeliveryDate', label: 'Expected delivery' },
              {
                key: 'status',
                label: 'Status',
                render: (item) => <StatusBadge value={item.status} />,
              },
              {
                key: 'actions',
                label: 'Action',
                render: (item) => (
                  <Button
                    disabled={item.status === 'received'}
                    onClick={() => screen.setForm({ kind: 'receive', order: item })}
                  >
                    Receive Goods
                  </Button>
                ),
              },
            ]}
            rows={state.purchaseOrders}
          />
        )}
      </ScreenFrame>

      {formConfig && (
        <ActionForm
          config={formConfig}
          onClose={() => screen.setForm(null)}
          sendAction={sendAction}
          state={state}
        />
      )}

      {detail && (
        <RecordDrawer
          fields={[
            ['Reference', detail.reference],
            ['Justification', detail.justification],
            ['Estimated total', formatMoney(detail.estimatedTotal)],
            ['Status', detail.status],
            ['Decision', detail.decisionNote],
            [
              'Items',
              detail.items
                .map(
                  (line) =>
                    `${state.items.find((item) => item.id === line.itemId)?.name}: ${line.quantity}`,
                )
                .join(', '),
            ],
          ]}
          onClose={() => setDetail(null)}
          record={detail}
          title="Purchase request details"
        />
      )}
    </>
  );
}
