import { body, param, validationResult } from 'express-validator';

/**
 * [PATH] src/routes/validators/events.validator.ts
 * This file contains the validation logic for the events routes.
 */

export const validateBatchOperations = [
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

export const validateScheduleEvent = [
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

export const validateGetEvents = (req, res, next) => {
  const { venue, location, sortBy } = req.query;
  if (venue && typeof venue !== 'string') {
    return res.status(400).json({ error: 'Venue must be a string' });
  }
  if (location && typeof location !== 'string') {
    return res.status(400).json({ error: 'Location must be a string' });
  }
  if (sortBy && !['popularity', 'date', 'creationTime'].includes(sortBy)) {
    return res.status(400).json({ error: 'SortBy must be either "popularity", "date", or "creationTime"' });
  }
  req.validatedData= {venue, location, sortBy}
  next();
};

export const validateUpdateEvent = [
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

export const validateGetEventById = [
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