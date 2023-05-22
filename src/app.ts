import config from "./config";
import express from "express";
import { runSetup } from "./setup";
import { DatabaseHandler } from "./db";

// init app
const app = express();
const port = config.PORT;
const database = DatabaseHandler.getInstance();
runSetup();
