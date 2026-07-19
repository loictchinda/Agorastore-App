const express = require('express');
const router = express.Router({ mergeParams: true });
const bidController = require('../controllers/bidController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auctions/{id}/bids:
 *   post:
 *     summary: Placer une offre sur une enchère (Nécessite un Token JWT)
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant de l'enchère
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 150.00
 *     responses:
 *       201:
 *         description: Offre enregistrée
 *       400:
 *         description: Montant invalide, enchère clôturée ou expirée
 *       401:
 *         description: Non autorisé (token manquant ou invalide)
 *       403:
 *         description: Interdit d'enchérir sur sa propre enchère
 *       404:
 *         description: Enchère introuvable
 */
router.post('/:id/bids', authMiddleware, bidController.placeBid);

/**
 * @swagger
 * /api/auctions/{id}/bids:
 *   get:
 *     summary: Consulter l'historique des offres d'une enchère
 *     tags: [Bids]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des offres, de la plus haute à la plus basse
 */
router.get('/:id/bids', bidController.getBidsByAuction);

module.exports = router;