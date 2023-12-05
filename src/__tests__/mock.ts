import { IBatchData, IEvent } from "../models/event";

/**
 * [PATH] src/__tests__/mock.ts
 * This file contains the mock data and functions used in the tests
 */

const venueOptions = ['venue1', 'venue2', 'venue3'];
const titleOptions = ['title1', 'title2', 'title3'];
const participantsOptions = [10, 20, 30];
const locationOptions = ['location1', 'location2', 'location3'];

export const getMockedEvent = (
  id: number = 0,
  title: string = titleOptions[0],
  venue: string = venueOptions[0],
  participants: number = participantsOptions[0],
  location: string = locationOptions[0],
  minutes: number = 5
) => {
  const now = new Date();
  const timeInMinutes = new Date(now.getTime() + minutes * 60000);
  return {
    _id: `mockId${id}`,
    title,
    description: 'mockDescription',
    venue,
    eventSchedule: {
      date: new Date(now.toISOString().split('T')[0]).toString(),
      time: timeInMinutes.toString(),
    },
    participants,
    createdAt: now,
    location,
  };
}

export const getMockEvents = (n: number = 5) => {
  const mockedEvents = [];
  for (let i = 0; i < n; i++) {
    const venue = venueOptions[Math.floor(Math.random() * venueOptions.length)];
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
    const participants = participantsOptions[Math.floor(Math.random() * participantsOptions.length)];
    const location = locationOptions[Math.floor(Math.random() * locationOptions.length)];
    const minutes = Math.floor(Math.random() * 60);
    const event = getMockedEvent(i, title, venue, participants, location, minutes);
    mockedEvents.push(event);
  }
  return mockedEvents;
}

export const getMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

export const getMockRequest = (options: {
  venue?: string;
  location?: string;
  sortBy?: string;
} = {}): Request => {
  const { venue = 'venue1', location = 'location1', sortBy = 'popularity' } = options;

  return {
    query: {
      venue,
      location,
      sortBy,
    },
  } as unknown as Request;
};

export const getMockQuery = (options: {
  venue?: string;
  location?: string;
  sortBy?: string;
} = {}): {} => {
  const { venue = 'venue1', location = 'location1', sortBy = 'popularity' } = options;
  return {venue, location, sortBy};
};

export const getMockBatchData = (n: number = 5): IBatchData => {
  const operations = ['create', 'update', 'delete'];
  const mockBatchData: IBatchData = { create: [], update: [], deleteIds: [] };
  for (let i = 0; i < n; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const data = getMockedEvent(i);
    switch (operation) {
      case 'create':
        mockBatchData.create.push(data);
        break;
      case 'update':
        mockBatchData.update.push({ id: data._id, data: { ...data } });
        break;
      case 'delete':
        mockBatchData.deleteIds.push(data._id);
        break;
    }
  }
  return mockBatchData;
};