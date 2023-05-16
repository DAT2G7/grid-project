import fs from "fs";
import { DEFAULT_DB_PATH } from "./config";
import {
    Database,
    Job,
    GetTaskQuery,
    Task,
    TaskData,
    RawData
} from "./interfaces";
import { generateRawData } from "./maintenance";
import { createJob, registerJob } from "./task.model";
import config from "./config";

export class DatabaseHandler {
    database: Database;

    // Load database into memory
    private constructor() {
        this.database = this.getDatabaseFromDisk();

        // Save database to disk every 5 seconds
        setInterval(() => {
            this.saveDatabaseToDisk();
        }, 5000);

        // Save database to disk on exit

        process.on("exit", () => {
            this.saveDatabaseToDisk();
        });

        process.on("SIGINT", () => {
            process.exit(2);
        });

        // Maintain database every 6 seconds
        setInterval(() => {
            this.maintainDatabase();
        }, 6000);
    }

    private maintainDatabase() {
        if (this.countUnfinishedTasks() < config.MINIMUM_TASKS) {
            this.makeJobs();
        }
    }

    private static instance: DatabaseHandler;

    public static getInstance(): DatabaseHandler {
        if (!DatabaseHandler.instance) {
            DatabaseHandler.instance = new DatabaseHandler();
        }

        return DatabaseHandler.instance;
    }

    public saveResult(getTaskQuery: GetTaskQuery, result: string) {
        const task = this.getTask(getTaskQuery);
        const job = this.getJob(getTaskQuery.jobid);

        if (!task || !job) {
            return;
        }

        if (task.completed) {
            return;
        }

        task.completed = true;
        task.completionTime = new Date();

        job.completedTasks++;

        if (task.taskIndex === job.taskAmount - 1) {
            console.log("Job " + job.jobid + " completed!");
            console.log("Result: " + result);
            job.result = result as unknown as number[][];
            job.completionTime = new Date();
            this.saveJob(job);
        } else {
            this.assignNewDataToTask(job, result as unknown as number[][]);
            this.saveJob(job);
        }
    }

    public getJob(jobid: string): Job | null {
        const job = this.database.jobs.find((job: Job) => job.jobid === jobid);

        if (!job) {
            return null;
        }

        return job;
    }

    public saveJob(newJob: Job) {
        // check if job exists on db already.
        // if it does, replace it with the updated one.
        const jobIndex: number = this.database.jobs.findIndex(
            (job: Job) => job.jobid === newJob.jobid
        );

        if (jobIndex !== -1) {
            this.database.jobs[jobIndex] = newJob;
        } else {
            this.database.jobs.push(newJob);
        }

        return newJob;
    }

    public getTaskData(getTaskQuery: GetTaskQuery): TaskData | null {
        const job = this.getJob(getTaskQuery.jobid);

        // If job does not exist, return null
        if (!job) {
            return null;
        }

        // If job is completed, return task data for first task. The computation doesn't matter.
        if (job.completedTasks === job.taskAmount) {
            return job.tasks[0].taskData;
        }

        // Check if task with requested taskid exists
        let task = job.tasks.find(
            (task: Task) => task.taskid === getTaskQuery.taskid
        );

        // If task with taskid exists, return task data for that task.
        if (task) {
            return task.taskData;
        }

        // If task with taskid does not exist, find first task with id = "0000" and defined matrices
        task = job.tasks.find(
            (task: Task) =>
                task.taskid === "0000" &&
                task.taskData.matrixA &&
                task.taskData.matrixB
        );

        // If task with id = "0000" and defined matrices exists, assign taskid to it and return task data
        if (task) {
            task.taskid = getTaskQuery.taskid;
            task.delegationTime = new Date();
            this.saveJob(job);
            return task.taskData;
        }

        // no task with taskid = "0000" and defined matrixes found
        return null;
    }

    public clearJobs() {
        this.database.jobs = [];

        this.saveDatabaseToDisk();
    }

    public getJobAmount(): number {
        return this.database.jobs.length;
    }

    public makeJobs() {
        console.log("Making job");
        const rawData: RawData = generateRawData(this.database.coreId);

        const Rawjob: Job = createJob(rawData);

        registerJob(Rawjob, this.database.projectId).then((job: Job) => {
            this.saveJob(job);
        });
    }

    private getDatabaseFromDisk(): Database {
        if (!fs.existsSync(process.env.JOBS_DB_PATH || DEFAULT_DB_PATH)) {
            this.createDatabaseOnDisk();
        }

        return JSON.parse(
            fs
                .readFileSync(process.env.JOBS_DB_PATH || DEFAULT_DB_PATH)
                .toString()
        );
    }

    public saveDatabaseToDisk() {
        fs.writeFileSync(
            process.env.JOBS_DB_PATH || DEFAULT_DB_PATH,
            JSON.stringify(this.database)
        );
    }

    private getTask(getTaskQuery: GetTaskQuery): Task | undefined {
        const job = this.getJob(getTaskQuery.jobid);

        if (!job) {
            return undefined;
        }

        return job.tasks.find(
            (task: Task) => task.taskid === getTaskQuery.taskid
        );
    }

    private assignNewDataToTask(job: Job, result: number[][]) {
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

    public createDatabaseOnDisk() {
        if (fs.existsSync(process.env.JOBS_DB_PATH || DEFAULT_DB_PATH)) {
            fs.rmSync(process.env.JOBS_DB_PATH || DEFAULT_DB_PATH);
        }

        const database: Database = {
            projectId: "",
            coreId: "",
            jobs: [],
            completedJobs: [],
            completedJobsCount: 0
        };

        fs.writeFileSync(
            process.env.JOBS_DB_PATH || DEFAULT_DB_PATH,
            JSON.stringify(database)
        );
    }

    public setProjectId(projectId: string) {
        this.database.projectId = projectId;
        this.saveDatabaseToDisk();
    }

    public setCoreId(coreId: string) {
        this.database.coreId = coreId;
        this.saveDatabaseToDisk();
    }

    public countUnfinishedTasks(): number {
        let unfinishedTasks = 0;
        for (const job of this.database.jobs) {
            if (job.completedTasks < job.taskAmount) {
                unfinishedTasks += job.taskAmount - job.completedTasks;
            }
        }

        return unfinishedTasks;
    }
}
