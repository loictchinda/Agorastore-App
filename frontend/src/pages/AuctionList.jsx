import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionsService } from '../services/auctions';
import AuctionCard from '../components/AuctionCard';

export default function AuctionList() {
    const [auctions, setAuctions] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        auctionsService.lister()
            .then(setAuctions)
            .catch(() => setErreur('Impossible de charger les enchères.'))
            .finally(() => setChargement(false));
    }, []);

    if (chargement) return <p className="etat">Chargement des enchères…</p>;
    if (erreur) return <p className="erreur">{erreur}</p>;

    return (
        <div className="page">
            <div className="page-entete">
                <h1>Enchères en cours</h1>
                <Link to="/auctions/new"><button>Créer une enchère</button></Link>
            </div>

            {auctions.length === 0
                ? <p className="etat">Aucune enchère pour le moment.</p>
                : <div className="grille">
                    {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
                </div>}
        </div>
    );
}