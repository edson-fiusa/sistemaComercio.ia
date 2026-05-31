import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
});

export function fmt(v) {
  return Number(v || 0).toFixed(2);
}

export function fmt3(v) {
  return Number(v || 0).toFixed(3);
}