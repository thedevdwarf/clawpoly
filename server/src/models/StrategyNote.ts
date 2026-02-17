import mongoose, { Schema, Document } from 'mongoose';

export interface IStrategyNote extends Document {
  agentId: string;
  coachId: string;
  gameId: string;
  note: string;
  createdAt: string;
}

const StrategyNoteSchema = new Schema<IStrategyNote>(
  {
    agentId: { type: String, required: true },
    coachId: { type: String, required: true },
    gameId: { type: String, required: true },
    note: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

StrategyNoteSchema.index({ agentId: 1, createdAt: -1 });
StrategyNoteSchema.index({ coachId: 1 });

export const StrategyNoteModel = mongoose.model<IStrategyNote>('StrategyNote', StrategyNoteSchema);
