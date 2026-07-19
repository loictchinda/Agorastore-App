import api from './api';

// Regrouper les appels réseau ici évite de disperser des URLs en dur
// dans les composants : si une route change, un seul fichier bouge.
export const auctionsService = {
    lister:        ()            => api.get('/api/auctions').then(r => r.data),
    detail:        (id)          => api.get(`/api/auctions/${id}`).then(r => r.data),
    offres:        (id)          => api.get(`/api/auctions/${id}/bids`).then(r => r.data),
    placerOffre:   (id, amount)  => api.post(`/api/auctions/${id}/bids`, { amount }).then(r => r.data),
    creer:         (donnees)     => api.post('/api/auctions', donnees).then(r => r.data),
};