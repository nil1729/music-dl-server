# Use a minimal Alpine Linux base image
FROM node:16.17.0-alpine

# Set working directory in the container
WORKDIR /usr/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code to the container
COPY . .

# Set environment variables (if necessary)
ENV NODE_ENV=production
ENV CORE_SERVICE_PORT=9090

# Expose the port that your Node.js application listens on
EXPOSE $CORE_SERVICE_PORT

# Run the Node.js application
CMD ["npm", "start"]
