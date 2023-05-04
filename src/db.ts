import fs from "fs";
import { DEFAULT_DB_PATH } from "./config";
import {
    Database,
    Job,
    GetTaskQuery,
    Task,
    TaskData,
    RawData,
    CompletedJob
} from "./interfaces";
import { generateRawData } from "./maintenance";
import { createJob, registerJob } from "./task.model";

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

        // Maintain database every 30 seconds
        setInterval(() => {
            this.maintainDatabase();
        }, 6000);
    }

    private maintainDatabase() {
        this.pruneDatabase();
        //this.printStats();
        if (!this.haveUnfinishedJobs()) {
            this.makeJobs();
        } else {
            //const job = this.database.jobs[this.database.jobs.length - 1];
            //// get last three tasks in job
            //const tasks = job.tasks.slice(job.tasks.length - 3);
            //
            //const index = job.tasks.findIndex(
            //    (task) =>
            //        task.taskData.matrixA === undefined &&
            //        task.taskData.matrixB === undefined
            //);
            //console.log("index of last empty task: " + index);
            //console.log("Last 3 tasks in job:");
            //console.log(tasks);
        }
    }

    //private printStats() {
    //    const totalJobTime = this.getTotalJobTime();
    //    const totalTasks = this.getTotalTasks();
    //    const averageJobTime = totalJobTime / this.database.completedJobsCount;
    //    const averageTaskTime = totalJobTime / totalTasks;
    //
    //    console.log("Database stats:");
    //    console.log(
    //        "Jobs: " +
    //            this.database.jobs.length +
    //            this.database.completedJobs.length
    //    );
    //    console.log("Completed jobs: " + this.database.completedJobsCount);
    //    console.log("Total job time: " + totalJobTime / 60 + "s");
    //    console.log("Average job time: " + averageJobTime / 60 + "s");
    //    console.log("Total tasks: " + totalTasks);
    //    console.log("Average task time: " + averageTaskTime / 60 + "s");
    //}

    //private getTotalJobTime() {
    //    let totalJobTime = 0;
    //    for (let i = 0; i < this.database.completedJobs.length; i++) {
    //        const job = this.database.completedJobs[i];
    //        totalJobTime +=
    //            job.completionTime.getTime() - job.creationTime.getTime();
    //    }
    //    return totalJobTime;
    //}
    //
    //private getTotalTasks() {
    //    let totalTasks = 0;
    //    for (let i = 0; i < this.database.completedJobs.length; i++) {
    //        totalTasks += this.database.completedJobs[i].taskAmount;
    //    }
    //    return totalTasks;
    //}

    // Singleton
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

    public saveJob(job: Job) {
        // check if job exists on db already.
        // if it does, replace it with the updated one.

        const jobIndex: number = this.database.jobs.findIndex(
            (job: Job) => job.jobid === job.jobid
        );

        if (jobIndex !== -1) {
            this.database.jobs[jobIndex] = job;
        } else {
            this.database.jobs.push(job);
        }

        return job;
    }

    public getTaskData(getTaskQuery: GetTaskQuery): TaskData | null {
        const job = this.getJob(getTaskQuery.jobid);

        if (!job) {
            return null;
        }

        if (job.completedTasks === job.taskAmount) {
            return job.tasks[0].taskData;
        }

        // Check if task with taskid exists

        let task = job.tasks.find(
            (task: Task) => task.taskid === getTaskQuery.taskid
        );

        if (task) {
            return task.taskData;
        }

        // If task with taskid does not exist, find first task with id = "0000" and defined matrixes
        task = job.tasks.find(
            (task: Task) =>
                task.taskid === "0000" &&
                task.taskData.matrixA &&
                task.taskData.matrixB
        );

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
        console.log("Making jobs");
        const rawData: RawData = generateRawData(this.database.coreId);

        const job: Job = createJob(rawData);

        registerJob(job, this.database.projectId).then((job: Job) => {
            this.saveJob(job);
        });
    }

    private getDatabaseFromDisk(): Database {
        if (!fs.existsSync(process.env.DATABASE_PATH || DEFAULT_DB_PATH)) {
            this.createDatabaseOnDisk();
        }

        return JSON.parse(
            fs
                .readFileSync(process.env.DATABASE_PATH || DEFAULT_DB_PATH)
                .toString()
        );
    }

    public saveDatabaseToDisk() {
        fs.writeFileSync(
            process.env.DATABASE_PATH || DEFAULT_DB_PATH,
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
        if (fs.existsSync(process.env.DATABASE_PATH || DEFAULT_DB_PATH)) {
            fs.rmSync(process.env.DATABASE_PATH || DEFAULT_DB_PATH);
        }

        const database: Database = {
            projectId: "0000",
            coreId: "0000",
            jobs: [],
            completedJobs: [],
            completedJobsCount: 0
        };

        fs.writeFileSync(
            process.env.DATABASE_PATH || DEFAULT_DB_PATH,
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

    public haveUnfinishedJobs(): boolean {
        for (const job of this.database.jobs) {
            if (job.completedTasks !== job.taskAmount) {
                return true;
            }
        }

        return false;
    }

    private pruneDatabase() {
        const newJobs: Job[] = [];

        for (const job of this.database.jobs) {
            if (job.completedTasks !== job.taskAmount) {
                newJobs.push(job);
                continue;
            }
            this.database.completedJobsCount++;

            const completedJob: CompletedJob = {
                jobid: job.jobid,
                coreid: job.coreid,
                result: job.result,
                completionTime: job.completionTime!,
                creationTime: job.creationTime,
                taskAmount: job.taskAmount,
                timeTaken: this.getPeriod(
                    job.completionTime!,
                    job.creationTime!
                )
            };
            this.database.completedJobs.push(completedJob);
        }

        this.database.jobs = newJobs;

        this.saveDatabaseToDisk();

        return;
    }

    private getPeriod(date1: Date, date2: Date) {
        return Math.abs(date1.getTime() - date2.getTime());
    }
}
