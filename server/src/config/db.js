import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / ISP DNS causing querySrv ECONNREFUSED on Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if permissions or platform prevent changing DNS servers
}

let memoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wordshift';

  try {
    // Attempt connection with 8000ms server selection timeout for Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log('\n=========================================');
    console.log(`✅ [MongoDB Connected] Successfully connected!`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`📁 Database: ${mongoose.connection.name}`);
    console.log('=========================================\n');
  } catch (err) {
    console.warn(`\n⚠️  [MongoDB] Could not connect to (${uri}):\n👉 Error: ${err.message}`);

    if (err.message.includes('querySrv ENOTFOUND') || err.message.includes('querySrv ECONNREFUSED')) {
      console.error(`\n❌ [DNS ERROR] Atlas hostname was not found. Please copy the EXACT connection string from MongoDB Atlas Dashboard > Connect > Drivers, without modifying the cluster name.\n`);
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error(`\n❌ [AUTH ERROR] MongoDB username or password in .env is incorrect.\n`);
    } else if (err.message.includes('timed out') || err.message.includes('Server selection timed out')) {
      console.error(`\n❌ [NETWORK / IP ERROR] Connection timed out. Make sure your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas > Network Access.\n`);
    }

    console.log('🔄 [MongoDB] Attempting in-memory database fallback...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`✅ [MongoDB] Connected to in-memory fallback instance: ${memUri}`);
    } catch (memErr) {
      console.error('⚠️  [MongoDB] In-memory database could not start:', memErr.message);
      console.error('👉 Please make sure a valid MongoDB URI is set in server/.env\n');
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
