// routes/events.ts
import { SchedulingConflictError, EventNotFoundError } from '../utils/custom-error';
import eventsController from '../controllers/events-controller';
const express = require('express');
const router = express.Router();
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { IEvent } from '../models/event';
import batchController from '../controllers/batch-controller';
import { IControllerResult } from '../controllers/events-controller';
import reminderService from '../services/reminders-service';
// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
});




// Access the globally initialized EventsController instance
const validateBatchOperations = [
  body('create').isArray().optional(),
  body('update').isArray().optional(),
  body('deleteIds').isArray().optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.validatedData = {
      create: req.body.create || [],
      update: req.body.update || [],
      deleteIds: req.body.deleteIds || [],
    };
    next();
  },
];

const validateScheduleEvent = [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('location').notEmpty(),
  body('venue').notEmpty(),
  body('eventSchedule.date').notEmpty(),
  body('eventSchedule.time').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.validatedData = req.body;
    next();
  },
];

const validateUpdateEvent = [
  param('eventId').isMongoId(),
  body('title').optional(),
  body('description').optional(),
  body('location').optional(),
  body('venue').optional(),
  body('eventSchedule.date').optional(),
  body('eventSchedule.time').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.validatedData = {
      eventId: req.params.eventId,
      data: req.body,
    };
    next();
  },
];

const validateGetEventById = [
  param('eventId').isMongoId(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.validatedData = { eventId: req.params.eventId };
    next();
  },
];

router.post('/events', validateScheduleEvent, async (req, res) => {
  try {
    const eventData: IEvent = req.validatedData;
    await eventsController.scheduleEvent(eventData);
    res.status(201).json({ message: 'Event scheduled successfully' });
  } catch (error) {
    console.error(error);

    if (error instanceof SchedulingConflictError) {
      return res.status(409).json({ error: 'Scheduling conflict detected' });
    } else if (error instanceof EventNotFoundError) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const result = await eventsController.getEvents(req, res);
    if (result.status === 'success') {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ error: result.message || 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/events/batch', validateBatchOperations, async (req, res) => {
  try {
    const result = await batchController.batchOperations(req.validatedData);
    if (result.status === 'success') {
      res.status(200).json({ message: 'Batch operations completed successfully' });
    } else {
      res.status(500).json({ error: result.message || 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/events/:eventId', validateGetEventById, async (req, res) => {
  try {
    const result = await eventsController.getEventById(req.validatedData.eventId);
    if (result.status === 'success') {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ error: result.message || 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);

    if (error instanceof EventNotFoundError) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/events/:eventId', validateUpdateEvent, async (req, res) => {
  try {
    const result = await eventsController.updateEvent(req.validatedData.eventId, req.validatedData.data);
    if (result.status === 'success') {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ error: result.message || 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);

    if (error instanceof EventNotFoundError) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/events/:eventId', param('eventId').isMongoId(), async (req, res) => {
  try {
    const result = await eventsController.deleteEvent(req.validatedData.eventId);
    if (result.status === 'success') {
      res.status(204).json({ message: 'Event deleted successfully' });
    } else {
      res.status(500).json({ error: result.message || 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);

    if (error instanceof EventNotFoundError) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await reminderService.getAllJobs();
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.delete('/events', async (req, res) => {
  try {
    const result = await eventsController.deleteAllEvents();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
