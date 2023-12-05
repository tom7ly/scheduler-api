###

# Installation
This application requires Docker Compose to be installed on your system. 

To initialize the application, navigate to the project directory in your terminal and run the following command:

```shell
docker-compose up
```
Note that if you are linux then you should make sure you have docker-compose:
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose --version
```


# Repository Structure
```shell
├── __tests__
│   ├── events-controller.test.ts
│   └── mock.ts
├── app.ts
├── controllers
│   └── events-controller.ts
├── models
│   ├── client.ts
│   └── event.ts
├── routes
│   ├── events.ts
│   └── validators
│       └── events.validator.ts
├── services
│   └── reminders-service.ts
└── utils
    ├── custom-error.ts
    └── helpers.ts
```
- `__tests__`: Contains tests and mock data.
- `app.ts`: Main entry point.
- `controllers`: Contains controllers, e.g., `events-controller.ts` for events.
- `models`: Contains models, e.g., `client.ts` and `event.ts` for clients and events respectively.
- `routes`: Contains routes and validators, e.g., `events.ts` for event routes and `events.validator.ts` for event route validation.
- `services`: Contains services, e.g., `reminders-service.ts` for reminders.
- `utils`: Contains utilities, e.g., `custom-error.ts` for custom errors and `helpers.ts` for helper functions.
# Architecture Overview
- **Client**: The client sends requests to the routes. These requests can be for fetching, creating, updating, or deleting data.

- **Routes**: The routes receive requests from the client and forward them to the appropriate controllers. They also handle request validation.

- **Controllers**: The controllers receive requests from the routes. They perform operations based on these requests, including database operations, and then send responses back to the client.

- **Services**: The services handle specific logic of the application, such as interacting with queues or performing other operations. They are used by controllers and other services but do not directly access databases. In the case of this application, our service is used to encapsulate the bee-queue

# Packages and tools used
- `bee-queue`: A simple, fast, robust job/task queue for Node.js, backed by Redis.


- `express`: Fast, unopinionated, minimalist web framework for Node.js.

- `express-rate-limit`: Middleware for express routes that rate-limits incoming requests.

- `express-validator`: An express.js middleware for validator.js.

- `joi`: Powerful schema description language and data validator for JavaScript.

- `typescript`: A language for application-scale JavaScript development.

- `uuid`: Simple, fast generation of RFC4122 UUIDs.

- `ws`: Simple to use, blazing fast, and thoroughly tested WebSocket client and server for Node.js.

- `jest`: A delightful JavaScript Testing Framework with a focus on simplicity.

- `mongoose`: MongoDB object modeling designed to work in an asynchronous environment.

- `ts-node`: TypeScript execution and REPL for Node.js, with source map support.

**We are also using `Redis` indirectly for the queue**

# API 
Use the following API rule for each request, depending on where you run the docker.

the default is localhost
```ts
http://localhost:800/api/
```
## 1. Schedule Event

**Request:**
```js
POST /events
Content-Type: application/json

{
  "title": "Sample Event",
  "description": "A description of the event",
  "location": "Sample Location",
  "venue": "Sample Venue",
  "eventSchedule": {
    "date": "2023-12-31",
    "time": "18:00"
  }
    "participants": 100
}
```
**Response**:
```js
{
  "status": 200,
  "message": "Event scheduled successfully",
  "data": {
    "eventId": "generated-event-id"
  }
}
```

## 2. Get Events
**Request:**

Note: The sortBy parameter can take one of the following values: `popularity`, `date`, or `creationTime`. If sortBy is not provided, the events will be returned in the order they were added.
```js
GET /events?venue=SampleVenue&location=SampleLocation&sortBy=date
```


Response:
```js
{
  "status": 200,
  "data": [
    {
      "eventId": "event-id-1",
      "title": "Sample Event 1",
      "description": "A description of the event",
      "location": "Sample Location",
      "venue": "Sample Venue",
      "eventSchedule": {
        "date": "2023-12-31",
        "time": "18:00"
      },
    "participants": 100
    },
    {
        // Additional Events
    }
  ]
}
```

## 3. Batch Operations
**Request:**
```js
POST /events/batch
{
  "create": [
    { "title": "Event 1", "location": "Location 1", "venue": "Venue 1", "eventSchedule": { "date": "2023-12-31", "time": "18:00" } }
  ],
  "update": [
    { "eventId": "event-id-1", "title": "Updated Event Title" }
  ],
  "deleteIds": ["event-id-2", "event-id-3"]
}
```
**Response:**
```js
{
  "status": 200,
  "message": "Batch operations completed successfully",
  "data": {
    "created": ["event-id-4"],
    "updated": ["event-id-1"],
    "deleted": ["event-id-2", "event-id-3"]
  }
}
```
## 4. Get Event by ID
**Request:**
```js
GET /events/event-id-1
```
```js
Response:
{
  "status": 200,
  "data": {
    "eventId": "event-id-1",
    "title": "Updated Event Title",
    // Other event details...
  }
}
```
## 5. Update Event

**Request:**
```js
PUT /events/event-id-1
{
  "title": "New Event Title"
}
```
**Response:**
```js
{
  "status": 200,
  "message": "Event updated successfully",
  "data": {
    "eventId": "event-id-1"
  }
}
```
## 6. Delete Event
**Request:**
```js
DELETE /events/{eventId}
```
**Response:**
```js
{
  "status": 200,
  "message": "Event deleted successfully",
  "data": {
    "eventId": "event-id-1"
  }
}
```

# UNIT TESTING
There are unit tests provided in the `__tests__` folder.
The tests are for the `events-controller.ts` and specificly for all operations except the batch operations. the batch operations heavily rely on the single operations so there are only unit tests available for the single operations.
use npm