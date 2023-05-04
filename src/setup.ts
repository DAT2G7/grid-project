import { DEFAULT_GRID_SERVER_ENDPOINT, DEFAULT_CORE_PATH } from "./config";
import fs from "fs";
import { DatabaseHandler } from "./db";

export let coreId: string = "";
export let projectId: string = "";

export async function runSetup(database: DatabaseHandler) {
    if (
        database.database.coreId === "0000" ||
        database.database.projectId === "0000"
    ) {
        console.log("Creating database on disk");
        database.createDatabaseOnDisk();
        await getProjectID().then((res) => {
            database.setProjectId(res);
        });
        await getCoreID().then((res) => {
            database.setCoreId(res);
        });
        database.makeJobs();
    } else if (!database.haveUnfinishedJobs()) {
        console.log("not enough jobs, creating more");
        database.makeJobs();
    }
}

async function getProjectID(): Promise<string> {
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

async function getCoreID(): Promise<string> {
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

    //console.log("Response:");
    //console.log(response);
    const json = await response.json();
    //console.log("JSON:");
    //console.log(json);
    coreId = json.coreid;
    //console.log("Core ID:");
    //console.log(coreId);

    return coreId;
}
