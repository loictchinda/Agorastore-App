import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, chargement } = useAuth();
    const location = useLocation();

    // Tant que la session n'est pas restaurée, on n'affiche rien :
    // sinon un utilisateur connecté serait brièvement redirigé vers /login
    // au rechargement de la page.
    if (chargement) return <div style={{ padding: 40 }}>Chargement…</div>;

    if (!user) {
        // On mémorise la page demandée pour y revenir après connexion.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}