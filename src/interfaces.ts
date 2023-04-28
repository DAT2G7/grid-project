export interface GetTaskQuery {
    coreid: string;
    jobid: string;
    taskid: string;
}

export interface Job {
    jobid: string;
    tasks: Task[];
    taskAmount: number;
    coreid: string;
    creationTime: Date;
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
    matrixColumnIndex: number;
}

export interface TaskData {
    matrix: number[][];
    column: number[];
}

export interface RawData {
    coreid: string;
    matrixOne: number[][];
    matrixTwo: number[][];
}

export interface FinishedJobs {
    jobs: Job[];
}

export interface Result {
    result: number[][];
}
