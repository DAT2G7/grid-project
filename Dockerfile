FROM node:20-alpine3.16

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY dist/ ./dist
COPY src/ ./src
COPY bundle.js ./bundle.js

ENV JOBS_DB_PATH="/data/jobs.json"
ENV GRID_SERVER_ENDPOINT="http://localhost:3000"
ENV TASK_REQUEST_ENDPOINT="http://localhost:3000"
ENV TASK_RESULT_ENDPOINT="http://localhost:3000"

RUN npm install

EXPOSE 3000
EXPOSE 3443

CMD ["npm", "run", "start"]