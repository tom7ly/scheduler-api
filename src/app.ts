// app.ts
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import eventRoutes from './routes/events';
const cors = require('cors');
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

const  mongoURI = process.env.RUNNING_IN_DOCKER ? "mongodb://mongo:27017" : "mongodb://localhost:27017";
mongoose.connect(mongoURI)
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api', eventRoutes); // Prefix all routes with '/api'

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
