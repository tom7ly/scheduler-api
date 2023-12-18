
import eventsController from '../../controllers/events-controller';
const express = require('express');
const router = express.Router();
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { param, } from 'express-validator';
import { IEvent } from '../../models/event';
import { IAPIRes } from '../../utils/custom-error';
import reminderService from '../../services/reminders-service';
import { validateBatchOperations, validateGetEventById, validateGetEvents, validateScheduleEvent, validateUpdateEvent } from '../events/events.validator';
import { IReminderJob, ReminderJobModel } from '../../models/reminder-job';


router.get('/jobs', async (req, res) => {
  try {
    const jobs = await reminderService.getAllJobs();
    res.status(200).json(jobs);
  } catch (error) {
    console.log(error);
    res.status(error.status).json({ message: error.message });
  }
});

router.delete('/jobs/:jobId', param('jobId'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const reminder: IReminderJob = await ReminderJobModel.findOne({ jobId: jobId });
    if (!reminder) {
      return res.status(404).json({ message: `Job with ID ${jobId} not found` });
    }
    const result: IReminderJob = await reminderService.cancelReminder(reminder);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
})


export default router;
