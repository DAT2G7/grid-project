import { Job, Task, RawData } from "./interfaces";
import config from "./config";

/**
 * Creates a job from raw data.
 *
 * @function createJob
 * @param {RawData} rawData The raw data to create the job from.
 * @returns {Job} The created job.
 */
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

/**
 * Registers a job to the grid server.
 *
 * @async
 * @function registerJob
 * @param {Job} job The job to register.
 * @param {string} projectid The project id to register the job to.
 * @returns {Promise<Job>} The registered job.
 * */
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
        console.log(err);
    }

    assignTaskJobIds(job);
    return job;
}

/**
 * Assigns the jobid to all tasks in a job.
 *
 * @function assignTaskJobIds
 * @param {Job} job The job to assign the task jobids to.
 * */
function assignTaskJobIds(job: Job) {
    for (let i = 0; i < job.tasks.length; i++) {
        job.tasks[i].jobid = job.jobid;
    }
}

/**
 * Assigns new data to the first task in a job that has undefined matrices.
 * @param job The job to assign the data to.
 * @param result The matrix to assign.
 */
export function assignNewDataToTask(job: Job, result: number[][]) {
    for (let i = 0; i < job.taskAmount; i++) {
        if (job.tasks[i].taskData.matrixA === undefined) {
            job.tasks[i].taskData.matrixA = result;
            break;
        }
        if (job.tasks[i].taskData.matrixB === undefined) {
            job.tasks[i].taskData.matrixB = result;
            break;
        }
    }
}
