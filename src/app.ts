import config from "./config";
import express from "express";
import { runSetup } from "./setup";
import { DatabaseHandler } from "./db";

// init app
const app = express();
const port = config.PORT;
const database = DatabaseHandler.getInstance();
console.log("Running startup tasks...");
//runSetup();
app.use("/static", express.static("src/public"));
console.log("Server listening on port " + port);
