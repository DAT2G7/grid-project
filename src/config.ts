import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig();

export const DEFAULT_MODE = "debug";
export const DEFAULT_PORT = 3001;
export const DEFAULT_JOBS_DB_PATH = "./jobs.json";
export const DEFAULT_FINISHED_JOBS_DB_PATH = "./finishedJobs.json";
export const DEFAULT_TASK_REQUEST_ENDPOINT = "http://localhost:3001/get-task";
export const DEFAULT_TASK_RESULT_ENDPOINT = "http://localhost:3001/submit-task";
export const DEFAULT_GRID_SERVER_ENDPOINT = "http://localhost:3000";

export const MODE = process.env.MODE || DEFAULT_MODE;
export const PORT = process.env.PORT || DEFAULT_PORT;

export const TASK_REQUEST_ENDPOINT =
    process.env.TASK_REQUEST_ENDPOINT || DEFAULT_TASK_REQUEST_ENDPOINT;
export const TASK_RESULT_ENDPOINT =
    process.env.TASK_RESULT_ENDPOINT || DEFAULT_TASK_RESULT_ENDPOINT;

export const GRID_SERVER_ENDPOINT =
    process.env.GRID_SERVER_ENDPOINT || DEFAULT_GRID_SERVER_ENDPOINT;

if (
    MODE === "production" &&
    GRID_SERVER_ENDPOINT === DEFAULT_GRID_SERVER_ENDPOINT
) {
    console.error(
        'GRID_SERVER_ENDPOINT environment variable not set in .env file.\n Please set it like this:\nGRID_SERVER_ENDPOINT = "<your grid server endpoint>"\nExiting...'
    );
    process.exit(1);
}

export const PROJECTID = process.env.PROJECTID;
if (!PROJECTID) {
    console.error(
        'PROJECTID environment variable not set in .env file.\n Please set it like this:\nPROJECTID = "<your project id>"\nExiting...'
    );
    process.exit(1);
}

export const JOBS_DB_PATH = path.resolve(
    process.cwd(),
    process.env.JOBS_DB_PATH || DEFAULT_JOBS_DB_PATH
);

export const FINISHED_JOBS_DB_PATH = path.resolve(
    process.cwd(),
    process.env.FINISHED_JOBS_DB_PATH || DEFAULT_FINISHED_JOBS_DB_PATH
);

export default {
    MODE,
    PORT,
    JOBS_DB_PATH,
    FINISHED_JOBS_DB_PATH,
    TASK_REQUEST_ENDPOINT,
    TASK_RESULT_ENDPOINT,
    GRID_SERVER_ENDPOINT,
    PROJECTID
};
