import config from "./config";
import { RawData } from "./interfaces";

export function generateRawData(coreId: string): RawData {
    let rawData: RawData = {
        coreid: coreId,
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
