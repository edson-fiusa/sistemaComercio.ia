import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://sistemacomercio-ia.onrender.com';

export const api = axios.create({
  baseURL: API_URL
});

export function fmt(v) {
  return Number(v || 0).toFixed(2);
}

export function fmt3(v) {
  return Number(v || 0).toFixed(3);
}