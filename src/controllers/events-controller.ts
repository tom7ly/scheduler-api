// controllers/events-controller.ts
import { Request, Response } from 'express';
import { EventModel, IEvent } from '../models/event';
import { EventNotFoundError, SchedulingConflictError } from '../utils/custom-error';
import { IBatchData } from '../models/batch';
import reminderService from '../services/reminders-service';
export interface IControllerResult {
  status: 'success' | 'error' | 'partialSuccess';
  data?: any;
  message?: string;
}

export class EventsController {
  private static instance: EventsController;

   constructor() {  }

  public static getInstance(): EventsController {
    if (!EventsController.instance) {
      EventsController.instance = new EventsController();
    }
    return EventsController.instance;
  }
  async scheduleEvent(event: IEvent): Promise<IControllerResult> {
    try {
      const existingEvent = await EventModel.findOne({
        'eventSchedule.date': event.eventSchedule.date,
        'eventSchedule.time': event.eventSchedule.time,
        venue: event.venue,
      });

      if (existingEvent) {
        throw new SchedulingConflictError();
      }

      const newEvent = await EventModel.create(event);
      await reminderService.scheduleReminder(newEvent._id);

      return { status: 'success', data: newEvent };
    } catch (error) {
      throw { status: 'error', message: error.message };
    }
  }

  async getEvents(req: Request, res: Response): Promise<IControllerResult> {
    try {
      const { venue, location, sortBy } = req.query;

      const query: any = {};
      if (venue) {
        query.venue = venue;
      }
      if (location) {
        query.location = location;
      }

      let sortOptions: any = {};
      if (sortBy) {
        switch (sortBy) {
          case 'popularity':
            sortOptions = { participants: -1 };
            break;
          case 'date':
            sortOptions = { 'eventSchedule.date': 1, 'eventSchedule.time': 1 };
            break;
          case 'creationTime':
            sortOptions = { createdAt: 1 };
            break;
          default:
            break;
        }
      }

      const events = await EventModel.find(query).sort(sortOptions);

      return { status: 'success', data: events };
    } catch (error) {
      console.error(error);
      throw { status: 'error', message : error.message };
    }
  }

  async getEventById(eventId:string): Promise<IControllerResult> {
    try {

      const event = await EventModel.findById(eventId);
      if (!event) {
        throw { status: 'error', message: 'Event not found' };
      }

      return { status: 'success', data: event };
    } catch (error) {
      console.error(error);
      throw { status: 'error', message: error.message };
    }
  }


  async updateEvent(eventId: string, updatedData: Partial<IEvent>): Promise<IControllerResult> {
    try {
      const updatedEvent = await EventModel.findByIdAndUpdate(eventId, updatedData, { new: true });
      if (!updatedEvent) {
        throw new EventNotFoundError();
      }
      return { status: 'success', data: updatedEvent };
    } catch (error) {
      throw { status: 'error', message: error.message };
    }
  }

  async deleteEvent(eventId: string): Promise<IControllerResult> {
    try {
      const deletedEvent = await EventModel.findByIdAndDelete(eventId);
      if (!deletedEvent) {
        throw new EventNotFoundError();
      }
      return { status: 'success', data: 'Event deleted successfully' };
    } catch (error) {
      throw { status: 'error', message: error.message };
    }
  }
  async deleteAllEvents(): Promise<IControllerResult> {
    try {
      await EventModel.deleteMany({});
      return { status: 'success', data: 'All events deleted successfully' };
    } catch (error) {
      throw { status: 'error', message: error.message };
    }
  }

  async scheduleReminderAfterEventCreationOrUpdate(event: IEvent): Promise<void> {
    await reminderService.scheduleReminder(event._id);
  }
}
const eventsController = EventsController.getInstance();
export default eventsController
