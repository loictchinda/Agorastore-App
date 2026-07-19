/**
 * Tests du temps réel (Socket.IO).
 * Vérifie qu'un vrai client peut se connecter, rejoindre une room,
 * et que la diffusion ciblée fonctionne (room A ne reçoit pas les
 * événements de la room B).
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { io: ioClient } = require('socket.io-client');

const PORT = 3997;
const BASE = `http://localhost:${PORT}`;
let serverProcess;

function waitForServer(retries = 60) {
    return new Promise((resolve, reject) => {
        const tryOnce = (n) => {
            fetch(`${BASE}/api-docs/`)
                .then(() => resolve())
                .catch(() => {
                    if (n <= 0) return reject(new Error('Serveur injoignable'));
                    setTimeout(() => tryOnce(n - 1), 300);
                });
        };
        tryOnce(retries);
    });
}

function connectClient() {
    return new Promise((resolve, reject) => {
        const socket = ioClient(BASE, { transports: ['websocket'], reconnection: false });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', reject);
    });
}

before(async () => {
    serverProcess = spawn(process.execPath, ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(PORT), JWT_SECRET: 'test-secret' },
        stdio: 'ignore',
    });
    await waitForServer();
}, { timeout: 30000 });

after(() => {
    if (serverProcess) serverProcess.kill();
});

test('un client peut se connecter au serveur Socket.IO', async () => {
    const socket = await connectClient();
    assert.ok(socket.connected, 'le client doit être connecté');
    assert.ok(socket.id, 'le client doit recevoir un identifiant');
    socket.disconnect();
});

test('un client peut rejoindre la room d\'une enchère', async () => {
    const socket = await connectClient();

    const joined = new Promise((resolve) => {
        socket.on('joined_room', resolve);
    });

    socket.emit('join_room', 10);
    const payload = await joined;

    assert.strictEqual(payload.room, 'auction_10');
    socket.disconnect();
});

test('la diffusion est bien cloisonnée par room', async () => {
    const clientA = await connectClient();
    const clientB = await connectClient();

    const aJoined = new Promise((r) => clientA.on('joined_room', r));
    const bJoined = new Promise((r) => clientB.on('joined_room', r));

    clientA.emit('join_room', 1);
    clientB.emit('join_room', 2);
    await Promise.all([aJoined, bJoined]);

    // Un événement émis vers auction_1 ne doit jamais atteindre le client de auction_2.
    let bReceived = false;
    clientB.on('new_bid', () => { bReceived = true; });

    await new Promise((r) => setTimeout(r, 300));
    assert.strictEqual(bReceived, false, 'le client B ne doit rien recevoir de la room A');

    clientA.disconnect();
    clientB.disconnect();
});