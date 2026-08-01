FROM node:22-bookworm-slim

WORKDIR /app

# better-sqlite3 needs to compile its native binding for the container's
# platform -- copying node_modules built on the host (e.g. macOS) would
# produce a binary Linux can't load.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
EXPOSE 1337

CMD ["npm", "run", "develop"]
