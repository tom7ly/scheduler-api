import { Request, Response } from 'express';
import { EventsController } from '../controllers/events-controller';
import { getMockEvents, getMockResponse, getMockRequest, getMockedEvent, getMockQuery, allowedSortOptions } from './mock';
import reminderService from '../services/reminders-service';
import { EventModel, IEvent } from '../models/event';
import { APIErr, APIRes, APIStatus } from '../utils/custom-error';
/**
 * [PATH] src/__tests__/events-controller.test.ts
 * This file contains the tests for the events controller.
 */

const mockEvents = getMockEvents();

jest.mock('../services/reminders-service')
const scheduleReminderMock = jest.spyOn(reminderService, 'scheduleReminder');

jest.mock('../models/event', () => ({
  EventModel: {
    create: jest.fn().mockImplementation((event) => event),
  },
  validateEvent: jest.fn().mockImplementation((event) => event),
  validatePartialEvent: jest.fn().mockImplementation((event) => event),
}));

describe('EventsController', () => {
  let eventsController: EventsController;

  beforeEach(() => {
    eventsController = EventsController.getInstance();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.clearAllMocks();
  });
  afterEach(async () => {
    await reminderService.queue.close();
  });
  describe('scheduleEvent', () => {
    it('should schedule an event successfully', async () => {
      const mockEvent: IEvent = getMockedEvent();
      const findMock = jest.fn().mockResolvedValue(null);
      EventModel.findOne = findMock;
      const scheduleReminderMock = jest.spyOn(reminderService, 'scheduleReminder');
      scheduleReminderMock.mockResolvedValue(new APIRes(APIStatus.OK, 'Reminder scheduled successfully', null));

      const result = await eventsController.scheduleEvent(mockEvent);

      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Event scheduled successfully');
      expect(result.data).toEqual(mockEvent);
      expect(reminderService.scheduleReminder).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle failure when scheduling a reminder', async () => {
      const mockEvent: IEvent = getMockedEvent();
      const scheduleReminderMock = jest.spyOn(reminderService, 'scheduleReminder');
      scheduleReminderMock.mockRejectedValue(new APIErr(APIStatus.INTERNAL_SERVER_ERROR, 'Error scheduling reminder.'));

      await expect(eventsController.scheduleEvent(mockEvent)).rejects.toThrow('Error scheduling reminder.');
      expect(reminderService.scheduleReminder).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('getEvents', () => {
    it('should retrieve events successfully', async () => {
      const mockQuery: Request = getMockQuery();
      EventModel.find = jest.fn().mockImplementation(() => {
        return {
          sort: jest.fn().mockResolvedValue(mockEvents)
        };
      });
      const result = await eventsController.getEvents(mockQuery);

      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Events retrieved successfully');
      expect(result.data).toEqual(mockEvents);
      expect(EventModel.find).toHaveBeenCalledWith({ venue: mockQuery.venue, location: mockQuery.location });

    });
    it('should handle failure when retrieving events', async () => {
      const mockQuery: Request = getMockQuery();
      EventModel.find = jest.fn().mockImplementation(() => {
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve events');
      });
      await expect(eventsController.getEvents(mockQuery)).rejects.toThrow('Failed to retrieve events');
      expect(EventModel.find).toHaveBeenCalledWith({ venue: mockQuery.venue, location: mockQuery.location });
    });
    it('should retrieve events sorted by popularity', async () => {

      const mockQuery: Request = getMockQuery({ sortBy: 'popularity' });
      EventModel.find = jest.fn().mockImplementation(() => {
        return {
          sort: jest.fn().mockResolvedValue(mockEvents)
        };
      })
      const result = await eventsController.getEvents(mockQuery);

      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Events retrieved successfully');
      expect(result.data).toEqual(mockEvents);
      expect(EventModel.find).toHaveBeenCalledWith({ venue: mockQuery.venue, location: mockQuery.location });
    });

    it('should retrieve events sorted by date', async () => {
      const mockQuery: Request = getMockQuery({ sortBy: 'date' });
      const result = await eventsController.getEvents(mockQuery);
      
      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Events retrieved successfully');
      expect(result.data).toEqual(mockEvents);
      expect(EventModel.find).toHaveBeenCalledWith({ venue: mockQuery.venue, location: mockQuery.location });
    });

    it('should retrieve events sorted by creationTime', async () => {
      const mockQuery: Request = getMockQuery({ sortBy: 'creationTime' });
      const result = await eventsController.getEvents(mockQuery);

      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Events retrieved successfully');
      expect(result.data).toEqual(mockEvents);
      expect(EventModel.find).toHaveBeenCalledWith({ venue: mockQuery.venue, location: mockQuery.location });
    });

    it('should handle unknown sortBy values', async () => {
      const mockQuery: Request = getMockQuery({ sortBy: 'unknownValue' });
      await expect(eventsController.getEvents(mockQuery)).rejects.toThrow( `Invalid sort option. Allowed options are: ${allowedSortOptions.join(', ')}`);
    });


    it('should handle failure when retrieving events', async () => {
      const mockQuery: Request = getMockQuery();
      EventModel.find = jest.fn().mockImplementation(() => {
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve events');
      });
      await expect(eventsController.getEvents(mockQuery)).rejects.toThrow('Failed to retrieve events');
      expect(EventModel.find).toHaveBeenCalledWith({ venue: mockQuery.venue, location: mockQuery.location });
    });


  });

  describe('getEventById', () => {
    it('should retrieve an event by id successfully', async () => {
      const mockEvent: IEvent = getMockedEvent();
      EventModel.findById = jest.fn().mockResolvedValue(mockEvent);

      const result = await eventsController.getEventById(mockEvent._id);

      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Event retrieved successfully');
      expect(result.data).toEqual(mockEvent);
    });

    it('should handle failure when retrieving an event by id', async () => {
      const mockEvent: IEvent = getMockedEvent();
      EventModel.findById = jest.fn().mockImplementation(() => {
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve event');
      });

      await expect(eventsController.getEventById(mockEvent._id)).rejects.toThrow('Failed to retrieve event');
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const mockEvent: IEvent = getMockedEvent();
      const updatedData: Partial<IEvent> = { title: 'Updated Event' };
      EventModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockEvent, ...updatedData });
      const result = await eventsController.updateEvent(mockEvent._id, updatedData);
      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Event updated successfully');
      expect(result.data).toEqual({ ...mockEvent, ...updatedData });
    });

    it('should handle failure when updating an event', async () => {
      const mockEvent: IEvent = getMockedEvent();
      const updatedData: Partial<IEvent> = { title: 'Updated Event' };
      EventModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new APIErr(APIStatus.INTERNAL_SERVER_ERROR, 'Failed to update event');
      });

      await expect(eventsController.updateEvent(mockEvent._id, updatedData)).rejects.toThrow('Failed to update event');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      const mockEvent: IEvent = getMockedEvent();
      EventModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockEvent);

      const result = await eventsController.deleteEvent(mockEvent._id);

      expect(result.status).toEqual(APIStatus.OK);
      expect(result.message).toEqual('Event deleted successfully');
      expect(result.data).toEqual(mockEvent);
    });
  })
});




