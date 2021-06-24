import { Schema, model, Document } from "mongoose";

/**
 * Interface for the meta object
 */
export interface IMeta extends Document {
  lastupdated: Date;
  sitecount: number;
  sitesup: number;
  homesitedown: boolean;
  created: Date;
}

/**
 * MongoDB schema for Meta objects
 */
const MetaSchema: Schema = new Schema({
  lastupdated: { type: Date, required: true },
  sitecount: { type: Number, required: true },
  sitesup: { type: Number, required: true },
  homesitedown: { type: Boolean, required: true },
  created: { type: Date, default: Date.now() }
});

// Export model and return the Meta interface
export default model<IMeta>("Meta", MetaSchema);
