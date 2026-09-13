import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000
});

export function fmt(v) {
  return Number(v || 0).toFixed(2);
}

export function fmt3(v) {
  return Number(v || 0).toFixed(3);
}