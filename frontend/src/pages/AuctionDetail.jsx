import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auctionsService } from '../services/auctions';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import CountdownTimer from '../components/CountdownTimer';
import BidForm from '../components/BidForm';

export default function AuctionDetail() {
    const { id } = useParams();
    const { user } = useAuth();

    const [auction, setAuction] = useState(null);
    const [offres, setOffres] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [flash, setFlash] = useState(false);

    // Deux appels séparés : l'API expose l'enchère et ses offres comme
    // deux ressources distinctes. On respecte ce découpage REST plutôt
    // que d'ajouter une route composite côté backend.
    const charger = useCallback(async () => {
        try {
            const [detail, historique] = await Promise.all([
                auctionsService.detail(id),
                auctionsService.offres(id),
            ]);
            setAuction(detail);
            setOffres(historique);
        } catch {
            setErreur('Enchère introuvable.');
        } finally {
            setChargement(false);
        }
    }, [id]);

    useEffect(() => { charger(); }, [charger]);

    // Abonnement temps réel à la room de cette enchère.
    useEffect(() => {
        socket.connect();
        socket.emit('join_room', id);

        const surNouvelleOffre = (data) => {
            // Mise à jour optimiste du prix affiché…
            setAuction(prev => prev ? { ...prev, current_price: data.amount } : prev);
            setFlash(true);
            setTimeout(() => setFlash(false), 800);
            // …puis rechargement de l'historique, car l'événement ne porte
            // pas le username de l'enchérisseur.
            auctionsService.offres(id).then(setOffres).catch(() => { });
        };

        const surCloture = (data) => {
            setAuction(prev => prev ? { ...prev, status: 'CLOSED', current_price: data.final_price } : prev);
        };

        socket.on('new_bid', surNouvelleOffre);
        socket.on('auction_closed', surCloture);

        // Nettoyage : on quitte la room et on retire les écouteurs.
        // Sans ce désabonnement, naviguer entre plusieurs enchères
        // empilerait les handlers et le composant réagirait aux offres
        // d'enchères qu'on ne consulte plus.
        return () => {
            socket.emit('leave_room', id);
            socket.off('new_bid', surNouvelleOffre);
            socket.off('auction_closed', surCloture);
            socket.disconnect();
        };
    }, [id]);

    if (chargement) return <p className="etat">Chargement…</p>;
    if (erreur) return <p className="erreur">{erreur}</p>;
    if (!auction) return null;

    const cloturee = auction.status !== 'ACTIVE' || new Date(auction.end_date) <= new Date();
    const estVendeur = user && user.id === auction.seller_id;

    return (
        <div className="page">
            <Link to="/" className="retour">← Retour au catalogue</Link>

            <div className="detail">
                <div className="detail-image">
                    {auction.image_url
                        ? <img src={auction.image_url} alt={auction.title}
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        : <div className="image-vide grande">Pas d'image</div>}
                </div>

                <div className="detail-infos">
                    <h1>{auction.title}</h1>
                    <p className="description">{auction.description || 'Aucune description.'}</p>

                    <div className="bloc-prix">
                        <span className="label">Prix actuel</span>
                        <p className={`prix-grand ${flash ? 'flash' : ''}`}>
                            {Number(auction.current_price).toFixed(2)} €
                        </p>
                        <span className="label">Prix de départ : {Number(auction.starting_price).toFixed(2)} €</span>
                    </div>

                    <div className="bloc-chrono">
                        {cloturee
                            ? <span className="chrono termine">Enchère terminée</span>
                            : <CountdownTimer dateFin={auction.end_date} />}
                    </div>

                    {estVendeur
                        ? <p className="info-box">Vous êtes le vendeur de cet objet.</p>
                        : <BidForm
                            auctionId={id}
                            prixActuel={auction.current_price}
                            desactive={cloturee}
                            onOffrePlacee={charger}
                        />}
                </div>
            </div>

            <section className="historique">
                <h2>Historique des offres ({offres.length})</h2>
                {offres.length === 0
                    ? <p className="etat">Aucune offre pour le moment. Soyez le premier !</p>
                    : <ul>
                        {offres.map((o, i) => (
                            <li key={o.id} className={i === 0 ? 'meilleure' : ''}>
                                <strong>{o.username}</strong>
                                <span>{Number(o.amount).toFixed(2)} €</span>
                                <em>{new Date(o.created_at).toLocaleString('fr-FR')}</em>
                            </li>
                        ))}
                    </ul>}
            </section>
        </div>
    );
}