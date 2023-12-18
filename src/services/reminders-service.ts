import mongoose, { mongo } from 'mongoose';
import { EventModel, IEvent, IEventDoc, validateEvent } from '../models/event';
import { APIErr, APIRes, APIStatus, IAPIRes } from '../utils/custom-error';
import { Job } from 'bee-queue';
import { IReminderJob, JobStatus, ReminderJob, ReminderJobModel } from '../models/reminder-job';
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
    this.setupQueueFailureHandling();

  }

  private setupQueueFailureHandling() {
    this.queue.on('failed', this.handleJobFailure.bind(this));
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

  async scheduleReminder(eventId: IEvent): Promise<IReminderJob> {
    try {
      const event = await EventModel.findOne({ _id: eventId });
      if (!event) {
        throw new APIErr(APIStatus.BAD_REQUEST, `Unable to schedule reminder for event with ID ${event._id} because event does not exist`);
      }
      const newJob = new ReminderJob(event.title, event.eventSchedule, event._id);
      const job = this.queue.createJob(newJob).delayUntil(newJob.reminderTime);

      await job.save();
      newJob.jobId = job.id;
      await event.updateOne({ reminderJob: newJob }).catch((err) => {
        console.log(err);
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, "Unable to update event with reminder job ID");
      })
      await ReminderJobModel.create(newJob).catch((err) => {
        console.log(err);
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, "Unable to create reminder job");
      })

      console.log(`Reminder scheduled`, newJob);
      return newJob;
    } catch (error) {
      this.handleAPIError(error);
    }
  }


  async cancelReminder(reminder: IReminderJob): Promise<IReminderJob> {
    try {
      if (!reminder || !reminder.jobId) {
        throw new APIErr(APIStatus.BAD_REQUEST, 'Unable to cancel reminder because reminder input or reminder ID is empty');
      }
      const queueJob = await this.queue.getJob(reminder.jobId)
      if (queueJob) {
        await queueJob.remove();
        ReminderJobModel.deleteOne({ jobId: reminder.jobId })
        // return new APIRes(APIStatus.OK, `Reminder canceled for event with ID ${reminder.eventId}`);
        return reminder
      } else {
        throw new APIErr(APIStatus.BAD_REQUEST, `Reminder not found for event with ID ${reminder.eventId}`);
      }
    } catch (error) {
      this.handleAPIError(error);
    }
  }
  async getReminderJob(key: string, value: string): Promise<IReminderJob> {
    try {
      if (!value) {
        throw new APIErr(APIStatus.BAD_REQUEST, `Unable to retrieve reminder because ${key} is empty`);
      }
      const job = await ReminderJobModel.findOne({ [key]: value }).catch((err) => {
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, err.message);
      });
      return job;
    }
    catch (error) {
      this.handleAPIError(error);
    }
  }

  async getAllJobs(): Promise<IReminderJob[]> {
    try {
      const jobTypes = ['waiting', 'active', 'succeeded', 'failed', 'delayed'];
      const allJobs = [];

      for (const type of jobTypes) {
        const jobs = await this.queue.getJobs(type);
        allJobs.push(...jobs);
      }
      const jobs: IReminderJob[] = allJobs.map((job: Job<any>) => {
        return job.data
      })
      return jobs
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
  private async handleJobFailure(job: any, err: Error) {
    const { eventId } = job.data;
    console.log(`Reminder job failed for event with ID ${eventId}: ${err.message}`);
  }
}

const reminderService = new ReminderService();
export default reminderService;