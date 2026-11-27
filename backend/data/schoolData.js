export const actors = [
  {
    id: 'principal',
    role: 'principal',
    name: 'Amira Benali',
    title: 'School Principal',
    description: 'Oversee school operations, staff, and student outcomes.',
    email: 'amira.benali@example.test',
  },
  {
    id: 'inventory_manager',
    role: 'inventory_manager',
    name: 'Yacine Haddad',
    title: 'Inventory Manager',
    description: 'Track school supplies, stock levels, and purchase requests.',
    email: 'yacine.haddad@example.test',
  },
  {
    id: 'teacher',
    role: 'teacher',
    name: 'Nadia Karim',
    title: 'Teacher / Department',
    description: 'Request and receive school supplies for your department.',
    email: 'nadia.karim@example.test',
  },
  {
    id: 'supplier',
    role: 'supplier',
    name: 'Demo Supplier',
    title: 'External Supplier',
    description: 'Review authorized quotation requests and submit offers.',
    email: 'supplier@example.test',
  },
  {
    id: 'driver',
    role: 'driver',
    name: 'Samir Bensaid',
    title: 'Driver',
    description: 'View assigned routes and record journeys and reports.',
    email: 'samir.bensaid@example.test',
  },
];

export const suppliers = [
  {
    id: 'supplier-1',
    name: 'Atlas School Supplies',
    contactPerson: 'Lina Merabet',
    email: 'lina@atlas.example.test',
    phone: '+213 555 010 201',
    address: 'Oran, Algeria',
  },
  {
    id: 'supplier-2',
    name: 'Northstar Learning',
    contactPerson: 'Karim Saadi',
    email: 'karim@northstar.example.test',
    phone: '+213 555 010 202',
    address: 'Algiers, Algeria',
  },
  {
    id: 'supplier-3',
    name: 'Cedar Office Goods',
    contactPerson: 'Meriem Ziani',
    email: 'meriem@cedar.example.test',
    phone: '+213 555 010 203',
    address: 'Constantine, Algeria',
  },
];

