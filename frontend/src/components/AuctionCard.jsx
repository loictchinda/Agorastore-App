import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

export default function AuctionCard({ auction }) {
    const cloturee = auction.status !== 'ACTIVE';

    return (
        <Link to={`/auctions/${auction.id}`} className={`carte ${cloturee ? 'inactive' : ''}`}>
            {auction.image_url
                ? <img src={auction.image_url} alt={auction.title}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                : <div className="image-vide">Pas d'image</div>}

            <div className="carte-corps">
                <h3>{auction.title}</h3>
                <p className="prix">{Number(auction.current_price).toFixed(2)} €</p>
                {cloturee
                    ? <span className="chrono termine">Clôturée</span>
                    : <CountdownTimer dateFin={auction.end_date} compact />}
            </div>
        </Link>
    );
}