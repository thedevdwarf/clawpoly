import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  email: string;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

WishlistSchema.index({ email: 1 }, { unique: true });

export const WishlistModel = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
