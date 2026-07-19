FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/scanner-runner/package.json packages/scanner-runner/package.json
COPY packages/security-core/package.json packages/security-core/package.json
COPY packages/plugin-sdk/package.json packages/plugin-sdk/package.json
RUN npm install
COPY . .
RUN npm run build -w @sentinel/security-core && npm run build -w @sentinel/plugin-sdk && npm run build -w @sentinel/scanner-runner && npm run build -w @sentinel/worker
USER node
CMD ["npm","run","start","-w","@sentinel/worker"]
