const pool = require('../config/db');

// --- 1. PLACER UNE OFFRE ---
exports.placeBid = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;      // id de l'enchère
        const { amount } = req.body;
        const bidder_id = req.auth.userId;

        // Validation du format avant même de toucher à la base
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            connection.release();
            return res.status(400).json({ message: "Le montant de l'offre est invalide." });
        }

        await connection.beginTransaction();

        // Lecture verrouillante : bloque la ligne jusqu'au commit pour éviter
        // qu'une offre concurrente lise un prix déjà périmé (race condition).
        const [auctions] = await connection.query(
            'SELECT * FROM Auctions WHERE id = ? FOR UPDATE',
            [id]
        );

        if (auctions.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Enchère introuvable." });
        }

        const auction = auctions[0];

        // Règle métier : on ne peut pas enchérir sur sa propre vente
        if (auction.seller_id === bidder_id) {
            await connection.rollback();
            return res.status(403).json({
                message: "Vous ne pouvez pas enchérir sur votre propre enchère."
            });
        }

        // Règle métier : enchère clôturée
        if (auction.status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(400).json({ message: "Cette enchère est clôturée." });
        }

        // Règle métier : enchère expirée (la date fait foi, même si le statut
        // n'a pas encore été basculé par le job de clôture automatique)
        if (new Date(auction.end_date) <= new Date()) {
            await connection.rollback();
            return res.status(400).json({ message: "Cette enchère est expirée." });
        }

        // Règle métier : surenchère stricte
        if (numericAmount <= Number(auction.current_price)) {
            await connection.rollback();
            return res.status(400).json({
                message: "L'offre doit être supérieure au prix actuel.",
                current_price: Number(auction.current_price)
            });
        }

        const [result] = await connection.query(
            'INSERT INTO Bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)',
            [id, bidder_id, numericAmount]
        );

        await connection.query(
            'UPDATE Auctions SET current_price = ? WHERE id = ?',
            [numericAmount, id]
        );

        await connection.commit();

        // Diffusion temps réel — volontairement APRÈS le commit et non bloquante.
        // La base est la source de vérité ; la notification n'est qu'un confort
        // d'affichage. Si Socket.IO n'est pas branché, l'API reste fonctionnelle.
        const io = req.app.get('io');
        if (io) {
            io.to(`auction_${id}`).emit('new_bid', {
                auction_id: Number(id),
                amount: numericAmount,
                bidder_id: bidder_id,
                created_at: new Date().toISOString()
            });
        }

        res.status(201).json({
            message: "Offre enregistrée avec succès.",
            bidId: result.insertId,
            auction_id: Number(id),
            amount: numericAmount
        });
    } catch (error) {
        await connection.rollback();
        console.error("Erreur placeBid:", error);
        res.status(500).json({ message: "Erreur lors du placement de l'offre." });
    } finally {
        // La connexion retourne au pool quoi qu'il arrive, sinon le pool
        // se vide et l'API se fige après quelques requêtes.
        connection.release();
    }
};

// --- 2. HISTORIQUE DES OFFRES D'UNE ENCHÈRE ---
exports.getBidsByAuction = async (req, res) => {
    try {
        const { id } = req.params;

        const [bids] = await pool.query(
            `SELECT b.id, b.amount, b.created_at, u.username
             FROM Bids b
             JOIN Users u ON u.id = b.bidder_id
             WHERE b.auction_id = ?
             ORDER BY b.amount DESC`,
            [id]
        );

        res.status(200).json(bids);
    } catch (error) {
        console.error("Erreur getBidsByAuction:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des offres." });
    }
};