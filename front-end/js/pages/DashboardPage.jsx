import { Link } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import {
  PageHeader,
  StatCards,
  formatMoney,
} from '../components/ui.jsx';
import { buttonVariants } from '../components/ui/button.jsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.jsx';

const quickLinksByRole = {
  principal: [
    ['School Records', '/principal/school'],
    ['Procurement Approval', '/principal/procurement'],
    ['Transportation Management', '/principal/transportation'],
  ],
  inventory_manager: [
    ['Inventory & Stock', '/inventory/stock'],
    ['Procurement Management', '/inventory/procurement'],
  ],
  teacher: [['Supply Requests', '/teacher/requests']],
  supplier: [['Supplier Quotations', '/supplier/quotations']],
  driver: [['My Route', '/driver/route']],
};

function getDashboardStats(state, currentUser) {
  const pendingSupplyRequests = state.supplyRequests.filter(
    (supplyRequest) => supplyRequest.status === 'pending',
  ).length;
  const lowStockItems = state.items.filter(
    (stockItem) => stockItem.quantity < stockItem.minimumStock,
  ).length;
  const pendingPurchaseRequests = state.purchaseRequests.filter(
    (purchaseRequest) => purchaseRequest.status === 'pending_approval',
  ).length;

  if (currentUser.role === 'principal') {
    return [
      ['Total Students', state.students.length],
      ['Pending Approvals', pendingPurchaseRequests],
      ['Low Stock Items', lowStockItems],
      ['Total Vehicles', state.vehicles.length],
    ];
  }

  if (currentUser.role === 'inventory_manager') {
    return [
      ['Total Items', state.items.length],
      ['Low Stock', lowStockItems],
      ['Department Requests', pendingSupplyRequests],
      ['Purchase Requests', pendingPurchaseRequests],
    ];
  }

  if (currentUser.role === 'teacher') {
    const mySupplyRequests = state.supplyRequests.filter(
      (supplyRequest) => supplyRequest.requesterId === currentUser.id,
    );
    const fulfilledRequests = mySupplyRequests.filter(
      (supplyRequest) => supplyRequest.status === 'fulfilled',
    );
    const receivedItemCount = fulfilledRequests.reduce(
      (total, supplyRequest) => total + supplyRequest.items.length,
      0,
    );

    return [
      ['My Requests', mySupplyRequests.length],
      [
        'Pending',
        mySupplyRequests.filter(
          (supplyRequest) => supplyRequest.status === 'pending',
        ).length,
      ],
      ['Fulfilled', fulfilledRequests.length],
      ['Received Materials', receivedItemCount],
    ];
  }

  if (currentUser.role === 'supplier') {
    const myOffers = state.offers.filter(
      (offer) => offer.supplierId === state.currentSupplierId,
    );
    const requestsForMe = state.consultations.filter(
      (consultation) =>
        consultation.status === 'open' &&
        consultation.supplierIds.includes(state.currentSupplierId),
    );
    const offersForMyRequests = requestsForMe.filter(
      (consultation) =>
        !myOffers.some((offer) => offer.consultationId === consultation.id),
    );

    return [
      ['New Requests', requestsForMe.length],
      ['Submitted Offers', myOffers.length],
      [
        'Selected Offers',
        myOffers.filter((offer) => offer.status === 'selected').length,
      ],
      ['Pending Responses', offersForMyRequests.length],
    ];
  }

  const assignedRoute = state.routes.find(
    (route) =>
      route.driverId === currentUser.id && route.status === 'approved',
  );
  const nextJourney = state.journeys.find(
    (journey) =>
      journey.routeId === assignedRoute?.id &&
      journey.driverId === currentUser.id &&
      journey.status !== 'completed',
  );
  const assignedVehicle = state.vehicles.find(
    (vehicle) => vehicle.id === assignedRoute?.vehicleId,
  );
  const openReports = state.driverReports.filter(
    (report) =>
      report.driverId === currentUser.id && report.status !== 'resolved',
  ).length;

  return [
    ['Assigned Vehicle', assignedVehicle?.registration ?? '—'],
    ['Assigned Route', assignedRoute?.name ?? '—'],
    ['Next Journey', nextJourney?.date ?? '—'],
    ['Open Reports', openReports],
  ];
}

