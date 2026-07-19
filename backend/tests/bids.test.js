/**
 * Tests de la feature Offres (bids).
 * Vérifie le montage des routes et les règles de sécurité,
 * sans dépendre d'une base MySQL peuplée.
 *
 * Lancement : node --test tests/   (depuis backend/)
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 3998;
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

test('POST /api/auctions/:id/bids sans token → 401', async () => {
    const res = await fetch(`${BASE}/api/auctions/1/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 150 }),
    });
    assert.strictEqual(res.status, 401);
});

test('POST /api/auctions/:id/bids avec token invalide → 401', async () => {
    const res = await fetch(`${BASE}/api/auctions/1/bids`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer faux.token.invalide',
        },
        body: JSON.stringify({ amount: 150 }),
    });
    assert.strictEqual(res.status, 401);
});

test('GET /api/auctions/:id/bids est monté et répond en JSON', async () => {
    const res = await fetch(`${BASE}/api/auctions/1/bids`);
    const isJson = (res.headers.get('content-type') || '').includes('json');
    assert.ok(isJson, "la route d'historique doit être gérée par un controller");
});

test('la route bids est bien distincte de la route auction (pas de collision)', async () => {
    // GET /api/auctions/1 et GET /api/auctions/1/bids doivent répondre séparément
    const detail = await fetch(`${BASE}/api/auctions/1`);
    const bids = await fetch(`${BASE}/api/auctions/1/bids`);
    assert.ok((detail.headers.get('content-type') || '').includes('json'));
    assert.ok((bids.headers.get('content-type') || '').includes('json'));
});