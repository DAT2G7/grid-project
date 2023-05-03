import config from "./config";
import { Job, RawData } from "./interfaces";
import { createJob, registerJob } from "./task.model";
import fs from "fs";

export function checkWorkQueue(): number {
    const jobs: Job[] = JSON.parse(
        fs.readFileSync(config.JOBS_DB_PATH, "utf8")
    );

    let queuedTasks = 0;

    jobs.forEach((job) => {
        if (job.completedTasks < job.taskAmount) {
            queuedTasks += job.taskAmount - job.completedTasks;
        }
    });

    return queuedTasks;
}

export function createWork() {
    const rawData = generateRawData();

    const job = createJob(rawData);
    registerJob(job);
}

function generateRawData(): RawData {
    let rawData: RawData = {
        coreid: config.CORE_ID,
        matrixes: []
    };

    for (let i = 0; i < config.TASK_AMOUNT + 1; i++) {
        rawData.matrixes[i] = generateMatrix();
    }
    return rawData;
}

function generateMatrix(): number[][] {
    let matrix: number[][] = [];

    for (let i = 0; i < config.MATRIX_HEIGHT; i++) {
        matrix[i] = [];
        for (let j = 0; j < config.MATRIX_WIDTH; j++) {
            matrix[i][j] = Math.random() * 10;
        }
    }

    return matrix;
}
