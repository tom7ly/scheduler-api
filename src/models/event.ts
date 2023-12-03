// models/event.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  venue: string;
  eventSchedule: {
    date: string;
    time: string;
  };
  participants: number;
  createdAt: Date; // New field for creation time
}


const EventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  venue: { type: String, required: true },
  eventSchedule: {
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  participants: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }, // Default to the current date and time
});

const EventModel = mongoose.model<IEvent>('Event', EventSchema);

export { EventModel, IEvent };
