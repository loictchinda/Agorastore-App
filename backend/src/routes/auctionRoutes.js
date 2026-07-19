const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auctions:
 *   get:
 *     summary: Récupérer la liste de toutes les enchères
 *     tags: [Auctions]
 *     responses:
 *       200:
 *         description: Liste des enchères
 */
router.get('/', auctionController.getAllAuctions);

/**
 * @swagger
 * /api/auctions:
 *   post:
 *     summary: Créer une nouvelle enchère (Nécessite un Token JWT)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - starting_price
 *               - end_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               starting_price:
 *                 type: number
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enchère créée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé (Token manquant ou invalide)
 */
router.post('/', authMiddleware, auctionController.createAuction);

/**
 * @swagger
 * /api/auctions/{id}:
 *   get:
 *     summary: Récupérer les détails d'une enchère spécifique
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'enchère
 *     responses:
 *       200:
 *         description: Détail de l'enchère
 *       404:
 *         description: Enchère introuvable
 */
router.get('/:id', auctionController.getAuctionById);

module.exports = router;