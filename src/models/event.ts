import mongoose, { Document, Schema } from 'mongoose';
import Joi from 'joi'
import { APIErr, APIStatus } from '../utils/custom-error';

/**
 * [PATH] src/models/event.ts
 * This file contains the event model which represents an event in the database.
 * It also contains the validation logic for the event model.
 */
export interface IBatchData {
  create?: IEvent[];
  update?: { id: string; data: Partial<IEvent> }[];
  deleteIds?: string[];
}
export interface IEvent {
  _id?: any; // Add this line
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

const eventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  venue: Joi.string().required(),
  eventSchedule: Joi.object({
    date: Joi.string().isoDate().min(Joi.ref('now')).required(),
    time: Joi.string().pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  }).required(),
  participants: Joi.number().integer().min(0).required(),
  createdAt: Joi.date().iso().min(Joi.ref('now')).required(),
});

export function validateEvent(event: IEvent) {
  const { error } = eventSchema.validate(event, { context: { now: new Date() } });
  if (error) {
    throw new APIErr(APIStatus.BAD_REQUEST, error.message);
  }
}
const partialEventSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  venue: Joi.string().optional(),
  eventSchedule: Joi.object({
    date: Joi.string().isoDate().min(Joi.ref('now')).optional(),
    time: Joi.string().pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }).optional(),
  participants: Joi.number().integer().min(0).optional(),
  createdAt: Joi.date().iso().min(Joi.ref('now')).optional(),
});

export function validatePartialEvent(event: Partial<IEvent>) {
  const { error } = partialEventSchema.validate(event, { context: { now: new Date() } });
  if (error) {
    throw new APIErr(APIStatus.BAD_REQUEST, error.message);
  }
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

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
