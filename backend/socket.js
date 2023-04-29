let io;
//in order to use io/sockets in all files
//create the io here and export it.

module.exports = {
  init: (httpServer) => {
    // in latest version of socket.io, we need to set cors implicitly
    io = require('socket.io')(httpServer, {
      cors: {
        origin: '*',
        methods: '*',
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('socket.io is not initialized');
    }
    return io;
  },
};
