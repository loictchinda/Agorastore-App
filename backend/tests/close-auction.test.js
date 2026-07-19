/**
 * Tests du job de clôture automatique.
 * On teste la fonction de façon isolée (pas de dépendance à un timer réel).
 *
 * Note : ce fichier est le seul à importer directement un module qui ouvre
 * un pool MySQL. Il faut donc fermer ce pool en fin de suite, sinon les
 * connexions maintiennent la boucle d'événements ouverte et le runner
 * de test ne peut jamais se terminer.
 */
const { test, after } = require('node:test');
const assert = require('node:assert');
const { closeExpiredAuctions, startAuctionCloser } = require('../src/jobs/closeAuctionsJob');
const pool = require('../src/config/db');

let timerCree = null;

after(async () => {
    if (timerCree) clearInterval(timerCree);
    await pool.end();   // libère les connexions : sans ça, le process ne se termine pas
});

test('le module expose les deux fonctions attendues', () => {
    assert.strictEqual(typeof closeExpiredAuctions, 'function');
    assert.strictEqual(typeof startAuctionCloser, 'function');
});

test('closeExpiredAuctions ne lève jamais, même sans io', async () => {
    // Un job planifié doit être défensif : une erreur base ne doit pas
    // faire tomber le process. La fonction retourne un tableau dans tous les cas.
    const resultat = await closeExpiredAuctions(null);
    assert.ok(Array.isArray(resultat), 'doit retourner un tableau');
});

test('startAuctionCloser retourne un timer arrêtable', () => {
    timerCree = startAuctionCloser(null, 60000);
    assert.ok(timerCree, 'doit retourner un handle de timer');
    clearInterval(timerCree);
    timerCree = null;
});