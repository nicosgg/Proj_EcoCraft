import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '../types/data_type';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const TOKEN_KEY = 'ecocraft_token';

/** Instance Axios global: semua request ke EcoCraft API lewat sini. */
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Sisipkan token JWT dari Local Storage ke setiap request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token kedaluwarsa atau tidak valid: beri tahu AuthContext agar pengguna logout
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new Event('ecocraft:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/** Pesan error yang ramah dari respons API ({ message }) atau dari kegagalan jaringan. */
export const getErrorMessage = (error: unknown, fallback = 'Terjadi kesalahan.'): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (!error.response) return `Tidak dapat terhubung ke server API (${API_BASE_URL}). Pastikan server sudah dijalankan.`;
  }
  return fallback;
};

/** Pesan error per field dari respons 400 ({ errors: { field: pesan } }). */
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError<ApiErrorBody>(error)) return error.response?.data?.errors ?? {};
  return {};
};

export default axiosClient;
