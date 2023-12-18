import { body, param, validationResult } from 'express-validator';

const isNotEmpty = field => body(field).notEmpty().withMessage(`${field} cannot be empty`);
const isOptionalArray = field => body(field).isArray().optional();
const isMongoId = field => param(field).isMongoId().withMessage(`${field} must be a valid Mongo ID`);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid request body", errors: errors.array() });
  }
  next();
};

// Refactored Validators
export const validateBatchOperations = [
  isOptionalArray('create'),
  isOptionalArray('update'),
  isOptionalArray('deleteIds'),
  handleValidationErrors,
  (req, res, next) => {
    req.validatedData = {
      create: req.body.create || [],
      update: req.body.update || [],
      deleteIds: req.body.deleteIds || [],
    };
    next();
  },
];

export const validateScheduleEvent = [
  isNotEmpty('title'),
  isNotEmpty('description'),
  isNotEmpty('location'),
  isNotEmpty('venue'),
  isNotEmpty('eventSchedule.date'),
  isNotEmpty('eventSchedule.time'),
  handleValidationErrors,
  (req, res, next) => {
    req.validatedData = req.body;
    next();
  },
];

export const validateUpdateEvent = [
  isMongoId('eventId'),
  body('title').optional(),
  body('description').optional(),
  body('location').optional(),
  body('venue').optional(),
  body('eventSchedule.date').optional(),
  body('eventSchedule.time').optional(),
  handleValidationErrors,
  (req, res, next) => {
    req.validatedData = {
      eventId: req.params.eventId,
      data: req.body,
    };
    next();
  },
];

export const validateGetEventById = [
  isMongoId('eventId'),
  handleValidationErrors,
  (req, res, next) => {
    req.validatedData = { eventId: req.params.eventId };
    next();
  },
];

export const validateGetEvents = [
  (req, res, next) => {
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
    req.validatedData = { venue, location, sortBy };
    next();
  }
];
