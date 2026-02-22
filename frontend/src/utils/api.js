import axios from 'axios';

// In production, this will use the Render URL. Locally, it defaults to /api
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = axios.create({ 
    baseURL: `${backendUrl}/api` 
});

export const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;