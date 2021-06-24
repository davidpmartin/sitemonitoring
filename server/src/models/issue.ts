import { Schema, model, Document } from "mongoose";

/**
 * Interface for the Issue object
 */
export interface IIssue extends Document {
  sitecode: number;
  sitename: string;
  category: string;
  service: string;
  target: string;
  datetime: Date;
  created: Date;
}

/**
 * MongoDB schema for Issue objects
 */
export const IssueSchema: Schema = new Schema({
  sitecode: { type: Number, required: true },
  sitename: { type: String, required: true },
  category: { type: String, required: true },
  service: { type: String, required: true },
  target: { type: String, required: true },
  datetime: { type: Date, required: true },
  created: { type: Date, default: Date.now() }
});

// Export model and return the Issue interface
export default model<IIssue>("Issue", IssueSchema);
