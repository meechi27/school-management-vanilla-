import { useState } from 'react';

import {
  Button, ConfirmAction, DataTable, FormDialog, StatCards,
} from '../../components/ui.jsx';
import { ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';
import { today } from '../shared/record-utils.js';
import { money, status } from '../shared/presentation.jsx';

const allocatedBudget = 1200000;

export function PrincipalProcurementPage() {
  const screen = useScreen();
  const { state, dispatch } = screen;
  const tab = screen.tab || 'Purchase Requests';
  const [rejecting, setRejecting] = useState(null);
  const pending = state.purchaseRequests.filter((item) => item.status === 'pending_approval');
  const receivedOrders = state.purchaseOrders.filter((item) => item.status === 'received');
  const expenditure = receivedOrders.reduce(
    (sum, order) => sum + (state.offers.find((offer) => offer.id === order.offerId)?.totalAmount ?? 0),
    0,
  );
  return (
    <>
      <ScreenFrame activeTab={tab} description="Review purchasing requests, authorize consultations and compare supplier offers." onTab={screen.setTab} tabs={['Purchase Requests', 'Consultations', 'Supplier Offers', 'Budget']} title="Procurement Approval">
        {tab === 'Purchase Requests' && <><StatCards items={[{ label: 'Pending', value: pending.length }, { label: 'Approved', value: state.purchaseRequests.filter((item) => item.status === 'approved').length }, { label: 'Rejected', value: state.purchaseRequests.filter((item) => item.status === 'rejected').length }]} /><DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'createdAt', label: 'Date' }, { key: 'estimatedTotal', label: 'Estimated total', render: (item) => money(item.estimatedTotal) }, { key: 'justification', label: 'Justification' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Decision', render: (item) => item.status === 'pending_approval' ? <div className="action-row"><ConfirmAction message={`Approve ${item.reference} for supplier consultation?`} onConfirm={() => dispatch({ type: 'DECIDE_PURCHASE_REQUEST', payload: { requestId: item.id, status: 'approved', decidedAt: today() } })}>Approve</ConfirmAction><Button onClick={() => setRejecting(item)} variant="danger">Reject</Button></div> : item.decisionNote || '—' }]} rows={state.purchaseRequests} /></>}
        {tab === 'Consultations' && <DataTable columns={[{ key: 'reference', label: 'Reference' }, { key: 'purchaseRequestId', label: 'Purchase Request', render: (item) => state.purchaseRequests.find((request) => request.id === item.purchaseRequestId)?.reference }, { key: 'supplierIds', label: 'Suppliers', render: (item) => item.supplierIds.map((id) => state.suppliers.find((supplier) => supplier.id === id)?.name).join(', ') }, { key: 'deadline', label: 'Deadline' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Action', render: (item) => item.status === 'pending_authorization' ? <ConfirmAction message={`Open ${item.reference} to its selected suppliers?`} onConfirm={() => dispatch({ type: 'AUTHORIZE_CONSULTATION', payload: { consultationId: item.id } })}>Authorize</ConfirmAction> : '—' }]} rows={state.consultations} />}
        {tab === 'Supplier Offers' && <DataTable columns={[{ key: 'reference', label: 'Offer' }, { key: 'consultationId', label: 'Consultation', render: (item) => state.consultations.find((record) => record.id === item.consultationId)?.reference }, { key: 'supplierId', label: 'Supplier', render: (item) => state.suppliers.find((record) => record.id === item.supplierId)?.name }, { key: 'totalAmount', label: 'Total', render: (item) => money(item.totalAmount) }, { key: 'deliveryDays', label: 'Delivery days' }, { key: 'warranty', label: 'Warranty' }, { key: 'status', label: 'Status', render: (item) => status(item.status) }, { key: 'action', label: 'Action', render: (item) => <ConfirmAction disabled={item.status === 'selected'} message={`Select ${item.reference}? Competing offers will be marked not selected.`} onConfirm={() => dispatch({ type: 'SELECT_OFFER', payload: { offerId: item.id } })}>Select Supplier</ConfirmAction> }]} rows={state.offers} />}
        {tab === 'Budget' && <StatCards items={[{ label: 'Allocated Budget', value: money(allocatedBudget) }, { label: 'Recorded Expenditure', value: money(expenditure) }, { label: 'Available Balance', value: money(allocatedBudget - expenditure) }, { label: 'Pending Estimates', value: money(pending.reduce((sum, request) => sum + request.estimatedTotal, 0)) }]} />}
      </ScreenFrame>
      {rejecting && <FormDialog fields={[{ name: 'decisionNote', label: 'Reason for rejection', type: 'textarea', required: true, wide: true }]} onClose={() => setRejecting(null)} onSubmit={(values) => { dispatch({ type: 'DECIDE_PURCHASE_REQUEST', payload: { requestId: rejecting.id, status: 'rejected', decisionNote: values.decisionNote, decidedAt: today() } }); setRejecting(null); }} title={`Reject ${rejecting.reference}`} />}
    </>
  );
}
