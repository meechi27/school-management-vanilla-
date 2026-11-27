export const notify = (state, type, message) => ({
  ...state,
  notifications: [
    { id: `${Date.now()}-${Math.random()}`, type, message },
    ...state.notifications,
  ].slice(0, 5),
});

export const failure = (state, message) => notify(state, 'error', message);
export const success = (state, message) => notify(state, 'success', message);
export const validPositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
export const findItem = (state, itemId) => state.items.find((item) => item.id === itemId);

export function createMovement(state, { itemId, type, quantity, date, ...details }) {
  return {
    id: details.id,
    reference: details.reference,
    itemId,
    type,
    quantity: Number(quantity),
    date,
    ...details,
  };
}
