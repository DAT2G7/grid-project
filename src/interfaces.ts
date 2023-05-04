export interface GetTaskQuery {
    projectid: string;
    jobid: string;
    taskid: string;
}

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

export interface Task {
    jobid: string;
    taskid: string;
    completed: boolean;
    delegationTime?: Date;
    completionTime?: Date;
    taskData: TaskData;
    taskIndex: number;
}

export interface RawData {
    coreid: string;
    matrixes: number[][][];
}

export interface FinishedJobs {
    jobs: Job[];
}

export interface TaskData {
    matrixA?: number[][];
    matrixB?: number[][];
}

export interface Result {
    result: number[][];
}

export interface Setup {
    coreId: string;
    projectId: string;
}

export interface Database {
    projectId: string;
    coreId: string;
    jobs: Job[];
    completedJobsCount: number;
    completedJobs: CompletedJob[];
}

export interface CompletedJob {
    jobid: string;
    coreid: string;
    taskAmount: number;
    result: number[][];
    creationTime: Date;
    completionTime: Date;
    timeTaken: number;
}
