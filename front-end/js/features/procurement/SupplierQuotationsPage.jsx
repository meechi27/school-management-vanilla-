import { useState } from 'react';

import { Button, DataTable } from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { money, status } from '../shared/presentation.jsx';

export function SupplierQuotationsPage() {
  const screen = useScreen();
  const { state, sendAction } = screen;
  const tab = screen.tab || 'Received Requests';
  const [consultation, setConsultation] = useState(null);
  const supplierId = state.currentSupplierId;
  const openConsultations = state.consultations.filter((item) => item.status === 'open' && item.supplierIds.includes(supplierId));
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
    transform: (values) => ({ ...values, consultationId: consultation.id, supplierId, deliveryDays: Number(values.deliveryDays), items: values.items.map((line) => ({ itemId: line.itemId, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })) }),
  };
  return (
    <>
      <ScreenFrame activeTab={tab} description="Review authorized school quotation requests and manage your commercial offers." onTab={screen.setTab} tabs={['Received Requests', 'My Offers']} title="Supplier Quotations">
        {tab === 'Received Requests' && <DataTable columns={[{ key: 'reference', label: 'Consultation' }, { key: 'purchaseRequestId', label: 'Purchase Request', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.reference }, { key: 'deadline', label: 'Deadline' }, { key: 'items', label: 'Products', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.items.length }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Action', render: (item) => <Button disabled={state.offers.some((offer) => offer.consultationId === item.id && offer.supplierId === supplierId)} onClick={() => setConsultation(item)}>Submit Offer</Button> }]} rows={openConsultations} />}
        {tab === 'My Offers' && <DataTable columns={[{ key: 'reference', label: 'Offer' }, { key: 'consultationId', label: 'Consultation', render: (item) => state.consultations.find((record) => record.id === item.consultationId)?.reference }, { key: 'totalAmount', label: 'Total', render: (item) => money(item.totalAmount) }, { key: 'submittedAt', label: 'Submitted' }, { key: 'validityDate', label: 'Valid until' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }]} rows={state.offers.filter((offer) => offer.supplierId === supplierId)} />}
      </ScreenFrame>
      {consultation && <ActionForm config={formConfig} sendAction={sendAction} onClose={() => setConsultation(null)} state={state} />}
    </>
  );
}
