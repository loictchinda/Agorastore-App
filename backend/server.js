const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const auctionRoutes = require('./src/routes/auctionRoutes');
const bidRoutes = require('./src/routes/bidRoutes');
const registerSocketHandlers = require('./src/sockets/socketHandler');
const { startAuctionCloser } = require('./src/jobs/closeAuctionsJob');

const app = express();
app.use(cors());
app.use(express.json());
// Sert la page de démo temps réel sur /demo.html
app.use(express.static('public'));

// --- Configuration Swagger ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Agorastore API',
            version: '1.0.0',
            description: 'API de la plateforme d\'enchères en temps réel',
        },
        servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    apis: ['./src/routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auctions', bidRoutes);

// --- Serveur HTTP + Socket.IO ---
// Express seul ne suffit pas : Socket.IO a besoin du serveur HTTP natif
// pour intercepter la requête d'upgrade HTTP -> WebSocket.
// D'où http.createServer(app) et httpServer.listen() au lieu de app.listen().
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || '*', // à restreindre à l'URL du front en production
        methods: ['GET', 'POST']
    }
});

// Rend l'instance io accessible aux controllers via req.app.get('io'),
// sans créer de dépendance circulaire entre server.js et les controllers.
app.set('io', io);
registerSocketHandlers(io);
// Clôture automatique des enchères expirées.
// Désactivée en test pour ne pas polluer la base pendant les suites.
if (process.env.NODE_ENV !== 'test') {
    startAuctionCloser(io, Number(process.env.CLOSE_INTERVAL_MS) || 30000);
}

// --- Démarrage ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📚 Documentation Swagger dispo sur http://localhost:${PORT}/api-docs`);
    console.log(`⚡ Socket.IO à l'écoute sur le même port`);
});

module.exports = { app, httpServer, io };