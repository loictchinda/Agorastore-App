import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Instance unique partagée par toute l'application.
// autoConnect: false — on ne se connecte qu'au moment où un composant
// en a besoin (page de détail), pas au chargement de l'app.
const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
});

export default socket;