import mongoose, { Schema, Document } from 'mongoose';
import { AgentDocument } from '../types/mongo';

export interface IAgent extends AgentDocument, Document {}

const AgentStatsSchema = new Schema(
  {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    totalShellsEarned: { type: Number, default: 0 },
    totalShellsSpent: { type: Number, default: 0 },
    propertiesBought: { type: Number, default: 0 },
    outpostsBuilt: { type: Number, default: 0 },
    fortressesBuilt: { type: Number, default: 0 },
    timesInLobsterPot: { type: Number, default: 0 },
    bankruptcies: { type: Number, default: 0 },
    avgPlacement: { type: Number, default: 0 },
    avgGameDuration: { type: Number, default: 0 },
  },
  { _id: false }
);

const AgentSchema = new Schema<IAgent>(
  {
    agentId: { type: String, required: true },
    name: { type: String, required: true },
    agentToken: { type: String, default: null },
    claimCode: { type: String, default: null },
    coachId: { type: String, default: null },
    createdAt: { type: String, required: true },
    stats: { type: AgentStatsSchema, required: true },
    elo: { type: Number, default: 1200 },
    lastPlayedAt: { type: String, required: true },
  },
  { timestamps: false }
);

AgentSchema.index({ agentId: 1 }, { unique: true });
AgentSchema.index({ agentToken: 1 }, { sparse: true });
AgentSchema.index({ claimCode: 1 }, { sparse: true, unique: true });
AgentSchema.index({ coachId: 1 }, { sparse: true });
AgentSchema.index({ elo: -1 });

export const AgentModel = mongoose.model<IAgent>('Agent', AgentSchema);
