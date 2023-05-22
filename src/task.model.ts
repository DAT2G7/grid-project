import { Job, Task, RawData } from "./interfaces";
import fs from "fs";
import config from "./config";

export function createJob(rawData: RawData): Job {
    const job: Job = {
        jobid: "",
        tasks: [],
        taskAmount: rawData.matrixes.length - 1,
        creationTime: new Date(),
        coreid: rawData.coreid,
        completedTasks: 0,
        result: []
    };

    for (let i = 0; i < job.taskAmount; i++) {
        const task: Task = {
            jobid: "0000",
            taskid: "0000",
            taskData: {
                matrixA: undefined,
                matrixB: undefined
            },
            completed: false,
            delegationTime: undefined,
            taskIndex: i
        };

        job.tasks.push(task);
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

export async function registerJob(job: Job, projectid: string): Promise<Job> {
    const jobQuery = {
        projectid: projectid,
        coreid: job.coreid,
        taskAmount: job.taskAmount,
        taskRequestEndpoint: config.TASK_REQUEST_ENDPOINT,
        taskResultEndpoint: config.TASK_RESULT_ENDPOINT
    };
    const json: string = JSON.stringify(jobQuery);

    try {
        await fetch(config.GRID_SERVER_ENDPOINT + "/api/project/job", {
            method: "POST",
            body: json,
            headers: { "Content-Type": "application/json" }
        })
            .then((res) => res.json())
            .then((res) => (job.jobid = res.jobid));
    } catch (err) {
        //console.log(err);
    }

    assignTaskJobIds(job);
    return job;
}

function assignTaskJobIds(job: Job) {
    for (let i = 0; i < job.tasks.length; i++) {
        job.tasks[i].jobid = job.jobid;
    }
}

export function getJob(jobid: string) {
    const jobs = JSON.parse(readFileOrCreateFile(config.JOBS_DB_PATH));

    return jobs.find((job: Job) => job.jobid === jobid);
}

export function readFileOrCreateFile(path: string) {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, "[]");
    }

    return fs.readFileSync(path).toString();
}
