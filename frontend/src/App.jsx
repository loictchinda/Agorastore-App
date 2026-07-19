import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Page temporaire — remplacée par la liste des enchères à la feature suivante
function Accueil() {
    return (
        <div style={{ padding: 24 }}>
            <h1>Enchères</h1>
            <p>Le catalogue arrive à la prochaine feature.</p>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <main className="conteneur">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={
                            <ProtectedRoute><Accueil /></ProtectedRoute>
                        } />
                    </Routes>
                </main>
            </AuthProvider>
        </BrowserRouter>
    );
}