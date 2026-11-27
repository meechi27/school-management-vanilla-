import { createSeedData } from '../data/seed-data.js';

export async function getSchoolData() {
  const {
    version,
    currentActorId,
    currentSupplierId,
    notifications,
    ...schoolData
  } = createSeedData();

  return { data: schoolData };
}

export async function sendAction() {
  throw new Error(
    'Mock mode does not apply business actions. Connect the backend to save changes.',
  );
}
