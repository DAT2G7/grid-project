import { DEFAULT_GRID_SERVER_ENDPOINT, DEFAULT_CORE_PATH } from "./config";
import fs from "fs";
import { DatabaseHandler } from "./db";
import config from "./config";

export async function runSetup() {
    calculateStats();
}

function calculateStats() {
    const database = DatabaseHandler.getInstance();

    const jobs = database.database.jobs;
    let taskCompletionTimes = [];

    for (let i = 0; i < jobs.length; i++) {
        console.log("Job " + i);
        const job = jobs[i];
        for (let j = 0; j < job.tasks.length; j++) {
            const task = job.tasks[j];
            if (task.delegationTime && task.completionTime) {

                const startDate = Date.parse(task.delegationTime.toString());
                const endDate = Date.parse(task.completionTime.toString());
                taskCompletionTimes.push(endDate - startDate);
            }
        }
    }
    
    const totalTaskCompletionTime = taskCompletionTimes.reduce((a, b) => a + b, 0);
    const averageTaskCompletionTime = totalTaskCompletionTime / taskCompletionTimes.length;

    console.log("Average task completion time: " + averageTaskCompletionTime);


}