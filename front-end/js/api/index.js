import * as httpApi from './httpApi.js';
import * as mockApi from './mockApi.js';

const api = import.meta.env.VITE_API_MODE === 'http' ? httpApi : mockApi;

export const getSchoolData = api.getSchoolData;
export const sendAction = api.sendAction;
