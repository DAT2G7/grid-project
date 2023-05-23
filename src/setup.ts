import { DEFAULT_GRID_SERVER_ENDPOINT, DEFAULT_CORE_PATH } from "./config";
import fs from "fs";
import { DatabaseHandler } from "./db";
import config from "./config";
import { Database, Job } from "./interfaces";

export async function runSetup() {
    calculateStats(readMultipleDatabaseJobs());
}

function readMultipleDatabaseJobs(): Job[] {
    const jobsOne: Database = JSON.parse(
        fs.readFileSync("./data/jobs1.json", "utf8")
    );
    const jobsTwo: Database = JSON.parse(
        fs.readFileSync("./data/jobs2.json", "utf8")
    );
    const jobsThree: Database = JSON.parse(
        fs.readFileSync("./data/jobs3.json", "utf8")
    );
    const jobsFour: Database = JSON.parse(
        fs.readFileSync("./data/jobs4.json", "utf8")
    );

    const jobs = jobsOne.jobs
        .concat(jobsTwo.jobs)
        .concat(jobsThree.jobs)
        .concat(jobsFour.jobs);

    return jobs;
}

function calculateStats(jobs: Job[]) {
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

    const totalTaskCompletionTime = taskCompletionTimes.reduce(
        (a, b) => a + b,
        0
    );
    const averageTaskCompletionTime =
        totalTaskCompletionTime / taskCompletionTimes.length;
    taskCompletionTimes.sort((a, b) => a - b);

    console.log("Total number of jobs: " + jobs.length);
    console.log(
        "Total task completion time: " +
            totalTaskCompletionTime / 1000 +
            " seconds"
    );
    console.log("10 Longest task completion times: ");
    for (let i = 0; i < 10; i++) {
        console.log(taskCompletionTimes[taskCompletionTimes.length - 1 - i]);
    }

    console.log("10 Shortest task completion times: ");
    for (let i = 0; i < 10; i++) {
        console.log(taskCompletionTimes[i]);
    }

    console.log("Quartiles: ");

    console.log(
        "First quartile: " +
            taskCompletionTimes[Math.floor(taskCompletionTimes.length / 4)]
    );
    console.log(
        "Second quartile: " +
            taskCompletionTimes[Math.floor(taskCompletionTimes.length / 2)]
    );
    console.log(
        "Third quartile: " +
            taskCompletionTimes[
                Math.floor((3 * taskCompletionTimes.length) / 4)
            ]
    );

    if (totalTaskCompletionTime % 2 == 0) {
        const medianTaskCompletionTime =
            (taskCompletionTimes[taskCompletionTimes.length / 2] +
                taskCompletionTimes[taskCompletionTimes.length / 2 - 1]) /
            2;
        console.log(
            "Median task completion time: " +
                medianTaskCompletionTime / 1000 +
                " seconds"
        );
    } else {
        const medianTaskCompletionTime =
            taskCompletionTimes[Math.floor(taskCompletionTimes.length / 2)];
        console.log(
            "Median task completion time: " +
                medianTaskCompletionTime / 1000 +
                " seconds"
        );
    }

    console.log(
        "Average task completion time: " +
            averageTaskCompletionTime / 1000 +
            " seconds"
    );
}
