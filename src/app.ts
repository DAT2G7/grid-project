import { GetTaskQuery, RawData } from "./interfaces";
import { createJob, registerJob } from "./task.model";
import config from "./config";
import express from "express";
import bodyParser from "body-parser";
import { projectId, runSetup } from "./setup";
import { DatabaseHandler } from "./db";

// init app
const app = express();
const port = config.PORT;
const database: DatabaseHandler = DatabaseHandler.getInstance();
runSetup(database);

app.use(express.json({ limit: "50mb" }));

// Give task data. Ids are query parameters as the grid server needs a standardised way to append them without potentially breaking the url
// Ids are also not strictly needed, as the url is already directly tied to a specific core and job, but it's good practice to include them
app.get<unknown, unknown, unknown, GetTaskQuery>("/get-task", (req, res) => {
    res.contentType("application/json");
    res.status(200);
    res.send(JSON.stringify(database.getTaskData(req.query)));
});

// Recieve task results
app.post<unknown, unknown, string, GetTaskQuery>("/submit-task", (req, res) => {
    database.saveResult(req.query, req.body as string);
    res.sendStatus(200);
});

// Create new job
app.post<unknown, unknown, unknown, GetTaskQuery>(
    "/create-job",
    bodyParser.json(),
    async (req, res) => {
        res.sendStatus(200);

        const rawData = req.body as RawData;
        const job = createJob(rawData);
        await registerJob(job, projectId);
        database.saveJob(job);
        res.status(201);
        res.send();
    }
);

//app.get<unknown, unknown, unknown>("/results", (_req, res) => {
//    res.contentType("application/json");
//    res.status(200);
//    res.send(JSON.stringify(getResults()));
//});

// Start server
app.listen(port, () => {
    console.log("Server started on port", port);
});
