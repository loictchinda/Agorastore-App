import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErreur('');

        if (password.length < 6) {
            setErreur('Le mot de passe doit faire au moins 6 caractères.');
            return;
        }

        setEnvoi(true);
        try {
            await register(username, email, password);
            navigate('/', { replace: true });
        } catch (err) {
            setErreur(err.response?.data?.message || 'Inscription impossible.');
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="form-page">
            <h1>Créer un compte</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Nom d'utilisateur
                    <input value={username} required
                        onChange={(e) => setUsername(e.target.value)} />
                </label>
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
                    {envoi ? 'Création…' : "S'inscrire"}
                </button>
            </form>
            <p>Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
        </div>
    );
}