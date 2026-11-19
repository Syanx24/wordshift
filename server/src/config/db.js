import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wordshift';

  try {
    // Attempt connection with 3000ms server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Successfully connected to database: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to primary MongoDB URI (${uri}): ${err.message}`);
    console.log('[MongoDB] Starting MongoMemoryServer for development fallback...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[MongoDB] Connected to in-memory MongoDB instance: ${memUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Failed to start in-memory MongoDB server:', memErr.message);
      throw memErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost');
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
