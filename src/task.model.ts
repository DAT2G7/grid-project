import { GetTaskQuery, Job, Task, RawData } from "./interfaces";
import fs from "fs";

const taskRequestEndpoint = "http://localhost:3001/get-task";
const taskResultEndpoint = "http://localhost:3001/submit-task";
const gridServerEndpoint = "localhost:3000";
const jobsJsonPath = "./jobs.json";
const finishedJobsJsonPath = "./finishedJobs.json";

// Handle incoming result
export function recieveResult(GetTaskQuery: GetTaskQuery, result: string) {
    const resultArray = Array.from(result); // DOES THIS WORK?

    const job = getJob(GetTaskQuery.jobid);

    const task = job.tasks.find(
        (task: Task) => task.taskid === GetTaskQuery.taskid
    );
    task.completed = true;
    job.completedTasks++;

    job.result[task.matrixColumnIndex] = resultArray;

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
        coreid: rawData.coreid,
        completedTasks: 0,
        result: []
    };

    for (let i = 0; i < rawData.matrixOne.length; i++) {
        const task: Task = {
            jobid: "0000",
            taskid: "0000",
            completed: false,
            delegationTime: undefined,
            taskData: {
                matrix: rawData.matrixOne,
                column: rawData.matrixTwo[i]
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
        projectid: job.jobid,
        coreid: job.coreid,
        taskAmount: job.taskAmount,
        taskRequestEndpoint: taskRequestEndpoint,
        taskResultEndpoint: taskResultEndpoint
    };
    const json: string = JSON.stringify(jobQuery);

    await fetch(gridServerEndpoint + "/project/job", {
        method: "POST",
        body: json,
        headers: { "Content-Type": "application/json" }
    })
        .then((res) => res.json())
        .then((json) => ((job.jobid = json.jobid), assignTaskJobIds(job)));

    saveJob(job);
    return job;
}

function assignTaskJobIds(job: Job) {
    for (let i = 0; i < job.tasks.length; i++) {
        job.tasks[i].jobid = job.jobid;
    }
}

function getJob(jobid: string) {
    const jobs = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    return jobs.find((job: Job) => job.jobid === jobid);
}

function saveJob(job: Job) {
    const jobs = JSON.parse(readFileOrCreateFile(jobsJsonPath));

    jobs.push(job);

    fs.writeFileSync(jobsJsonPath, JSON.stringify(jobs));
}

function saveFinishedJob(job: Job) {
    const finishedJobs = JSON.parse(readFileOrCreateFile(finishedJobsJsonPath));

    finishedJobs.push(job);

    fs.writeFileSync(finishedJobsJsonPath, JSON.stringify(finishedJobs));

    return job;
}

function readFileOrCreateFile(path: string) {
    if (!fs.existsSync) {
        fs.writeFileSync(path, "[]");
    }

    return fs.readFileSync(path).toString();
}
