import axios from 'axios';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    return `${url}/api`;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

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
