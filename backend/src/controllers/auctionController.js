const pool = require('../config/db');

// --- 1. LISTER TOUTES LES ENCHÈRES ---
exports.getAllAuctions = async (req, res) => {
    try {
        const [auctions] = await pool.query('SELECT * FROM Auctions ORDER BY created_at DESC');
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
        
        // L'ID du vendeur est fourni de manière sécurisée par notre middleware
        const seller_id = req.auth.userId; 

        const [result] = await pool.query(
            'INSERT INTO Auctions (seller_id, title, description, starting_price, current_price, end_date, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [seller_id, title, description, starting_price, starting_price, end_date, image_url || null]
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