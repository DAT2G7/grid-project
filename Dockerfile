FROM node:20-alpine3.16

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY dist/ ./dist
COPY src/ ./src
COPY bundle.js ./bundle.js

ENV JOBS_DB_PATH="/data/jobs.json"

RUN npm install

EXPOSE 3000
EXPOSE 3443

CMD ["npm", "run", "start"]