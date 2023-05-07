import { DEFAULT_GRID_SERVER_ENDPOINT, DEFAULT_CORE_PATH } from "./config";
import fs from "fs";
import { DatabaseHandler } from "./db";

export async function runSetup() {
    const database = DatabaseHandler.getInstance();

    if (!checkProjectID(database.database.projectId)) {
        console.log("no project id, getting one");
        await getProjectID().then((res) => {
            console.log("got project id", res);
            database.setProjectId(res);
            console.log("set project id", database.database.projectId);
        });
    }
    if (!checkCoreID(database.database.coreId)) {
        console.log("no core id, getting one");
        await getCoreID().then((res) => {
            console.log("got core id", res);
            database.setCoreId(res);
            console.log("set core id", database.database.coreId);
        });
    }

    if (!database.haveUnfinishedJobs()) {
        console.log("not enough work, creating more");
        database.makeJobs();
    }
}

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
