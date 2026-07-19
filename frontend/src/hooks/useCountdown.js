import { useState, useEffect } from 'react';

/**
 * Compte à rebours jusqu'à une date donnée.
 * Retourne { jours, heures, minutes, secondes, expire }.
 */
export default function useCountdown(dateFin) {
    const calculer = () => {
        const restant = new Date(dateFin).getTime() - Date.now();
        if (restant <= 0) {
            return { jours: 0, heures: 0, minutes: 0, secondes: 0, expire: true };
        }
        return {
            jours:    Math.floor(restant / 86400000),
            heures:   Math.floor((restant / 3600000) % 24),
            minutes:  Math.floor((restant / 60000) % 60),
            secondes: Math.floor((restant / 1000) % 60),
            expire: false,
        };
    };

    const [temps, setTemps] = useState(calculer);

    useEffect(() => {
        const timer = setInterval(() => setTemps(calculer()), 1000);
        // Nettoyage obligatoire : sans ce return, chaque démontage du composant
        // laisserait un intervalle actif qui tenterait de mettre à jour un état
        // démonté — fuite mémoire et avertissement React.
        return () => clearInterval(timer);
    }, [dateFin]);

    return temps;
}