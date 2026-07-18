const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// --- 1. FONCTION D'INSCRIPTION ---
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Vérifier si l'utilisateur existe déjà
        const [existingUsers] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // 2. Hachage du mot de passe (sécurité)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insertion en base de données
        const [result] = await pool.query(
            'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: "Utilisateur créé avec succès !", userId: result.insertId });
    } catch (error) {
        console.error("Erreur register:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
    }
}; // <-- LA CORRECTION EST ICI : Fermeture de la fonction register

// --- 2. FONCTION DE CONNEXION ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Vérifier si l'utilisateur existe
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Identifiants incorrects." });
        }

        const user = users[0];

        // 2. Vérifier le mot de passe haché
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants incorrects." });
        }

        // 3. Générer le JWT
        // Le token contient l'ID de l'utilisateur et expire dans 24 heures
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Retourner la réponse avec le token
        res.status(200).json({
            message: "Connexion réussie",
            token: token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error("Erreur login:", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
}; // <-- Fermeture de la fonction login