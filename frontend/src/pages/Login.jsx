import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const destination = location.state?.from?.pathname || '/';

    async function handleSubmit(e) {
        e.preventDefault();
        setErreur('');
        setEnvoi(true);
        try {
            await login(email, password);
            navigate(destination, { replace: true });
        } catch (err) {
            setErreur(err.response?.data?.message || 'Connexion impossible.');
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="form-page">
            <h1>Connexion</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input type="email" value={email} required
                        onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={password} required
                        onChange={(e) => setPassword(e.target.value)} />
                </label>

                {erreur && <p className="erreur">{erreur}</p>}

                <button type="submit" disabled={envoi}>
                    {envoi ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
            <p>Pas encore de compte ? <Link to="/register">Créer un compte</Link></p>
        </div>
    );
}