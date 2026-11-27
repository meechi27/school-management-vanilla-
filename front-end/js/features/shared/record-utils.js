export const today = () => new Date().toISOString().slice(0, 10);
export const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
export const makeReference = (prefix, list) => `${prefix}-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
