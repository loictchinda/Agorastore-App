import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import './App.css';

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
                            <ProtectedRoute><AuctionList /></ProtectedRoute>} />
                        {/* /new avant /:id : sinon "new" serait capturé comme un id */}
                        <Route path="/auctions/new" element={
                            <ProtectedRoute><CreateAuction /></ProtectedRoute>} />
                        <Route path="/auctions/:id" element={
                            <ProtectedRoute><AuctionDetail /></ProtectedRoute>} />
                    </Routes>
                </main>
            </AuthProvider>
        </BrowserRouter>
    );
}