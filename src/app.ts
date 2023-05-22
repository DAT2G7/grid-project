import { GetTaskQuery, RawData } from "./interfaces";
import { createJob, registerJob } from "./task.model";
import config from "./config";
import express from "express";
import bodyParser from "body-parser";
import { runSetup } from "./setup";
import { DatabaseHandler } from "./db";

// init app
const app = express();
const port = config.PORT;
const database = DatabaseHandler.getInstance();
runSetup();

// Start server
app.listen(port, () => {
    
    //console.log("Server started on port", port);
});
