import mongoose, { Schema, Document } from 'mongoose';

export interface ICoach extends Document {
  coachId: string;
  displayName: string;
  email: string | null;
  agents: string[];
  createdAt: string;
}

const CoachSchema = new Schema<ICoach>(
  {
    coachId: { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, default: null },
    agents: { type: [String], default: [] },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

CoachSchema.index({ coachId: 1 }, { unique: true });

export const CoachModel = mongoose.model<ICoach>('Coach', CoachSchema);
