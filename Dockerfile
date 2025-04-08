# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY .env .env

COPY . .

# Stage 2: Run
FROM node:18-alpine

RUN npm install -g pm2

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["pm2-runtime", "start", "./bin/www"]