import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000' });
export const fmt = value => Number(value || 0).toFixed(2);
export const fmt3 = value => Number(value || 0).toFixed(3);

export default api;