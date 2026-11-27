import { failure, success } from '../reducer-utils.js';

export function transportationReducer(state, action) {
  const payload = action.payload ?? {};

  switch (action.type) {
    case 'ADD_VEHICLE':
      if (!payload.registration?.trim() || Number(payload.capacity) <= 0) return failure(state, 'Enter a registration and passenger capacity.');
      if (state.vehicles.some((vehicle) => vehicle.registration.toLowerCase() === payload.registration.toLowerCase())) return failure(state, 'That vehicle registration is already in use.');
      return success({ ...state, vehicles: [...state.vehicles, payload] }, 'Vehicle added.');
    case 'UPDATE_VEHICLE':
      return success({ ...state, vehicles: state.vehicles.map((vehicle) => vehicle.id === payload.id ? { ...vehicle, ...payload } : vehicle) }, 'Vehicle updated.');
    case 'CREATE_ROUTE': {
      const vehicle = state.vehicles.find((record) => record.id === payload.vehicleId);
      if (!vehicle || !payload.name?.trim()) return failure(state, 'Select a vehicle and enter a route name.');
      if (payload.studentIds.length > vehicle.capacity) return failure(state, `This route exceeds vehicle capacity (${vehicle.capacity}).`);
      return success({ ...state, routes: [{ ...payload, status: 'draft' }, ...state.routes] }, 'Route created as a draft.');
    }
    case 'UPDATE_ROUTE': {
      const vehicle = state.vehicles.find((record) => record.id === payload.vehicleId);
      if (vehicle && payload.studentIds.length > vehicle.capacity) return failure(state, `This route exceeds vehicle capacity (${vehicle.capacity}).`);
      return success({ ...state, routes: state.routes.map((route) => route.id === payload.id ? { ...route, ...payload } : route) }, 'Route updated.');
    }
    case 'APPROVE_ROUTE': {
      const route = state.routes.find((record) => record.id === payload.routeId);
      if (!route) return failure(state, 'The route could not be found.');
      const journeys = state.journeys.some((journey) => journey.routeId === route.id)
        ? state.journeys
        : [...state.journeys, {
          id: payload.journeyId,
          routeId: route.id,
          vehicleId: route.vehicleId,
          driverId: route.driverId,
          date: payload.date,
          scheduledDeparture: route.scheduledDeparture,
          scheduledArrival: route.scheduledArrival,
          actualDeparture: null,
          actualArrival: null,
          status: 'scheduled',
        }];
      return success({
        ...state,
        routes: state.routes.map((record) => record.id === route.id ? { ...record, status: 'approved' } : record),
        journeys,
      }, 'Route approved and assigned.');
    }
    case 'DECIDE_TRANSPORT_REQUEST':
      if (!state.transportRequests.some((request) => request.id === payload.requestId && request.status === 'pending') || !['approved', 'rejected'].includes(payload.status)) {
        return failure(state, 'This transportation request has already been decided or is invalid.');
      }
      return success({ ...state, transportRequests: state.transportRequests.map((request) => request.id === payload.requestId ? { ...request, status: payload.status } : request) }, `Transport request ${payload.status}.`);
    case 'START_JOURNEY': {
      const journey = state.journeys.find((record) => record.id === payload.journeyId);
      if (!journey || journey.status !== 'scheduled' || journey.driverId !== state.currentActorId) return failure(state, 'Only your scheduled journey can be started.');
      const route = state.routes.find((record) => record.id === journey.routeId && record.status === 'approved' && record.driverId === state.currentActorId);
      if (!route) return failure(state, 'You are not assigned to this approved route.');
      return success({ ...state, journeys: state.journeys.map((record) => record.id === journey.id ? { ...record, status: 'in_progress', actualDeparture: payload.actualDeparture } : record) }, 'Journey started.');
    }
    case 'FINISH_JOURNEY': {
      const journey = state.journeys.find((record) => record.id === payload.journeyId);
      if (!journey || journey.status !== 'in_progress' || journey.driverId !== state.currentActorId) return failure(state, 'Only your in-progress journey can be finished.');
      return success({ ...state, journeys: state.journeys.map((record) => record.id === journey.id ? { ...record, status: 'completed', actualArrival: payload.actualArrival } : record) }, 'Journey completed.');
    }
    case 'REPORT_DRIVER_ISSUE':
      if (!payload.description?.trim()) return failure(state, 'Add a description before submitting the report.');
      if (payload.driverId !== state.currentActorId || !state.routes.some((route) => route.driverId === payload.driverId && route.vehicleId === payload.vehicleId && route.status === 'approved')) return failure(state, 'You can only report an issue for your assigned approved route.');
      return success({ ...state, driverReports: [{ ...payload, status: 'open', administrativeNote: '' }, ...state.driverReports] }, `${payload.type === 'incident' ? 'Incident' : 'Maintenance'} report submitted.`);
    case 'UPDATE_DRIVER_REPORT':
      return success({ ...state, driverReports: state.driverReports.map((report) => report.id === payload.reportId ? { ...report, status: payload.status, administrativeNote: payload.administrativeNote ?? report.administrativeNote } : report) }, 'Driver report updated.');
    default:
      return undefined;
  }
}
