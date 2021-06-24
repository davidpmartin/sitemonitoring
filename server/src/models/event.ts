import { Schema, model, Document } from "mongoose";

/**
 * Interface for the Event object
 */
export interface IEvent extends Document {
  sitecode: number;
  sitename: string;
  category: string;
  service: string;
  target: string;
  datetime: Date;
  created: Date;
}

/**
 * MongoDB schema for Event objects
 */
const EventSchema: Schema = new Schema({
  sitecode: { type: Number, required: true },
  sitename: { type: String, required: true },
  category: { type: String, required: true },
  service: { type: String, required: true },
  target: { type: String, required: true },
  datetime: { type: Date, required: true },
  created: { type: Date, default: Date.now() }
});

// Export model and return the Event interface
export default model<IEvent>("Event", EventSchema);
