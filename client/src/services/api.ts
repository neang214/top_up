import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                localStorage.removeItem('token');
            } else if ( status === 500) {
                console.error('ServerFehler aufgetreren.')
            }
        } else if (error.request) {
            console.error('Keine Antwort vom Server erhalten (Netzwerkfehler).');
        }

        return Promise.reject(error);
    }
)