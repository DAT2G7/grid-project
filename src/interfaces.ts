/**
 * The query that the grid server sends when it requests a task, or when it sends a result.
 * 
 * @interface GetTaskQuery
 * @property {string} projectid The project id.
 * @property {string} jobid The job id.
 * @property {string} taskid The task id.
 */
export interface GetTaskQuery {
    projectid: string;
    jobid: string;
    taskid: string;
}

/**
 * A job.
 * 
 * @interface Job
 * @property {string} jobid The job id.
 * @property {Task[]} tasks The tasks.
 * @property {number} taskAmount The amount of tasks.
 * @property {string} coreid The id of the core that the tasks need to run on.
 * @property {Date} creationTime The creation time of the job.
 * @property {Date} completionTime The completion time of the job.
 * @property {number} completedTasks The amount of completed tasks.
 * @property {number[][]} result The result of the job.
 * */
export interface Job {
    jobid: string;
    tasks: Task[];
    taskAmount: number;
    coreid: string;
    creationTime: Date;
    completionTime?: Date;
    completedTasks: number;
    result: number[][];
}

/**
 * A task.
 * 
 * @interface Task
 * @property {string} jobid The job id.
 * @property {string} taskid The task id.
 * @property {boolean} completed Whether the task is completed.
 * @property {Date} delegationTime The delegation time of the task.
 * @property {Date} completionTime The completion time of the task.
 * @property {TaskData} taskData The task data.
 * @property {number} taskIndex The task index.
 * */
export interface Task {
    jobid: string;
    taskid: string;
    completed: boolean;
    delegationTime?: Date;
    completionTime?: Date;
    taskData: TaskData;
    taskIndex: number;
}

/**
 * The raw data input.
 * 
 * @interface RawData
 * @property {string} coreid The core id.
 * @property {number[][][]} matrixes The matrixes.
 * */
export interface RawData {
    coreid: string;
    matrixes: number[][][];
}

/**
 * Finished jobs. (Really just a wrapper for an array of jobs - very reduntant)
 * 
 * @interface FinishedJobs
 * @property {Job[]} jobs The finished jobs.
 */
export interface FinishedJobs {
    jobs: Job[];
}

/**
 * The data input of a task.
 * 
 * @interface TaskData
 * @property {number[][]} matrixA The first matrix.
 * @property {number[][]} matrixB The second matrix.
 */
export interface TaskData {
    matrixA?: number[][];
    matrixB?: number[][];
}

/**
 * The result of a job or task.
 * 
 * @interface Result
 * @property {number[][]} result The result.
 */
export interface Result {
    result: number[][];
}

/**
 * The setup ids.
 * 
 * @interface Setup
 * @property {string} coreId The core id.
 * @property {string} projectId The project id.
 */
export interface Setup {
    coreId: string;
    projectId: string;
}

/**
 * The database.
 * 
 * @interface Database
 * @property {string} projectId The project id.
 * @property {string} coreId The core id.
 * @property {Job[]} jobs The jobs.
 * @property {number} completedJobsCount The amount of completed jobs.
 * @property {CompletedJob[]} completedJobs The completed jobs.
 */
export interface Database {
    projectId: string;
    coreId: string;
    jobs: Job[];
    completedJobsCount: number;
    completedJobs: CompletedJob[];
}

/**
 * A completed job.
 * 
 * @interface CompletedJob
 * @property {string} jobid The job id.
 * @property {string} coreid The core id.
 * @property {number} taskAmount The amount of tasks in the job.
 * @property {number[][]} result The result of the job.
 * @property {Date} creationTime The creation time of the job.
 * @property {Date} completionTime The completion time of the job.
 * @property {number} timeTaken The time taken to complete the job.
 */
export interface CompletedJob {
    jobid: string;
    coreid: string;
    taskAmount: number;
    result: number[][];
    creationTime: Date;
    completionTime: Date;
    timeTaken: number;
}
