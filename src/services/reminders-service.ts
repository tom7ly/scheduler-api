// services/reminder-service.ts
import { EventModel, IEvent } from '../models/event';
const Queue = require('bee-queue');

interface RemindersErrorInterface {
  status: 'error';
  message: string;
}

class ReminderService {
  private queue: typeof Queue;

  constructor() {
    this.queue = new Queue('reminders');
    this.queue.on('error', (error) => console.error(`Queue error: ${error}`));
    this.processReminders();
  }

  async scheduleReminder(eventId: string): Promise<void> {
    try {
      const event = await EventModel.findById(eventId);
      if (!event) {
        console.error(`Event with ID ${eventId} not found for scheduling reminder.`);
        throw { status: 'error', message: `Event with ID ${eventId} not found for scheduling reminder.` };
      }

      const reminderTime = new Date(event.eventSchedule.date + ' ' + event.eventSchedule.time);
      reminderTime.setMinutes(reminderTime.getMinutes() - 30);

      const job = this.queue.createJob({ eventId }).delayUntil(reminderTime);
      await job.save();
    } catch (error) {
      console.error(`Error scheduling reminder: ${error}`);
      throw { status: 'error', message: 'Error scheduling reminder.' };
    }
  }

  async cancelReminder(eventId: string): Promise<any> {
    try {
      const job = await this.queue.getJob(eventId);
      if (job) {
        await job.remove();
      }
      return { status: 'success' };
    } catch (error) {
      console.error(`Error canceling reminder: ${error}`);
      throw { status: 'error', message: 'Error canceling reminder.' };
    }
  }

  async getAllJobs(): Promise<any> {
    try {
      const jobTypes = ['waiting', 'active', 'succeeded', 'failed', 'delayed'];
      const allJobs = [];

      for (const type of jobTypes) {
        const jobs = await this.queue.getJobs(type);
        allJobs.push(...jobs);
      }
      return allJobs;
    } catch (error) {
      console.error(`Error getting jobs: ${error}`);
      throw { status: 'error', message: 'Error getting jobs.' };
    }
  }

  processReminders(): void {
    this.queue.process(async (job) => {
      const { eventId } = job.data;
      
      console.log(`Reminder sent for event with ID ${eventId}`);
    });
  }
}

const reminderService = new ReminderService();
export default reminderService;
