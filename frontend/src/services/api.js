import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
});

// Intercepteur de requête : injecte le token JWT sur chaque appel.
// Centraliser ici évite de répéter le header Authorization dans tous
// les composants — et surtout d'oublier de le mettre quelque part.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur de réponse : un 401 signifie token expiré ou invalide.
// On purge la session et on renvoie vers le login, sinon l'utilisateur
// reste bloqué sur une interface qui échoue silencieusement.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;