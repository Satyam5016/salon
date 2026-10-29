import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase({ required = env.requireDb } = {}) {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    if (required) {
      throw error;
    }

    console.warn(`MongoDB unavailable; continuing without database: ${error.message}`);
    return false;
  }
}
