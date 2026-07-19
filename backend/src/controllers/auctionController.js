const pool = require('../config/db');

// --- 1. LISTER TOUTES LES ENCHÈRES ---
exports.getAllAuctions = async (req, res) => {
    try {
        const [auctions] = await pool.query(
            'SELECT * FROM Auctions ORDER BY created_at DESC'
        );
        res.status(200).json(auctions);
    } catch (error) {
        console.error("Erreur getAllAuctions:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des enchères." });
    }
};

// --- 2. CRÉER UNE ENCHÈRE ---
exports.createAuction = async (req, res) => {
    try {
        const { title, description, starting_price, end_date, image_url } = req.body;

        // L'ID du vendeur vient du token décodé par le middleware, jamais du body :
        // sinon un utilisateur pourrait publier une enchère au nom d'un autre.
        const seller_id = req.auth.userId;

        // Validations métier de base
        if (!title || starting_price === undefined || !end_date) {
            return res.status(400).json({
                message: "Les champs title, starting_price et end_date sont obligatoires."
            });
        }

        const price = Number(starting_price);
        if (!Number.isFinite(price) || price <= 0) {
            return res.status(400).json({ message: "Le prix de départ est invalide." });
        }

        if (new Date(end_date) <= new Date()) {
            return res.status(400).json({ message: "La date de fin doit être dans le futur." });
        }

        // current_price est initialisé à starting_price : la logique d'enchère
        // ne manipule ensuite qu'un seul champ de prix courant.
        const [result] = await pool.query(
            `INSERT INTO Auctions
             (seller_id, title, description, starting_price, current_price, end_date, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [seller_id, title, description || null, price, price, end_date, image_url || null]
        );

        res.status(201).json({
            message: "Enchère publiée avec succès !",
            auctionId: result.insertId
        });
    } catch (error) {
        console.error("Erreur createAuction:", error);
        res.status(500).json({ message: "Erreur lors de la création de l'enchère." });
    }
};

// --- 3. CONSULTER UNE ENCHÈRE SPÉCIFIQUE ---
exports.getAuctionById = async (req, res) => {
    try {
        const auctionId = req.params.id;

        const [auctions] = await pool.query(
            'SELECT * FROM Auctions WHERE id = ?',
            [auctionId]
        );

        // 404 métier : la route existe, c'est la ressource qui n'existe pas.
        if (auctions.length === 0) {
            return res.status(404).json({ message: "Enchère introuvable." });
        }

        res.status(200).json(auctions[0]);
    } catch (error) {
        console.error("Erreur getAuctionById:", error);
        res.status(500).json({ message: "Erreur lors de la récupération de l'enchère." });
    }
};