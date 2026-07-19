import useCountdown from '../hooks/useCountdown';

export default function CountdownTimer({ dateFin, compact = false }) {
    const { jours, heures, minutes, secondes, expire } = useCountdown(dateFin);

    if (expire) {
        return <span className="chrono termine">Enchère terminée</span>;
    }

    const pad = (n) => String(n).padStart(2, '0');
    const urgent = jours === 0 && heures === 0 && minutes < 10;

    return (
        <span className={`chrono ${urgent ? 'urgent' : ''}`}>
            {jours > 0 && `${jours}j `}
            {pad(heures)}:{pad(minutes)}:{pad(secondes)}
            {!compact && ' restantes'}
        </span>
    );
}