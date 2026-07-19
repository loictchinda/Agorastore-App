/**
 * Tests smoke — vérifient le démarrage du serveur, le montage des routes
 * et la sécurité JWT (401 sans token), sans dépendre de la base MySQL.
 *
 * Lancement : node --test tests/  (depuis le dossier backend)
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 3999;
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

test('la documentation Swagger est accessible', async () => {
    const res = await fetch(`${BASE}/api-docs/`);
    assert.strictEqual(res.status, 200);
});

test('GET /api/auctions est monté (pas de 404)', async () => {
    const res = await fetch(`${BASE}/api/auctions`);
    assert.notStrictEqual(res.status, 404);
});

test('GET /api/auctions/:id est monté et géré par un controller', async () => {
    // Sans DB le handler renvoie 500 ; avec DB, 200 ou 404 métier.
    // L'important ici : la route répond en JSON (donc gérée), pas un 404 HTML d'Express.
    const res = await fetch(`${BASE}/api/auctions/1`);
    const isJson = (res.headers.get('content-type') || '').includes('json');
    assert.ok(isJson, 'la route doit répondre en JSON');
});

test('POST /api/auctions sans token → 401', async () => {
    const res = await fetch(`${BASE}/api/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x', starting_price: 1, end_date: '2030-01-01' }),
    });
    assert.strictEqual(res.status, 401);
});

test('POST /api/auctions avec token invalide → 401', async () => {
    const res = await fetch(`${BASE}/api/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer faux.token.invalide' },
        body: JSON.stringify({ title: 'x', starting_price: 1, end_date: '2030-01-01' }),
    });
    assert.strictEqual(res.status, 401);
});
