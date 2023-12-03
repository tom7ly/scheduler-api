# Use an official Node.js runtime as the base image
FROM node:20.6.1

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# If you are building your code for production, run `npm ci --only=production`

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 3000 for the application
EXPOSE 8000

# Define the command to run the application
CMD [ "npm", "run", "dev" ]