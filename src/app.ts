import { GetTaskQuery } from "./interfaces";
import { config as dotenvConfig } from "dotenv";
import express from "express";

dotenvConfig();

// init app
const app = express();
const port = process.env.PORT || 3001;

// Give task data. Ids are query parameters as the grid server needs a standardised way to append them without potentially breaking the url
// Ids are also not strictly needed, as the url is already directly tied to a specific core and job, but it's good practice to include them
app.get<unknown, unknown, unknown, GetTaskQuery>("/get-task/", (req, res) => {
    const { coreid, jobid, taskid} = req.query;
    console.log("get-task", coreid, jobid, taskid);
    res.sendStatus(200);
    res.status(200).send();
});

// Recieve task results
app.post<unknown, unknown, unknown, GetTaskQuery>("/submit-task", (req, res) => {
    const { coreid, jobid, taskid} = req.query;
    console.log("submit-task", coreid, jobid, taskid);
    res.sendStatus(200);
});

// Start server
app.listen(port, () => {
    console.log("Server started on port", port);
});
