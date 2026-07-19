const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // 1. Récupérer le token dans l'en-tête (Header) "Authorization"
        // Le format attendu est : "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Accès refusé. Token manquant ou invalide." });
        }

        const token = authHeader.split(' ')[1];

        // 2. Vérifier et décoder le token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Ajouter l'ID de l'utilisateur à la requête pour l'utiliser dans les futurs contrôleurs
        req.auth = {
            userId: decodedToken.userId
        };

        // 4. Passer à la fonction suivante (le contrôleur de la route)
        next();
    } catch (error) {
        res.status(401).json({ message: "Requête non authentifiée. Token expiré ou invalide." });
    }
};