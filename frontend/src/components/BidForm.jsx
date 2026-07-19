import { useState } from 'react';
import { auctionsService } from '../services/auctions';

export default function BidForm({ auctionId, prixActuel, desactive, onOffrePlacee }) {
    const [montant, setMontant] = useState('');
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    // Suggestion : un cran au-dessus du prix courant
    const minimum = Number(prixActuel) + 1;

    async function handleSubmit(e) {
        e.preventDefault();
        setErreur('');

        // Validation côté client : évite un aller-retour réseau inutile.
        // Elle ne remplace pas la validation serveur, qui reste la seule
        // qui fasse autorité — un utilisateur peut contourner celle-ci.
        if (Number(montant) <= Number(prixActuel)) {
            setErreur(`L'offre doit dépasser ${Number(prixActuel).toFixed(2)} €.`);
            return;
        }

        setEnvoi(true);
        try {
            await auctionsService.placerOffre(auctionId, Number(montant));
            setMontant('');
            onOffrePlacee?.();
        } catch (err) {
            setErreur(err.response?.data?.message || "Impossible de placer l'offre.");
        } finally {
            setEnvoi(false);
        }
    }

    if (desactive) {
        return <p className="info-box">Cette enchère est clôturée, vous ne pouvez plus enchérir.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="bid-form">
            <label>
                Votre offre (€)
                <input
                    type="number" step="0.01" min={minimum} required
                    placeholder={minimum.toFixed(2)}
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                />
            </label>
            {erreur && <p className="erreur">{erreur}</p>}
            <button type="submit" disabled={envoi}>
                {envoi ? 'Envoi…' : 'Enchérir'}
            </button>
        </form>
    );
}