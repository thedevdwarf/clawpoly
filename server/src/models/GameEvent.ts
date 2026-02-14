import mongoose, { Schema, Document } from 'mongoose';
import { GameEventDocument } from '../types/mongo';

export interface IGameEvent extends GameEventDocument, Document {}

const GameEventSchema = new Schema<IGameEvent>(
  {
    gameId: { type: String, required: true },
    roomId: { type: String, required: true },
    sequence: { type: Number, required: true },
    turnNumber: { type: Number, required: true },
    type: { type: String, required: true },
    playerId: { type: String, default: null },
    data: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: String, required: true },
  },
  { timestamps: false }
);

GameEventSchema.index({ gameId: 1, sequence: 1 });
GameEventSchema.index({ roomId: 1 });

export const GameEventModel = mongoose.model<IGameEvent>('GameEvent', GameEventSchema);
