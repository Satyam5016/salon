import mongoose from 'mongoose';

export function isValidObjectId(value) {
  return value && mongoose.Types.ObjectId.isValid(value.toString());
}

export function assertValidObjectId(value, label = 'id') {
  if (!isValidObjectId(value)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
}
