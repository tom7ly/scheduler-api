// batch-controller.ts
import { IBatchData } from '../models/batch';
import { EventModel, IEvent } from '../models/event';
import { IControllerResult } from './events-controller';
import eventsController from './events-controller';
import reminderService from '../services/reminders-service';

interface IBatchControllerResult extends IControllerResult {
  errors?: string[];
}

class BatchController {
  private static instance: BatchController;

  private constructor() {}

  public static getInstance(): BatchController {
    if (!BatchController.instance) {
      BatchController.instance = new BatchController();
    }
    return BatchController.instance;
  }

  private handleError(operation: string, itemId: string, error: Error, errors: string[]) {
    console.error(`Error ${operation} for item with ID ${itemId}: ${error.message}`);
    errors.push(`Error ${operation} for item with ID ${itemId}: ${error.message}`);
  }

  async batchCreate(eventsData: IEvent[]): Promise<IBatchControllerResult> {
    const result: IBatchControllerResult = { status: 'success', data: [] };
    const errors: string[] = [];

    try {
      const createdEvents = await EventModel.create(eventsData);

      await Promise.all(
        createdEvents.map(async (event) => {
          try {
            await eventsController.scheduleReminderAfterEventCreationOrUpdate(event);
            result.data.push({ status: 'success', event });
          } catch (error) {
            this.handleError('scheduling reminder', event._id, error, errors);
          }
        })
      );

      if (errors.length > 0) {
        result.status = 'partialSuccess';
        result.message = 'Some operations completed with errors';
        result.errors = errors;
      }

      return result;
    } catch (error) {
      console.error(error);
      throw { status: 'error', message: error.message}
    }
  }

  async batchUpdate(updates: { id: string; data: Partial<IEvent> }[]): Promise<IBatchControllerResult> {
    const result: IBatchControllerResult = { status: 'success', data: [] };
    const errors: string[] = [];

    try {
      const updatedEvents = await Promise.all(
        updates.map(async ({ id, data }) => {
          try {
            const updatedEvent = await EventModel.findByIdAndUpdate(id, data, { new: true });
            if (updatedEvent) {
              await reminderService.scheduleReminder(id);
              result.data.push({ status: 'success', event: updatedEvent });
              return updatedEvent;
            } else {
              this.handleError('updating', id, new Error(`Event with ID ${id} not found`), errors);
              return null;
            }
          } catch (error) {
            this.handleError('scheduling reminder', id, error, errors);
            return null;
          }
        })
      );

      if (errors.length > 0) {
        result.status = 'partialSuccess';
        result.message = 'Some operations completed with errors';
        result.errors = errors;
      }

      return result;
    } catch (error) {
      console.error(error);
      throw { status: 'error', message: error.message}
    }
  }

  async batchDelete(ids: string[]): Promise<IBatchControllerResult> {
    const result: IBatchControllerResult = { status: 'success', data: 'Batch delete completed successfully' };
    const errors: string[] = [];

    try {
      await Promise.all(
        ids.map(async (id) => {
          try {
            const deletedEvent = await EventModel.findByIdAndDelete(id);
            if (deletedEvent) {
              await reminderService.cancelReminder(id);
            } else {
              this.handleError('deleting', id, new Error(`Event with ID ${id} not found`), errors);
            }
          } catch (error) {
            this.handleError('canceling reminder', id, error, errors);
          }
        })
      );

      if (errors.length > 0) {
        result.status = 'partialSuccess';
        result.message = 'Some operations completed with errors';
        result.errors = errors;
      }

      return result;
    } catch (error) {
      console.error(error);
      throw { status: 'error', message: error.message}
    }
  }

  async batchOperations(data: IBatchData): Promise<IBatchControllerResult> {
    const result: IBatchControllerResult = { status: 'success', data: null };
    const errors: string[] = [];

    try {
      const { create, update, deleteIds } = data;

      if (create && create.length > 0) {
        const createResult = await this.batchCreate(create);
        result.data = { create: createResult.data };
        if (createResult.status === 'partialSuccess') {
          errors.push(...createResult.errors);
        }
      }

      if (update && update.length > 0) {
        const updateResult = await this.batchUpdate(update);
        result.data = { ...result.data, update: updateResult.data };
        if (updateResult.status === 'partialSuccess') {
          errors.push(...updateResult.errors);
        }
      }

      if (deleteIds && deleteIds.length > 0) {
        const deleteResult = await this.batchDelete(deleteIds);
        result.data = { ...result.data, delete: deleteResult.data };
        if (deleteResult.status === 'partialSuccess') {
          errors.push(...deleteResult.errors);
        }
      }

      if (errors.length > 0) {
        result.status = 'partialSuccess';
        result.message = 'Some operations completed with errors';
        result.errors = errors;
      }

      return result;
    } catch (error) {
      console.error(error);
      throw  { status: 'error', message: error.message}
    }
  }
}

export default BatchController.getInstance();