export function createSchoolData() {
  const classes = [
    { id: 'class-1', name: '7A', academicYear: '2026–2027' },
    { id: 'class-2', name: '8B', academicYear: '2026–2027' },
    { id: 'class-3', name: '9A', academicYear: '2026–2027' },
  ];
  const students = [
    ['ST-26001', 'Lyes', 'Brahimi', 'class-1'],
    ['ST-26002', 'Maya', 'Cherif', 'class-1'],
    ['ST-26003', 'Anis', 'Mokdad', 'class-1'],
    ['ST-26004', 'Yasmine', 'Tahar', 'class-1'],
    ['ST-26005', 'Rayan', 'Khelifi', 'class-2'],
    ['ST-26006', 'Ines', 'Bouzid', 'class-2'],
    ['ST-26007', 'Amine', 'Saidi', 'class-2'],
    ['ST-26008', 'Lina', 'Belkacem', 'class-2'],
    ['ST-26009', 'Nour', 'Mansouri', 'class-3'],
    ['ST-26010', 'Sofiane', 'Rahmani', 'class-3'],
    ['ST-26011', 'Aya', 'Boudiaf', 'class-3'],
    ['ST-26012', 'Walid', 'Hammadi', 'class-3'],
  ].map(([id, firstName, lastName, classId], index) => ({
    id,
    firstName,
    lastName,
    classId,
    academicYear: '2026–2027',
    guardianName: `Guardian ${index + 1}`,
    guardianPhone: `+213 555 02${String(index + 1).padStart(2, '0')} 100`,
  }));
  const items = [
    ['item-1', 'ST-100', 'A4 Copy Paper', 'Paper', 'ream', 12, 20, 520, 'Store A'],
    ['item-2', 'ST-101', 'Blue Ballpoint Pens', 'Stationery', 'box', 42, 15, 320, 'Store A'],
    ['item-3', 'ST-102', 'Graph Notebooks', 'Stationery', 'piece', 55, 20, 180, 'Store B'],
    ['item-4', 'ST-103', 'Whiteboard Markers', 'Classroom', 'pack', 8, 12, 760, 'Store A'],
    ['item-5', 'ST-104', 'Student Desks', 'Furniture', 'piece', 24, 5, 12500, 'Warehouse'],
    ['item-6', 'ST-105', 'Printer Toner', 'Technology', 'cartridge', 4, 6, 4800, 'Store B'],
    ['item-7', 'ST-106', 'Science Goggles', 'Laboratory', 'piece', 32, 10, 950, 'Lab Store'],
    ['item-8', 'ST-107', 'Hand Soap', 'Cleaning', 'bottle', 18, 8, 410, 'Store A'],
  ].map(([id, code, name, category, unit, quantity, minimumStock, purchasePrice, location], index) => ({
    id, code, name, category, unit, quantity, minimumStock, purchasePrice, location,
    description: `${name} for school use.`,
    supplierId: suppliers[index % suppliers.length].id,
    countryOfOrigin: 'Algeria',
  }));
  return {
    academicYear: '2026–2027',
    actors,
    suppliers,
    classes,
    students,
    items,
    supplyRequests: [
      {
        id: 'sreq-1', reference: 'SR-2026-001', requesterId: 'teacher',
        requesterName: actors[2].name, department: 'Science', createdAt: '2026-11-18',
        reason: 'Prepare practical science lessons.', status: 'pending', issuedAt: null,
        items: [{ itemId: 'item-7', quantity: 6 }, { itemId: 'item-1', quantity: 4 }],
      },
      {
        id: 'sreq-2', reference: 'SR-2026-002', requesterId: 'teacher',
        requesterName: actors[2].name, department: 'Administration', createdAt: '2026-11-20',
        reason: 'Restock the department office.', status: 'pending', issuedAt: null,
        items: [{ itemId: 'item-2', quantity: 3 }],
      },
    ],
    movements: [
      { id: 'mov-1', reference: 'MV-2026-001', itemId: 'item-1', type: 'delivery', quantity: 20, date: '2026-11-12', source: 'Atlas School Supplies' },
      { id: 'mov-2', reference: 'MV-2026-002', itemId: 'item-2', type: 'issue', quantity: 5, date: '2026-11-16', recipient: 'Science Department' },
      { id: 'mov-3', reference: 'MV-2026-003', itemId: 'item-3', type: 'transfer', quantity: 8, date: '2026-11-17', source: 'Store A', destination: 'Store B' },
      { id: 'mov-4', reference: 'MV-2026-004', itemId: 'item-8', type: 'return', quantity: 2, date: '2026-11-19', recipient: 'Cleaning Team' },
    ],
    purchaseRequests: [
      {
        id: 'pr-1', reference: 'PR-2026-001', requesterId: 'inventory_manager',
        createdAt: '2026-11-19', justification: 'Replenish low stock before the winter term.',
        items: [{ itemId: 'item-4', quantity: 30, estimatedUnitPrice: 740 }],
        estimatedTotal: 22200, status: 'pending_approval', decisionNote: '', decidedAt: null,
      },
      {
        id: 'pr-2', reference: 'PR-2026-002', requesterId: 'inventory_manager',
        createdAt: '2026-11-12', justification: 'Replace worn classroom supplies.',
        items: [{ itemId: 'item-1', quantity: 100, estimatedUnitPrice: 510 }],
        estimatedTotal: 51000, status: 'approved', decisionNote: 'Approved for quotation.', decidedAt: '2026-11-14',
      },
    ],
    consultations: [
      {
        id: 'con-1', reference: 'SC-2026-001', purchaseRequestId: 'pr-2',
        supplierIds: suppliers.map((supplier) => supplier.id), createdAt: '2026-11-15',
        deadline: '2026-12-15', status: 'open',
      },
    ],
    offers: [
      {
        id: 'offer-1', reference: 'OF-2026-001', consultationId: 'con-1',
        supplierId: suppliers[0].id, items: [{ itemId: 'item-1', unitPrice: 500, specification: '80 gsm white A4 paper' }],
        totalAmount: 50000, deliveryDays: 7, paymentTerms: 'Net 30 days',
        warranty: '12 months', countryOfOrigin: 'Algeria', validityDate: '2026-12-20',
        submittedAt: '2026-11-18', status: 'selected',
      },
    ],
    purchaseOrders: [
      {
        id: 'po-1', reference: 'PO-2026-001', purchaseRequestId: 'pr-2',
        offerId: 'offer-1', supplierId: suppliers[0].id, createdAt: '2026-11-19',
        expectedDeliveryDate: '2026-12-10', status: 'ordered',
        items: [{ itemId: 'item-1', quantity: 100, receivedQuantity: 0, unitPrice: 500 }],
      },
    ],
    vehicles: [
      { id: 'vehicle-1', registration: '16-123-45', capacity: 18, mileage: 58200, condition: 'Good', driverId: 'driver' },
      { id: 'vehicle-2', registration: '31-678-90', capacity: 24, mileage: 71300, condition: 'Fair', driverId: null },
    ],
    transportRequests: [
      { id: 'tr-1', reference: 'TR-2026-001', studentId: 'ST-26001', requestedAt: '2026-11-20', description: 'Transport requested for the morning route.', status: 'pending' },
    ],
    routes: [
      {
        id: 'route-1', reference: 'RT-2026-001', name: 'North District AM',
        vehicleId: 'vehicle-1', driverId: 'driver',
        stops: [{ name: 'Central Library', time: '07:25' }, { name: 'North Avenue', time: '07:45' }],
        scheduledDeparture: '07:15', scheduledArrival: '08:00',
        studentIds: students.slice(0, 8).map((student) => student.id), status: 'approved',
      },
      {
        id: 'route-2', reference: 'RT-2026-002', name: 'West District PM',
        vehicleId: 'vehicle-2', driverId: null,
        stops: [{ name: 'West Market', time: '15:30' }], scheduledDeparture: '15:15',
        scheduledArrival: '16:00', studentIds: students.slice(8).map((student) => student.id), status: 'draft',
      },
    ],
    journeys: [
      {
        id: 'journey-1', routeId: 'route-1', vehicleId: 'vehicle-1',
        driverId: 'driver', date: '2026-11-26', scheduledDeparture: '07:15',
        scheduledArrival: '08:00', actualDeparture: null, actualArrival: null,
        status: 'scheduled',
      },
    ],
    driverReports: [],
  };
}
