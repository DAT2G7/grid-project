import { Job, RawData } from "./interfaces";
import {
    gridServerEndpoint,
    jobsJsonPath,
    readFileOrCreateFile,
    createJob,
    registerJob
} from "./task.model";
import fs from "fs";

const rawDataPath: string = "./rawData.json";

export function checkDelegatedWork() {
    const now = new Date();
    const jobs: Job[] = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].completedTasks === jobs[i].taskAmount) {
            continue;
        }
        // 14400000 = 4 hours in ms.
        if (
            new Date(jobs[i].creationTime).getTime() + 14400000 <
            now.getTime()
        ) {
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

    const rawData = generateRawData();
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

function generateRawData(): RawData {
    return JSON.parse(fs.readFileSync(rawDataPath, "utf8"));

    //return {
    //    coreid: coreid,
    //    matrixOne: generateMatrix(matrixDimentions),
    //    matrixTwo: generateMatrix(matrixDimentions)
    //};
}

//function generateMatrix(dimentions: number): number[][] {
//    const matrix: number[][] = [];
//
//    for (let i = 0; i < dimentions; i++) {
//        matrix.push([]);
//        for (let j = 0; j < dimentions; j++) {
//            matrix[i][j] = Math.random() * 10;
//        }
//    }
//
//    return matrix;
//}
