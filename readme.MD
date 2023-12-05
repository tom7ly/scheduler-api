###


# API Request Guide
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
}
```
**Response**:
```
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
      }
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