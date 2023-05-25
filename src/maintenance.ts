import config from "./config";
import { RawData } from "./interfaces";

/**
 * Generates raw data for a job. This includes a core id and a matrix. The matrix is a 2d array of numbers.
 *
 * @function generateRawData
 * @param {string} coreId The core id to use.
 * @returns {RawData} The generated raw data.
 */
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

/**
 * Generates a matrix. This is a 2d array of numbers.
 *
 * @function generateMatrix
 * @returns {number[][]} The generated matrix.
 */
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
