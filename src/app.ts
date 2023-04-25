import { GetTaskQuery, RawData } from "./interfaces";
import { config as dotenvConfig } from "dotenv";
import {
    getTaskData,
    recieveResult,
    createJob,
    registerJob
} from "./task.model";
import express from "express";
import bodyParser from "body-parser";

dotenvConfig();

// init app
const app = express();
const port = process.env.PORT || 3001;

// Give task data. Ids are query parameters as the grid server needs a standardised way to append them without potentially breaking the url
// Ids are also not strictly needed, as the url is already directly tied to a specific core and job, but it's good practice to include them
app.get<unknown, unknown, unknown, GetTaskQuery>("/get-task/", (req, res) => {
    const { coreid, jobid, taskid } = req.query;
    console.log("get-task", coreid, jobid, taskid);
    const taskData = getTaskData(req.query);
    res.contentType("application/json");
    res.status(200);
    res.json(taskData);
});

// Recieve task results
app.post<unknown, unknown, unknown, GetTaskQuery>(
    "/submit-task",
    (req, res) => {
        const { coreid, jobid, taskid } = req.query;
        console.log("submit-task", coreid, jobid, taskid);
        bodyParser.json();
        recieveResult(req.query, req.body as string);
        res.sendStatus(200);
    }
);

// Create new job
app.post<unknown, unknown, unknown, GetTaskQuery>(
    "/create-job",
    bodyParser.json(),
    async (req, res) => {
        res.sendStatus(200);

        const rawData = req.body as RawData;
        const job = createJob(rawData);
        await registerJob(job);
        res.status(201);
        res.send();
    }
);

// Start server
app.listen(port, () => {
    console.log("Server started on port", port);
});
