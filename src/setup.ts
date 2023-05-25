import { DEFAULT_GRID_SERVER_ENDPOINT, DEFAULT_CORE_PATH } from "./config";
import fs from "fs";
import { DatabaseHandler } from "./db";
import config from "./config";

/**
 * Runs the setup process. This includes getting a project id and a core id, and creating jobs, if necessary.
 *
 * @async
 * @function runSetup
 */
export async function runSetup() {
    const database = DatabaseHandler.getInstance();

    if (!checkProjectID(database.database.projectId)) {
        console.log("no project id, getting one");
        await getProjectID().then((res) => {
            console.log("got project id", res);
            database.setProjectId(res);
        });
    }
    if (!checkCoreID(database.database.coreId)) {
        console.log("no core id, getting one");
        await getCoreID().then((res) => {
            console.log("got core id", res);
            database.setCoreId(res);
        });
    }

    if (database.countUnfinishedTasks() < config.MINIMUM_TASKS) {
        console.log("not enough work, creating more");
        database.makeJobs();
    }
}

/**
 * Registers a project with the grid server, and recieves a project id in response.
 *
 * @async
 * @function getProjectID
 * @returns {Promise<string>} The project id.
 */
async function getProjectID(): Promise<string> {
    let projectId: string = "";
    await fetch(
        (process.env.GRID_SERVER_ENDPOINT || DEFAULT_GRID_SERVER_ENDPOINT) +
            "/api/project/signup",
        {
            method: "POST"
        }
    )
        .then((res) => res.json())
        .then((res) => (projectId = res.projectid));
    return projectId;
}

/**
 * Registers a core with the grid server, and recieves a core id in response.
 *
 * @async
 * @function getCoreID
 * @returns {Promise<string>} The core id.
 */
async function getCoreID(): Promise<string> {
    let coreId: string = "";
    const buffer: Buffer = fs.readFileSync(
        process.env.GRID_CORE_PATH || DEFAULT_CORE_PATH
    );

    const blob: Blob = new Blob([buffer], { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("core", blob, "core");

    const response = await fetch(
        (process.env.GRID_SERVER_ENDPOINT || DEFAULT_GRID_SERVER_ENDPOINT) +
            "/api/project/core",
        {
            method: "POST",
            body: formData
        }
    );

    const json = await response.json();
    coreId = json.coreid;

    return coreId;
}

/**
 * Checks if the project id is valid.
 * @param {string} projectId The project id to check.
 * @returns {boolean} True if the project id is valid, false otherwise.
 */
function checkProjectID(projectId: string): boolean {
    if (
        projectId &&
        projectId !== "" &&
        projectId !== "null" &&
        projectId !== "undefined" &&
        projectId !== "0000"
    ) {
        return true;
    }
    return false;
}

/**
 * Checks if the core id is valid.
 * @param {string} coreId The core id to check.
 * @returns {boolean} True if the core id is valid, false otherwise.
 */
function checkCoreID(coreId: string): boolean {
    if (
        coreId &&
        coreId !== "" &&
        coreId !== "null" &&
        coreId !== "undefined" &&
        coreId !== "0000"
    ) {
        return true;
    }
    return false;
}
