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
    agentToken: { type: String },
    claimCode: { type: String },
    coachId: { type: String },
    createdAt: { type: String, required: true },
    stats: { type: AgentStatsSchema, required: true },
    elo: { type: Number, default: 1200 },
    lastPlayedAt: { type: String, required: true },
    feeWallet: { type: String },
    tokenAddress: { type: String, default: null },
    tokenSymbol: { type: String, default: null },
    tokenPoolId: { type: String, default: null },
    tokenTxHash: { type: String, default: null },
    tokenStatus: { type: String, enum: ['pending', 'deployed', 'failed'], default: 'pending' },
  },
  { timestamps: false }
);

AgentSchema.index({ agentId: 1 }, { unique: true });
AgentSchema.index({ agentToken: 1 }, { sparse: true });
AgentSchema.index({ claimCode: 1 }, { sparse: true, unique: true });
AgentSchema.index({ coachId: 1 }, { sparse: true });
AgentSchema.index({ elo: -1 });
AgentSchema.index({ feeWallet: 1 }, { unique: true, sparse: true });

export const AgentModel = mongoose.model<IAgent>('Agent', AgentSchema);
