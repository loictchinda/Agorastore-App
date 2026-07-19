module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('join_room', (auctionId) => {
            socket.join(`auction_${auctionId}`);
        });

        socket.on('disconnect', () => {
            // Nettoyage éventuel
        });
    });
};