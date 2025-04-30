#!/usr/bin/env node

import { S3Client } from "@aws-sdk/client-s3";
import { config as dotenv } from "dotenv";
import path, { basename, extname } from "path";
import { deleteAllFiles, deleteFile, downloadFile, listAllFiles, uploadFile } from "./helper.js";
import { homedir } from "os";

dotenv({ path: path.join(homedir(), ".config", "r2-files", ".env") });

const validCommands = ["download", "upload", "delete", "list", "delete-all"];

const R2_ACCESS_KEY_ID: string | undefined = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY: string | undefined = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT: string | undefined = process.env.R2_ENDPOINT;
const R2_BUCKET: string | undefined = process.env.R2_BUCKET;

if (!R2_ACCESS_KEY_ID) {
    console.error("Error: Missing Cloudflare R2 access key ID");
    process.exit(1);
} else if (!R2_SECRET_ACCESS_KEY) {
    console.error("Error: Missing Cloudflare R2 secret access key");
    process.exit(1);
} else if (!R2_ENDPOINT) {
    console.error("Error: Missing Cloudflare R2 endpoint");
    process.exit(1);
} else if (!R2_BUCKET) {
    console.error("Error: Missing Cloudflare R2 bucket name");
    process.exit(1);
}

const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

const command = process.argv[2];

if (!command || !validCommands.includes(command)) {
    console.error(
        `Usage:\nr2-files download <file-key> <download-path> [<download-name>]\nr2-files upload <file-path> [<desired-file-name>]\nr2-files delete <object-key>\nr2-files delete-all -y\nr2-files list`
    );

    process.exit(1);
}

if (command === "download") {
    const fileKey: string = process.argv[3];
    const downloadPath: string = process.argv[4];
    const downloadName: string = process.argv[5];

    if (!fileKey || !downloadPath) {
        console.error("Usage: r2-files download <file-key> <download-path> [<download-name>]");
        process.exit(1);
    }

    downloadFile(fileKey, downloadPath, downloadName);
} else if (command === "upload") {
    const filePath: string = process.argv[3];
    const desiredFileNameWithoutExtension: string = process.argv[4];

    if (!filePath) {
        console.error("Usage: r2-files upload <file-path> [<desired-file-name>]");
        process.exit(1);
    }

    await uploadFile(
        client,
        R2_BUCKET,
        filePath,
        basename(filePath),
        extname(filePath),
        desiredFileNameWithoutExtension
    );
} else if (command === "delete") {
    const objectKey: string = process.argv[3];

    if (!objectKey) {
        console.error("Usage: r2-files delete <object-key>");
        process.exit(1);
    }

    await deleteFile(client, R2_BUCKET, objectKey);
} else if (command === "delete-all") {
    const confirmation: string = process.argv[3];
    if (confirmation !== "-y") {
        console.error("Usage: r2-files delete-all -y");
        process.exit(1);
    }

    deleteAllFiles(client, R2_BUCKET);
} else if (command === "list") {
    listAllFiles(client, R2_BUCKET);
}
