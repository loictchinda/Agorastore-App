import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [chargement, setChargement] = useState(true);

    // Au montage, on restaure la session depuis localStorage.
    // Sans ça, un simple F5 déconnecterait l'utilisateur.
    useEffect(() => {
        const stocke = localStorage.getItem('user');
        if (stocke) {
            try {
                setUser(JSON.parse(stocke));
            } catch {
                localStorage.removeItem('user');
            }
        }
        setChargement(false);
    }, []);

    async function login(email, password) {
        const { data } = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    }

    async function register(username, email, password) {
        await api.post('/api/auth/register', { username, email, password });
        // Connexion automatique après inscription : évite à l'utilisateur
        // de ressaisir ses identifiants juste après les avoir créés.
        return login(email, password);
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, chargement, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
    return ctx;
}