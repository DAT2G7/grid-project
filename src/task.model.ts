import { GetTaskQuery, Job, Task, RawData, Result } from "./interfaces";
import fs from "fs";
import path from "path";

const taskRequestEndpoint = "http://localhost:3001/get-task";
const taskResultEndpoint = "http://localhost:3001/submit-task";
export const gridServerEndpoint = "http://localhost:3000";
export const jobsJsonPath = path.resolve(process.cwd(), "./jobs.json");
const finishedJobsJsonPath = path.resolve(process.cwd(), "./finishedJobs.json");
const projectid = "b59151cd-31de-447d-bbf8-fd5ed08eea99";

// Get Results
export function getResults(): Result[] {
    const jobs: Job[] = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    let results: Result[] = [];

    jobs.forEach((job) => {
        let result = {
            result: job.result
        };

        results.push(result);
    });

    return results;
}

// Handle incoming result
export function recieveResult(GetTaskQuery: GetTaskQuery, result: string) {
    const resultMatrix = result as unknown as number[][];
    const job = getJob(GetTaskQuery.jobid);

    const task = job.tasks.find(
        (task: Task) => task.taskid === GetTaskQuery.taskid
    );
    task.completed = true;
    job.completedTasks++;

    if (job.completedTasks === job.taskAmount) {
        job.completionTime = new Date();
        job.result = resultMatrix;
        saveFinishedJob(job);
    } else {
        for (let i = 0; i < job.taskAmount; i++) {
            if (job.tasks[i].taskData.matrixA === undefined) {
                job.tasks[i].taskData.matrixA = resultMatrix;
                break;
            }
            if (job.tasks[i].taskData.matrixB === undefined) {
                job.tasks[i].taskData.matrixB = resultMatrix;
                break;
            }
        }
    }

    saveJob(job);
}

export function getTaskData(GetTaskQuery: GetTaskQuery) {
    const job = getJob(GetTaskQuery.jobid);

    const task = job.tasks.find(
        (task: Task) =>
            task.taskid === "0000" &&
            !(
                task.taskData.matrixA === undefined ||
                task.taskData.matrixB === undefined
            )
    );

    task.taskid = GetTaskQuery.taskid;
    task.delegationTime = new Date();

    saveJob(job);
    return task.taskData;
}

export function createJob(rawData: RawData) {
    const job: Job = {
        jobid: "",
        tasks: [],
        taskAmount: rawData.matrixes.length - 1,
        creationTime: new Date(),
        coreid: rawData.coreid,
        completedTasks: 0,
        result: []
    };

    for (let i = 0; i < rawData.matrixes[0].length - 1; i++) {
        const task: Task = {
            jobid: "0000",
            taskid: "0000",
            taskData: {
                matrixA: undefined,
                matrixB: undefined
            },
            completed: false,
            delegationTime: undefined,
            matrixColumnIndex: i
        };

        job.tasks.push(task);
        job.taskAmount++;
    }

    let matrixIndex: number = 0;
    for (let i = 0; i < job.tasks.length; i++) {
        if (matrixIndex === rawData.matrixes.length) {
            break;
        }
        job.tasks[i].taskData.matrixA = rawData.matrixes[matrixIndex];
        matrixIndex++;
        if (matrixIndex === rawData.matrixes.length) {
            break;
        }
        job.tasks[i].taskData.matrixB = rawData.matrixes[matrixIndex];
        matrixIndex++;
    }

    return job;
}

export async function registerJob(job: Job) {
    const jobQuery = {
        projectid: projectid,
        coreid: job.coreid,
        taskAmount: job.taskAmount,
        taskRequestEndpoint: taskRequestEndpoint,
        taskResultEndpoint: taskResultEndpoint
    };
    const json: string = JSON.stringify(jobQuery);

    await fetch(gridServerEndpoint + "/api/project/job", {
        method: "POST",
        body: json,
        headers: { "Content-Type": "application/json" }
    })
        .then((res) => res.json())
        .then((res) => (job.jobid = res.jobid));

    assignTaskJobIds(job);
    saveJob(job);
    return;
}

function assignTaskJobIds(job: Job) {
    for (let i = 0; i < job.tasks.length; i++) {
        job.tasks[i].jobid = job.jobid;
    }
}

export function getJob(jobid: string) {
    const jobs = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    return jobs.find((job: Job) => job.jobid === jobid);
}

function saveJob(job: Job) {
    const jobs: Job[] = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    // check if job exists on db already.
    // if it does, replace it with the updated one.
    const jobIndex: number = jobs.findIndex(
        (job: Job) => job.jobid === job.jobid
    );
    if (jobIndex !== -1) {
        jobs[jobIndex] = job;
    } else {
        jobs.push(job);
    }

    const json = JSON.stringify(jobs);

    try {
        fs.writeFileSync(jobsJsonPath, json);
    } catch (err) {
        console.log(err);
    }

    return job;
}

function saveFinishedJob(job: Job) {
    const finishedJobs = JSON.parse(readFileOrCreateFile(finishedJobsJsonPath));

    finishedJobs.push(job);

    fs.writeFileSync(finishedJobsJsonPath, JSON.stringify(finishedJobs));

    return job;
}

export function readFileOrCreateFile(path: string) {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, "[]");
    }

    return fs.readFileSync(path).toString();
}
