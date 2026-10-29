import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { configureSocket } from './socket/index.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

configureSocket(io);

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }

  server.listen(env.port, () => {
    console.log(`Bliss Beauty Salon API listening on port ${env.port}`);
  });
}

startServer();
