FROM node:22-alpine
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm ci

# 2. Build the app
COPY . .
RUN npm run build

# 3. AWS Environment fix
ENV PORT 3500
EXPOSE 3000

# Start it up
CMD ["npm", "start"]
