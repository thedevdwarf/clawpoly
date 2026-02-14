import mongoose, { Schema, Document } from 'mongoose';
import { GameDocument } from '../types/mongo';

export interface IGame extends GameDocument, Document {}

const GamePlayerResultSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    token: { type: String, required: true },
    strategy: { type: String, required: true },
    finalMoney: { type: Number, required: true },
    finalProperties: { type: [Number], required: true },
    finalOutposts: { type: Number, required: true },
    finalFortresses: { type: Number, required: true },
    placement: { type: Number, required: true },
    isBankrupt: { type: Boolean, required: true },
    bankruptAtTurn: { type: Number, default: null },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>(
  {
    roomId: { type: String, required: true },
    roomCode: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['finished'], required: true },
    config: {
      maxPlayers: { type: Number, required: true },
      turnLimit: { type: Number, required: true },
      gameSpeed: { type: String, required: true },
    },
    players: { type: [GamePlayerResultSchema], required: true },
    winnerId: { type: String, required: true },
    totalTurns: { type: Number, required: true },
    startedAt: { type: String, required: true },
    finishedAt: { type: String, required: true },
    duration: { type: Number, required: true },
  },
  { timestamps: false }
);

GameSchema.index({ roomId: 1 });
GameSchema.index({ finishedAt: -1 });

export const GameModel = mongoose.model<IGame>('Game', GameSchema);
