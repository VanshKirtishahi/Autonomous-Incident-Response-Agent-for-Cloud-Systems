import axios from 'axios';

export const API = axios.create({ baseURL: '/api' });
export const SOCKET_URL = window.location.origin;