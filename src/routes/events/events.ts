
import eventsController from '../../controllers/events-controller';
const express = require('express');
const router = express.Router();
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { param, } from 'express-validator';
import { IEvent } from '../../models/event';
import { IAPIRes } from '../../utils/custom-error';
import reminderService from '../../services/reminders-service';
import { validateBatchOperations, validateGetEventById, validateGetEvents, validateScheduleEvent, validateUpdateEvent } from './events.validator';

/**
 * [PATH] src/routes/events.ts
 * This file contains the routes for the events API.
 */

router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
  })
);
router.post('/events',validateScheduleEvent, async (req, res: Response) => {
  try {
    const eventData: IEvent = req.validatedData;
    const result = await eventsController.scheduleEvent(eventData);
    return res.status(result.status).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }

})
router.get('/events', validateGetEvents, async (req, res) => {
  try {
    const result = await eventsController.getEvents(req.validatedData);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
});

router.post('/events/batch', validateBatchOperations, async (req, res) => {
  try {
    const result: IAPIRes = await eventsController.batchOperations(req.validatedData);
    return res.status(result.status).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
});

router.get('/events/:eventId', validateGetEventById, async (req, res) => {
  try {
    const result = await eventsController.getEventById(req.validatedData.eventId);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
});

router.put('/events/:eventId', validateUpdateEvent, async (req, res) => {
  try {
    const result = await eventsController.updateEvent(req.validatedData.eventId, req.validatedData.data);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
});

router.delete('/events/:eventId', param('eventId').isMongoId(), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const result = await eventsController.deleteEvent(eventId);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
});



export default router;
