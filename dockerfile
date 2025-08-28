# Build

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY  . . 
RUN npm run build

# Run

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

ENV HOSTNAME=0.0.0.0

# Copy the minimal runtime produced by Next.js
COPY --from=builder /app/.next/standalone ./
# Static assets and public files
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080

# The standalone build includes its own server entrypoint
CMD ["node", "server.js"]