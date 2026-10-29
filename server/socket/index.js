let ioInstance = null;

function logSocket(message) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message);
  }
}

export function configureSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    logSocket(`Socket connected: ${socket.id}`);

    socket.emit('notification', {
      type: 'system',
      message: 'Connected to Bliss Beauty Salon live updates'
    });

    socket.on('join:admin', () => {
      socket.join('admin');
    });

    socket.on('join:appointment', (bookingReference) => {
      if (bookingReference) socket.join(`booking:${bookingReference.toString().toUpperCase()}`);
    });

    socket.on('disconnect', () => {
      logSocket(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function emitSocketEvent(eventName, payload, room) {
  if (!ioInstance) return false;

  if (room) {
    ioInstance.to(room).emit(eventName, payload);
  } else {
    ioInstance.emit(eventName, payload);
  }

  return true;
}

export function emitQueueUpdated(queue) {
  return emitSocketEvent(
    'queue:updated',
    {
      queue,
      emittedAt: new Date()
    },
    'admin'
  );
}

export function emitNotification(notification, room) {
  return emitSocketEvent(
    'notification',
    {
      ...notification,
      emittedAt: new Date()
    },
    room
  );
}
