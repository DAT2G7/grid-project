import {
    Database,
    GetTaskQuery,
    Job,
    RawData,
    Task,
    TaskData
} from "./interfaces";
import { createJob, registerJob, assignNewDataToTask } from "./task.model";

import { DEFAULT_DB_PATH } from "./config";
import config from "./config";
import fs from "fs";
import { generateRawData } from "./maintenance";
import path from "path";

/*
 * DatabaseHandler is a singleton class that handles all database operations.
 * It loads the database from disk on startup and saves it to disk every 6 seconds.
 * It also maintains the database by creating new jobs if the amount of unfinished tasks is below a certain threshold.
 * */
export class DatabaseHandler {
    database: Database;

    private constructor() {
        // Create database on disk if it doesn't exist
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

    /**
     * Maintains the database by creating new jobs if the amount of unfinished tasks is below a certain threshold set in the environment variables (MINIMUM_TASKS).
     * @function maintainDatabase
     */
    private maintainDatabase() {
        if (this.countUnfinishedTasks() < config.MINIMUM_TASKS) {
            this.makeJobs();
        }
    }

    private static instance: DatabaseHandler;

    /**
     * Gets an instance of the DatabaseHandler. If one doesn't exist, it creates one.
     *
     * @function getInstance
     * @returns {DatabaseHandler} The instance of the DatabaseHandler.
     * */
    public static getInstance(): DatabaseHandler {
        if (!DatabaseHandler.instance) {
            DatabaseHandler.instance = new DatabaseHandler();
        }

        return DatabaseHandler.instance;
    }

    /**
     * Saves the result of a task to the database.
     * @param {GetTaskQuery} getTaskQuery The query containing the jobid and taskid.
     * @param {string} result The result of the task.
     */
    public saveResult(getTaskQuery: GetTaskQuery, result: string) {
        const task = this.getTask(getTaskQuery);
        const job = this.getJob(getTaskQuery.jobid);

        if (!task || !job) {
            return;
        }

        // If the result has been received before, ignore it.
        if (task.completed) {
            return;
        }

        task.completed = true;
        task.completionTime = new Date();

        job.completedTasks++;

        if (job.completedTasks === job.taskAmount) {
            console.log("Job " + job.jobid + " completed!");
            console.log("Result: " + result);
            job.result = result as unknown as number[][];
            job.completionTime = new Date();
            this.saveJob(job);
        } else {
            assignNewDataToTask(job, result as unknown as number[][]);
            this.saveJob(job);
        }
    }

    /**
     * Retrieves a job from the database.
     *
     * @function getJob
     * @param {string} jobid The job id.
     * @returns {Job | null} The job, or null if it doesn't exist.
     * */
    public getJob(jobid: string): Job | null {
        const job = this.database.jobs.find((job: Job) => job.jobid === jobid);

        if (!job) {
            return null;
        }

        return job;
    }

    /**
     * Saves a job to the database.
     *
     * @function saveJob
     * @param {Job} newJob The job to save.
     * @returns {Job} The saved job.
     */
    public saveJob(newJob: Job): Job {
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

    /**
     * Retrieves the data of a task from the database.
     *
     * @function getTaskData
     * @param {GetTaskQuery} getTaskQuery The query containing the jobid and taskid of the task to retrieve.
     * @returns {TaskData | null} The data of the task if it exists, null otherwise.
     */
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

    /**
     * Retrieves the amount of jobs in the database.
     * @returns {number} The amount of jobs in the database.
     */
    public getJobAmount(): number {
        return this.database.jobs.length;
    }

    /**
     * Makes a new job and saves it to the database.
     *
     * @function makeJobs
     * @returns {void}
     */
    public makeJobs() {
        console.log("Making job");
        const rawData: RawData = generateRawData(this.database.coreId);

        const Rawjob: Job = createJob(rawData);

        registerJob(Rawjob, this.database.projectId).then((job: Job) => {
            this.saveJob(job);
        });
    }

    /**
     * Retrieves the database from disk in the location specified by the environment variable JOBS_DB_PATH.
     * If the environment variable is not set, the database will be retrieved from the default location.
     * If the database does not exist, it will be created.
     *
     * @function getDatabaseFromDisk
     * @returns {Database} The database
     */
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

    /**
     * Saves the database to disk in the location specified by the environment variable JOBS_DB_PATH.
     * If the environment variable is not set, the database will be saved to the default location.
     *
     * @function saveDatabaseToDisk
     * @returns {void}
     */
    public saveDatabaseToDisk() {
        fs.writeFileSync(
            // The config object may not be reliably available at this point, so we use the default path if the environment variable is not set.
            process.env.JOBS_DB_PATH || DEFAULT_DB_PATH,
            JSON.stringify(this.database)
        );
    }

    /**
     * Gets a specific task from the database.
     * @function getTask
     * @param {GetTaskQuery} getTaskQuery - The query to get the task. Contains the jobid and taskid.
     * @returns
     */
    private getTask(getTaskQuery: GetTaskQuery): Task | undefined {
        const job = this.getJob(getTaskQuery.jobid);

        if (!job) {
            return undefined;
        }

        return job.tasks.find(
            (task: Task) => task.taskid === getTaskQuery.taskid
        );
    }

    /**
     * Creates a new database on disk.
     * The database is created at the path specified in the environment variable JOBS_DB_PATH.
     * If the environment variable is not set, the database is created at the default path.
     * If a database already exists at the specified path, it is overwritten.
     *
     * @function createDatabaseOnDisk
     */
    public createDatabaseOnDisk() {
        // The config object is not reliably available at this point, so we use the default path if the environment variable is not set.
        const dbPath = process.env.JOBS_DB_PATH || DEFAULT_DB_PATH;
        if (fs.existsSync(dbPath)) {
            fs.rmSync(dbPath);
        }

        const database: Database = {
            projectId: "",
            coreId: "",
            jobs: [],
            completedJobs: [],
            completedJobsCount: 0
        };

        const dirPath = path.dirname(dbPath);

        // Make sure the directory exists before writing the file. This is necessary because fs.writeFileSync does not create directories.
        fs.mkdirSync(dirPath, { recursive: true });

        fs.writeFileSync(dbPath, JSON.stringify(database));
    }

    /**
     * Sets the projectId of the database. This is the project that all jobs belong to.
     * This setup is only used for testing purposes, and as such is only made to work with one project.
     * @param projectId The projectId to set.
     * */
    public setProjectId(projectId: string) {
        this.database.projectId = projectId;
        this.saveDatabaseToDisk();
    }

    /**
     * Sets the coreId of the database. This is the core that all jobs will make use of.
     * This setup is only used for testing purposes, and as such is only made to work with one core.
     * @param coreId The coreId to set.
     */
    public setCoreId(coreId: string) {
        this.database.coreId = coreId;
        this.saveDatabaseToDisk();
    }

    /**
     *  Returns the amount of unfinished tasks in the database.
     *  @returns {number} The amount of unfinished tasks.
     * */
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
