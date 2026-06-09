FROM node:22-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package*.json ./
RUN npm ci

FROM dependencies AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM dependencies AS production
ENV NODE_ENV=production
COPY . .
ARG DATABASE_URL=postgresql://user:password@localhost:5432/bengkel_db
ENV DATABASE_URL=$DATABASE_URL
RUN npm run db:generate
EXPOSE 4000
CMD ["npm", "start"]
