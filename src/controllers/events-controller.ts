import { EventModel, IBatchData, IEvent, validateEvent, validatePartialEvent } from '../models/event';
import reminderService from '../services/reminders-service';
import { APIErr, APIRes, APIResBase, APIStatus, IAPIRes } from '../utils/custom-error';

/**
 * [PATH] src/controllers/events-controller.ts
 * This file contains the events controller which handles the business logic for the events API.
 * This is class is used as a singleton across the application.
 */

export class EventsController {
  private static instance = new EventsController();

  private constructor() { }

  public static getInstance(): EventsController {
    return EventsController.instance;
  }

  private handleAPIError(error) {
    if (error instanceof APIErr) {
      throw error;
    }
    throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, "Internal server error");
  }

  async scheduleEvent(event: IEvent): Promise<IAPIRes> {
    try {
      validateEvent(event);
      const existingEvent = await EventModel.findOne({
        'eventSchedule.date': event.eventSchedule.date,
        'eventSchedule.time': event.eventSchedule.time,
        venue: event.venue,
      });

      if (existingEvent) {
        throw new APIErr(APIStatus.BAD_REQUEST, 'Another event already scheduled in the same venue at the same time');
      }

      const newEvent = await EventModel.create(event);
      await reminderService.scheduleReminder(newEvent._id);
      return new APIRes(APIStatus.OK, 'Event scheduled successfully', newEvent);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async getEvents({ venue, location, sortBy }): Promise<IAPIRes> {
    try {
      const sortOptionsMap = {
        popularity: { participants: -1 },
        date: { 'eventSchedule.date': 1, 'eventSchedule.time': 1 },
        creationTime: { createdAt: 1 },
      };
  
      const allowedSortOptions = Object.keys(sortOptionsMap);
  
      if (sortBy && !allowedSortOptions.includes(sortBy)) {
        throw new APIErr(APIStatus.BAD_REQUEST, `Invalid sort option. Allowed options are: ${allowedSortOptions.join(', ')}`);
      }
  
      const query: any = { venue, location };
      const sortOptions = sortBy ? sortOptionsMap[sortBy] : {}
  
      const events = await EventModel.find(query).sort(sortOptions);
      return new APIRes(APIStatus.OK, 'Events retrieved successfully', events);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async getEventById(eventId: string): Promise<IAPIRes> {
    try {
      if (!eventId) {
        throw new APIErr(APIStatus.BAD_REQUEST, "Event ID is required");
      }
      const event = await EventModel.findById(eventId);
      if (!event) {
        throw new APIErr(APIStatus.NOT_FOUND, 'Event not found');
      }
      return new APIRes(APIStatus.OK, 'Event retrieved successfully', event);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async updateEvent(eventId: string, updatedData: Partial<IEvent>): Promise<IAPIRes> {
    try {
      if (!eventId) {
        throw new APIErr(APIStatus.BAD_REQUEST, "Event ID is required");
      }
      validatePartialEvent(updatedData);
      const updatedEvent = await EventModel.findByIdAndUpdate(eventId, updatedData, { new: true });
      if (!updatedEvent) {
        throw new APIErr(APIStatus.NOT_FOUND, 'Event not found');
      }
      return new APIRes(APIStatus.OK, 'Event updated successfully', updatedEvent);
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async deleteEvent(eventId: string): Promise<IAPIRes> {
    try {
      if (!eventId) {
        throw new APIErr(APIStatus.BAD_REQUEST, "Event ID is required");
      }
      const deletedEvent = await EventModel.findByIdAndDelete(eventId);
      if (!deletedEvent) {
        throw new APIErr(APIStatus.NOT_FOUND, 'Event not found');
      }
      return new APIRes(APIStatus.OK, 'Event deleted successfully', deletedEvent);
    } catch (error) {
      this.handleAPIError(error);
    }
  }


  private batchHandleError(operation: string, itemId: string, error: Error, errors: string[]) {
    const errorMessage = `Error ${operation} for item with ID ${itemId}: ${error.message}`;
    console.error(errorMessage);
    errors.push(errorMessage);
  }
  
  private batchHandleAPIError(error: Error, errors: string[]) {
    if (error instanceof APIErr) {
      throw error;
    }
    throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, error.message, null, errors);
  }

  private async handleBatchOperation(operation: Function, items: any[], operationName: string): Promise<IAPIRes> {
    const errors: string[] = [];
    const result: IAPIRes = { data: [] };

    try {
      await Promise.all(
        items.map(async (item) => {
          try {
            const res = await operation(item);
            result.data.push({ status: 'success', event: res.data });
          } catch (error) {
            this.batchHandleError(operationName, item._id || item.id, error, errors);
          }
        })
      );

      if (errors.length > 0) {
        result.status = APIStatus.PARTIAL_SUCCESS;
        result.message = 'Some operations completed with errors';
        result.errors = errors;
      }

      return result;
    } catch (error) {
      this.batchHandleAPIError(error, errors);
    }
  }

  async batchCreate(eventsData: IEvent[]): Promise<IAPIRes> {
    return this.handleBatchOperation(this.scheduleEvent, eventsData, 'scheduling reminder');
  }

  async batchUpdate(updates: { id: string; data: Partial<IEvent> }[]): Promise<IAPIRes> {
    return this.handleBatchOperation(this.updateEvent, updates, 'updating event');
  }

  async batchDelete(ids: string[]): Promise<IAPIRes> {
    return this.handleBatchOperation(this.deleteEvent, ids, 'deleting event');
  }

  async batchOperations(data: IBatchData): Promise<IAPIRes> {
    const result = new APIResBase();
    const errors: string[] = [];

    try {
      const { create, update, deleteIds } = data;

      if (create && create.length > 0) {
        const createResult = await this.batchCreate(create);
        result.data = { create: createResult.data };
        if (createResult.status === APIStatus.PARTIAL_SUCCESS) {
          errors.push(...createResult.errors);
        }
      }

      if (update && update.length > 0) {
        const updateResult = await this.batchUpdate(update);
        result.data = { ...result.data, update: updateResult.data };
        if (updateResult.status === APIStatus.PARTIAL_SUCCESS) {
          errors.push(...updateResult.errors);
        }
      }

      if (deleteIds && deleteIds.length > 0) {
        const deleteResult = await this.batchDelete(deleteIds);
        result.data = { ...result.data, delete: deleteResult.data };
        if (deleteResult.status === APIStatus.PARTIAL_SUCCESS) {
          errors.push(...deleteResult.errors);
        }
      }

      if (errors.length > 0) {
        result.status = APIStatus.PARTIAL_SUCCESS;
        result.message = 'Some operations completed with errors';
        result.errors = errors;
      }

      return result;
    } catch (error) {
      this.batchHandleAPIError(error, errors);
    }
  }
}

export default EventsController.getInstance();