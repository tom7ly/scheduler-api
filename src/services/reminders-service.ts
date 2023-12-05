import mongoose, { mongo } from 'mongoose';
import { EventModel, IEvent, validateEvent } from '../models/event';
import { APIErr, APIRes, APIStatus, IAPIRes } from '../utils/custom-error';
const Queue = require('bee-queue');
const redisHost = process.env.RUNNING_IN_DOCKER ? "redis" : "localhost";

/**
 * [PATH] src/services/reminders-service.ts
 * This file contains the logic for the reminders service.
 */


class ReminderService {
  public queue: typeof Queue;

  constructor() {
    this.queue = new Queue('reminders', {
      redis: {
        host: redisHost,
        port: 6379
      }
    }
    );
    this.setupQueueErrorHandling();
    this.processReminders();
  }

  private setupQueueErrorHandling() {
    this.queue.on('error', (error) => this.handleAPIError(error));
  }

  private handleAPIError(error: Error) {
    console.log(error);
    if (error instanceof APIErr) {
      throw error;
    }
    throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, "Internal server error");
  }

  async scheduleReminder(event: IEvent): Promise<IAPIRes> {
    try {
      validateEvent(event);
      const foundEvent = await EventModel.findById(event._id);
      const jobId = new mongoose.Types.ObjectId().toString();
      if (foundEvent) {
        throw new APIErr(APIStatus.NOT_FOUND, `Event with ID ${event._id} not found`);
      }
      if (this.queue.getJob(jobId) !== null) {
        this.cancelReminder(jobId);
      }

      const reminderTime = new Date(event.eventSchedule.date + ' ' + event.eventSchedule.time);
      reminderTime.setMinutes(reminderTime.getMinutes() - 30);

      const job = this.queue.createJob({ jobId }).delayUntil(reminderTime);
      await job.save();
      return new APIRes(APIStatus.OK, `Reminder scheduled for event`);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async cancelReminder(eventId: string): Promise<IAPIRes> {
    try {
      const job = await this.queue.getJob(eventId);
      if (job) {
        await job.remove();
      }
      return new APIRes(APIStatus.OK, `Reminder canceled for event with ID ${eventId}`);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async getAllJobs(): Promise<IAPIRes> {
    try {
      const jobTypes = ['waiting', 'active', 'succeeded', 'failed', 'delayed'];
      const allJobs = [];

      for (const type of jobTypes) {
        const jobs = await this.queue.getJobs(type);
        allJobs.push(...jobs);
      }

      return new APIRes(APIStatus.OK, 'Jobs retrieved successfully', allJobs);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  private processReminders(): void {
    this.queue.process(async (job) => {
      const { eventId } = job.data;
      console.log(`Reminder sent for event with ID ${eventId}`);
    });
  }
}

const reminderService = new ReminderService();
export default reminderService;