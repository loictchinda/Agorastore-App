/**
 * Gestion des connexions temps réel.
 *
 * Principe : une "room" Socket.IO par enchère (`auction_<id>`).
 * Un client ne reçoit que les événements des enchères qu'il consulte,
 * au lieu d'un broadcast global à tous les connectés — ce qui ne tiendrait
 * pas la charge dès que le catalogue grossit.
 */
module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connecté : ${socket.id}`);

        // Le client entre sur la page de détail d'une enchère
        socket.on('join_room', (auctionId) => {
            const room = `auction_${auctionId}`;
            socket.join(room);
            console.log(`➡️  ${socket.id} a rejoint ${room}`);

            // Accusé de réception : permet au front de confirmer l'abonnement
            socket.emit('joined_room', { room });
        });

        // Le client quitte la page de détail
        socket.on('leave_room', (auctionId) => {
            const room = `auction_${auctionId}`;
            socket.leave(room);
            console.log(`⬅️  ${socket.id} a quitté ${room}`);
        });

        socket.on('disconnect', (reason) => {
            // Socket.IO retire automatiquement le socket de toutes ses rooms.
            console.log(`❌ Client déconnecté : ${socket.id} (${reason})`);
        });
    });
};