FROM node:18-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
