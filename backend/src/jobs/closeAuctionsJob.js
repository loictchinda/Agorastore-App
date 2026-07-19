const pool = require('../config/db');

/**
 * Clôture les enchères dont la date de fin est dépassée.
 *
 * Retourne la liste des enchères clôturées (avec leur gagnant éventuel),
 * pour que l'appelant puisse notifier les clients connectés.
 */
async function closeExpiredAuctions(io) {
    try {
        // 1. Identifier les enchères à clôturer AVANT de les modifier :
        //    une fois passées en CLOSED, on ne saurait plus lesquelles
        //    viennent d'être traitées lors de ce passage.
        const [expired] = await pool.query(
            `SELECT id, title, current_price
             FROM Auctions
             WHERE status = 'ACTIVE' AND end_date <= NOW()`
        );

        if (expired.length === 0) return [];

        const ids = expired.map(a => a.id);

        // 2. Basculer le statut en une seule requête
        await pool.query(
            `UPDATE Auctions SET status = 'CLOSED' WHERE id IN (?)`,
            [ids]
        );

        // 3. Déterminer le gagnant de chaque enchère et notifier
        const resultats = [];
        for (const auction of expired) {
            const [gagnants] = await pool.query(
                `SELECT b.bidder_id, b.amount, u.username
                 FROM Bids b
                 JOIN Users u ON u.id = b.bidder_id
                 WHERE b.auction_id = ?
                 ORDER BY b.amount DESC
                 LIMIT 1`,
                [auction.id]
            );

            const gagnant = gagnants[0] || null;

            const payload = {
                auction_id: auction.id,
                title: auction.title,
                final_price: Number(auction.current_price),
                winner: gagnant
                    ? { id: gagnant.bidder_id, username: gagnant.username, amount: Number(gagnant.amount) }
                    : null   // enchère sans aucune offre
            };

            resultats.push(payload);

            if (io) {
                io.to(`auction_${auction.id}`).emit('auction_closed', payload);
            }

            console.log(
                `🔔 Enchère #${auction.id} clôturée — ` +
                (gagnant ? `gagnant : ${gagnant.username} (${gagnant.amount} €)` : 'aucune offre')
            );
        }

        return resultats;
    } catch (error) {
        // Un job planifié ne doit jamais faire tomber le serveur :
        // on journalise et on réessaiera au prochain passage.
        console.error('Erreur closeExpiredAuctions:', error);
        return [];
    }
}

/**
 * Démarre la vérification périodique.
 * Retourne le handle du timer pour pouvoir l'arrêter (tests, arrêt propre).
 */
function startAuctionCloser(io, intervalMs = 30000) {
    closeExpiredAuctions(io);                                   // passage immédiat au démarrage
    const timer = setInterval(() => closeExpiredAuctions(io), intervalMs);
    timer.unref();   // n'empêche pas le process Node de se terminer
    console.log(`⏱️  Job de clôture actif (toutes les ${intervalMs / 1000}s)`);
    return timer;
}

module.exports = { closeExpiredAuctions, startAuctionCloser };