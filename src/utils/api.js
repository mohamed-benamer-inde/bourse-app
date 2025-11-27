import axios from 'axios';

const getBaseUrl = () => {
    // Fallback to the known Render URL if env var fails
    let url = import.meta.env.VITE_API_URL || 'https://bourse-api-a31m.onrender.com';
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    return `${url}/api`;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 30000, // 30 seconds timeout for Render cold starts
    headers: {
        'Content-Type': 'application/json'
    }
});

console.log('API Base URL configured as:', getBaseUrl());

// Interceptor to add token to requests
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    error => Promise.reject(error)
);

export default api;
