import { Job, RawData } from "./interfaces";
import {
    gridServerEndpoint,
    jobsJsonPath,
    readFileOrCreateFile,
    createJob,
    registerJob
} from "./task.model";
import fs from "fs";

const coreid: string = "b10d23c8-26ac-4140-b368-4ad10c18aee2";
const matrixDimentions: number = 1000000;

export function checkDelegatedWork() {
    const jobs: Job[] = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].completedTasks === jobs[i].taskAmount) {
            continue;
        }
        // 14400000 = 4 hours in ms.
        if (jobs[i].creationTime.getTime() + 14400000 < Date.now()) {
            continue;
        }

        jobs[i].jobid = "";
        jobs[i].taskAmount = jobs[i].taskAmount - jobs[i].completedTasks;
        jobs[i].completedTasks = 0;

        for (let j = 0; j < jobs[i].tasks.length; j++) {
            if (jobs[i].tasks[j].completed) {
                continue;
            }
            jobs[i].tasks[j].taskid = "0000";
            jobs[i].tasks[j].delegationTime = undefined;
        }

        updateJob(jobs[i]);
    }
}

async function updateJob(job: Job): Promise<Job> {
    const response = await fetch(gridServerEndpoint + "/updateJob", {
        method: "PUT",
        body: JSON.stringify(job),
        headers: { "Content-Type": "application/json" }
    }).then((res) => res.json());

    const jobs: Job[] = JSON.parse(readFileOrCreateFile(jobsJsonPath));
    const index = jobs.findIndex((j) => j.jobid === job.jobid);

    job.jobid = response.jobid;

    jobs[index] = job;

    fs.writeFileSync(jobsJsonPath, JSON.stringify(jobs));

    return job;
}

// Functions for creating work automatically
export function generateWork() {
    if (enoughJobsQueued()) {
        return;
    }

    const rawData = generateRawData(matrixDimentions);
    const job = createJob(rawData);
    registerJob(job);
}

function enoughJobsQueued(): boolean {
    const jobs: Job[] = JSON.parse(readFileOrCreateFile(jobsJsonPath));
    let queuedTasksNumbers: number = 0;

    for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].completedTasks === jobs[i].taskAmount) {
            continue;
        }
        for (let j = 0; j < jobs[i].tasks.length; j++) {
            if (jobs[i].tasks[j].completed) {
                continue;
            }
            queuedTasksNumbers++;
        }
        if (queuedTasksNumbers > 100) {
            return true;
        }
    }

    return false;
}

function generateRawData(matrixDimentions: number): RawData {
    return {
        coreid: coreid,
        matrixOne: generateMatrix(matrixDimentions),
        matrixTwo: generateMatrix(matrixDimentions)
    };
}

function generateMatrix(dimentions: number): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < dimentions; i++) {
        matrix.push([]);
        for (let j = 0; j < dimentions; j++) {
            matrix[i][j] = Math.random() * 10;
        }
    }

    return matrix;
}
