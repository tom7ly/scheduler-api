import mongoose from "mongoose";
import { IEventDoc } from "./event";
export enum JobStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
  }
class ReminderJob implements IReminderJob {
    title: string;
    eventSchedule: Date;
    createdAt: Date;
    reminderTime: Date;
    eventId: string
    jobId?: string;
    constructor(title: string, eventSchedule: Date,eventId: string) {
        this.eventId = eventId
        this.title = title
        this.eventSchedule = eventSchedule
        this.createdAt = new Date();
        this.reminderTime = this.calculateReminderTime(this.eventSchedule);
    }

    private calculateReminderTime(eventSchedule: Date): Date {
        const reminderTime = new Date(eventSchedule);
        reminderTime.setMinutes(reminderTime.getMinutes() - 30);
        return reminderTime;
    }
}

interface IReminderJob {
    _id?: any;
    eventId: string
    jobId?: string;
    title: string;
    eventSchedule: Date
    reminderTime:Date
    createdAt: Date;
}
const reminderJobSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    jobId: { type: String, required: false },
    title: { type: String, required: true },
    eventSchedule: { type: Date, required: true },
    reminderTime: { type: Date, required: true },
    createdAt: { type: Date, required: true },
});

const ReminderJobModel = mongoose.model<IReminderJob>('ReminderJob', reminderJobSchema);
export { IReminderJob, ReminderJobModel, ReminderJob };