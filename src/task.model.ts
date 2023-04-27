import { GetTaskQuery, Job, Task, RawData } from "./interfaces";
import fs from "fs";
import path from "path";

const taskRequestEndpoint = "http://localhost:3001/get-task";
const taskResultEndpoint = "http://localhost:3001/submit-task";
export const gridServerEndpoint = "http://localhost:3000";
export const jobsJsonPath = path.resolve(process.cwd(), "./jobs.json");
const finishedJobsJsonPath = path.resolve(process.cwd(), "./finishedJobs.json");
const projectid = "b59151cd-31de-447d-bbf8-fd5ed08eea99";

// Handle incoming result
export function recieveResult(GetTaskQuery: GetTaskQuery, result: string) {
    const resultArray = result as unknown as number[];
    const job = getJob(GetTaskQuery.jobid);

    const task = job.tasks.find(
        (task: Task) => task.taskid === GetTaskQuery.taskid
    );
    task.completed = true;
    job.completedTasks++;

    job.result[task.matrixColumnIndex] = resultArray;
    job.completionTime = new Date();

    saveJob(job);

    if (job.completedTasks === job.taskAmount) {
        saveFinishedJob(job);
    }
}

export function getTaskData(GetTaskQuery: GetTaskQuery) {
    const job = getJob(GetTaskQuery.jobid);

    const task = job.tasks.find((task: Task) => task.taskid === "0000");

    task.taskid = GetTaskQuery.taskid;
    task.delegationTime = new Date();

    saveJob(job);
    return task.taskData;
}

export function createJob(rawData: RawData) {
    const job: Job = {
        jobid: "",
        tasks: [],
        taskAmount: 0,
        creationTime: new Date(),
        coreid: rawData.coreid,
        completedTasks: 0,
        result: []
    };

    for (let i = 0; i < rawData.matrixOne[0].length; i++) {
        const task: Task = {
            jobid: "0000",
            taskid: "0000",
            completed: false,
            delegationTime: undefined,
            taskData: {
                matrix: rawData.matrixOne,
                column: getMatrixColumn(rawData.matrixTwo, i)
            },
            matrixColumnIndex: i
        };

        job.tasks.push(task);
        job.taskAmount++;
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

    fs.writeFileSync(jobsJsonPath, JSON.stringify(jobs));

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

function getMatrixColumn(matrix: number[][], columnIndex: number) {
    const column: number[] = [];

    for (let i = 0; i < matrix.length; i++) {
        column.push(matrix[i][columnIndex]);
    }

    return column;
}
