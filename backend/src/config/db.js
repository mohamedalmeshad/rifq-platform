import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    if (env.NODE_ENV !== 'test') {
      console.info('[MongoDB] Connected successfully');
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    if (env.NODE_ENV !== 'test') {
      console.warn('[MongoDB] Disconnected');
    }
  });

  return mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