function getDashboardSections(state, currentUser) {
  if (currentUser.role === 'principal') {
    return [
      [
        'Pending purchase approvals',
        state.purchaseRequests
          .filter((purchaseRequest) => purchaseRequest.status === 'pending_approval')
          .map(
            (purchaseRequest) =>
              `${purchaseRequest.reference} · ${formatMoney(purchaseRequest.estimatedTotal)}`,
          ),
      ],
      [
        'Inventory warnings',
        state.items
          .filter((stockItem) => stockItem.quantity < stockItem.minimumStock)
          .map((stockItem) => `${stockItem.name} · ${stockItem.quantity} left`),
      ],
      [
        'Transportation alerts',
        state.driverReports
          .filter((report) => report.status !== 'resolved')
          .map(
            (report) =>
              `${report.reference} · ${report.type}: ${report.description}`,
          ),
      ],
      [
        'Recent school activity',
        state.movements
          .slice(-4)
          .reverse()
          .map((movement) => {
            const stockItem = state.items.find(
              (item) => item.id === movement.itemId,
            );
            return `${movement.date} · ${movement.type} ${stockItem?.name ?? 'item'}`;
          }),
      ],
    ];
  }

  if (currentUser.role === 'inventory_manager') {
    return [
      [
        'Recent stock movements',
        state.movements
          .slice(-4)
          .reverse()
          .map((movement) => {
            const stockItem = state.items.find(
              (item) => item.id === movement.itemId,
            );
            return `${movement.date} · ${movement.type} ${movement.quantity} ${stockItem?.name ?? 'item'}`;
          }),
      ],
      [
        'Department requests',
        state.supplyRequests
          .filter((supplyRequest) => supplyRequest.status === 'pending')
          .map(
            (supplyRequest) =>
              `${supplyRequest.reference} · ${supplyRequest.department}`,
          ),
      ],
      [
        'Low-stock items',
        state.items
          .filter((stockItem) => stockItem.quantity < stockItem.minimumStock)
          .map(
            (stockItem) =>
              `${stockItem.name} · ${stockItem.quantity}/${stockItem.minimumStock}`,
          ),
      ],
      [
        'Purchase requests',
        state.purchaseRequests
          .slice(0, 4)
          .map(
            (purchaseRequest) =>
              `${purchaseRequest.reference} · ${purchaseRequest.status}`,
          ),
      ],
    ];
  }

  if (currentUser.role === 'teacher') {
    const mySupplyRequests = state.supplyRequests.filter(
      (supplyRequest) => supplyRequest.requesterId === currentUser.id,
    );
    const myFulfilledRequests = mySupplyRequests.filter(
      (supplyRequest) => supplyRequest.status === 'fulfilled',
    );

    return [
      [
        'Recent requests',
        mySupplyRequests
          .slice(0, 5)
          .map(
            (supplyRequest) =>
              `${supplyRequest.reference} · ${supplyRequest.department} · ${supplyRequest.status}`,
          ),
      ],
      [
        'Received materials',
        myFulfilledRequests.flatMap((supplyRequest) =>
          supplyRequest.items.map((requestedItem) => {
            const stockItem = state.items.find(
              (item) => item.id === requestedItem.itemId,
            );
            return `${stockItem?.name} · ${requestedItem.quantity} · ${supplyRequest.issuedAt}`;
          }),
        ),
      ],
    ];
  }

  if (currentUser.role === 'supplier') {
    const requestsForMe = state.consultations.filter(
      (consultation) =>
        consultation.status === 'open' &&
        consultation.supplierIds.includes(state.currentSupplierId),
    );
    const myOffers = state.offers.filter(
      (offer) => offer.supplierId === state.currentSupplierId,
    );

    return [
      [
        'Incoming quotation requests',
        requestsForMe.map(
          (consultation) =>
            `${consultation.reference} · deadline ${consultation.deadline}`,
        ),
      ],
      [
        'Recent offers',
        myOffers.map(
          (offer) =>
            `${offer.reference} · ${formatMoney(offer.totalAmount)} · ${offer.status}`,
        ),
      ],
    ];
  }

  const assignedRoute = state.routes.find(
    (route) =>
      route.driverId === currentUser.id && route.status === 'approved',
  );
  const assignedVehicle = state.vehicles.find(
    (vehicle) => vehicle.id === assignedRoute?.vehicleId,
  );
  const myJourneys = state.journeys.filter(
    (journey) => journey.driverId === currentUser.id,
  );
  const myReports = state.driverReports.filter(
    (report) => report.driverId === currentUser.id,
  );

  return [
    [
      'Today’s transport schedule',
      assignedRoute
        ? [`${assignedRoute.name} · ${assignedRoute.scheduledDeparture}–${assignedRoute.scheduledArrival}`]
        : [],
    ],
    [
      'Vehicle and passengers',
      assignedRoute
        ? [
          `${assignedVehicle?.registration} · ${assignedRoute.studentIds.length}/${assignedVehicle?.capacity} passengers`,
        ]
        : [],
    ],
    [
      'Journey history',
      myJourneys
        .slice(0, 4)
        .map((journey) => `${journey.date} · ${journey.status}`),
    ],
    [
      'Recent reports',
      myReports
        .slice(0, 4)
        .map((report) => `${report.reference} · ${report.status}`),
    ],
  ];
}

export function DashboardPage() {
  const { state } = useApp();
  const currentUser = state.actors.find(
    (user) => user.id === state.currentActorId,
  );
  const summaryCards = getDashboardStats(state, currentUser);
  const dashboardSections = getDashboardSections(state, currentUser);
  const quickLinks = quickLinksByRole[currentUser.role];

  return (
    <>
      <PageHeader
        description={`Welcome back, ${currentUser.name}. Here is the latest activity for your workspace.`}
        title="Dashboard"
      />
      <StatCards
        items={summaryCards.map(([label, value]) => ({ label, value }))}
      />
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickLinks.map(([label, href]) => (
            <Link
              className={buttonVariants({ variant: 'outline' })}
              key={href}
              to={href}
            >
              {label}
            </Link>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {dashboardSections.map(([heading, rows]) => (
          <Card key={heading}>
            <CardHeader>
              <CardTitle>{heading}</CardTitle>
            </CardHeader>
            <CardContent>
              {rows.length ? (
                <ul className="space-y-2 text-sm">
                  {rows.map((row, index) => (
                    <li className="border-b border-border/60 pb-2 last:border-b-0 last:pb-0" key={`${heading}-${index}`}>
                      {row}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to review right now.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
