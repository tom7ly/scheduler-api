import mongoose, { Document, Schema } from 'mongoose';
import Joi from 'joi'
import { APIErr, APIStatus } from '../utils/custom-error';
import { IReminderJob, JobStatus, ReminderJob } from './reminder-job';

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
  _id?: any;
  title: string;
  description: string;
  location: string;
  venue: string;
  eventSchedule: Date;
  participants: number;
  createdAt: Date;
  reminderJob?: IReminderJob;
}
export interface IEventDoc extends IEvent, Document {
  _id: any;
}

const eventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  venue: Joi.string().required(),
  eventSchedule: Joi.date().iso().required(),
  participants: Joi.number().integer().min(0).required(),
  reminderJob: Joi.object().optional(),
});

export function validateEvent(event: IEvent) {
  const { error } = eventSchema.validate(event);
  if (error) {
    throw new APIErr(APIStatus.BAD_REQUEST, error.message);
  }

  const eventDateTime = new Date(event.eventSchedule)
  if (eventDateTime < new Date()) {
    throw new APIErr(APIStatus.BAD_REQUEST, '"eventSchedule.date" and "eventSchedule.time" must be either the current date/time or later');
  }
}
const partialEventSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  venue: Joi.string().optional(),
  eventSchedule: Joi.date().iso().required(),
  participants: Joi.number().integer().min(0).optional(),
  reminderJob: Joi.object().optional(),
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
  eventSchedule: { type: Date, required: true },
  participants: { type: Number, default: 0 },
  ReminderJob: { type: Object, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
