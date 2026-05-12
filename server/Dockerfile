# ---- Base Node Image ----
FROM node:20-alpine

# ---- Set Working Directory ----
WORKDIR /app

# ---- Copy Package Files ----
COPY package*.json ./

# ---- Install Dependencies ----
RUN npm ci --omit=dev=false

# ---- Copy Source Code ----
COPY . .

# ---- Build TypeScript ----
RUN npm run build

# ---- Expose Server Port ----
EXPOSE 5000

# ---- Start Server ----
CMD ["node", "dist/index.js"]
