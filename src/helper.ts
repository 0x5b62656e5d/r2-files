import {
    _Object,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    ListObjectsV2CommandOutput,
    S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import clipboard from "clipboardy";
import { createReadStream, createWriteStream } from "fs";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

type FileMetadata = {
    name: string;
};

type R2Object = {
    fileKey: string;
    fileName: string;
};

/**
 * Prepares and uploads a file to the specified S3 bucket
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 * @param filePath The path to the file to be uploaded
 * @param fileName The name of the file to be uploaded
 * @param fileExtension The file extension of the file to be uploaded
 * @param desiredFileNameWithoutExtension The desired file name without extension (optional)
 */
const uploadFile = async (
    client: S3Client,
    bucket: string,
    filePath: string,
    fileName: string,
    fileExtension: string,
    desiredFileNameWithoutExtension?: string
) => {
    if (desiredFileNameWithoutExtension) {
        const desiredFileName = desiredFileNameWithoutExtension + fileExtension;

        const exists = await checkFileExists(client, bucket, desiredFileName);

        if (exists) {
            console.warn(
                `Error: Object with key "${desiredFileName}" already exists in bucket "${bucket}"`
            );
            console.warn("Defaulting to UUID key.");

            await upload(client, bucket, filePath, fileName, `${uuidv4()}${fileExtension}`);
        } else {
            await upload(client, bucket, filePath, fileName, desiredFileName);
        }
    } else {
        await upload(client, bucket, filePath, fileName, `${uuidv4()}${fileExtension}`);
    }
};

/**
 * Uploads a file to the specified S3 bucket
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 * @param filePath The path to the file to be uploaded
 * @param fileName The name of the file to be uploaded
 * @param fileKey The object key for the uploaded file
 */
const upload = async (
    client: S3Client,
    bucket: string,
    filePath: string,
    fileName: string,
    fileKey: string
) => {
    const upload = new Upload({
        client: client,
        params: {
            Bucket: bucket,
            Key: fileKey,
            Body: createReadStream(filePath),
            Metadata: {
                name: fileName,
            },
        },
    });

    upload.on("httpUploadProgress", progress => {
        console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes`);
    });

    try {
        await upload.done();
        console.log(`Upload successful: ${fileKey}`);

        const fileUrl = `${process.env.DOWNLOAD_URL}/${fileKey}`;
        console.log(fileUrl);
        clipboard.writeSync(fileUrl);
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

/**
 * Deletes a file from the specified S3 bucket
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 * @param fileKey The object key of the file to be deleted
 */
const deleteFile = async (client: S3Client, bucket: string, fileKey: string) => {
    const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
    });

    const response = await client.send(deleteCommand);

    if (response.$metadata.httpStatusCode === 204) {
        console.log("File deleted successfully");
    } else if (response.$metadata.httpStatusCode === 404) {
        console.log("File not found.");
    }
};

/**
 * Deletes all files in the specified S3 bucket
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 */
const deleteAllFiles = async (client: S3Client, bucket: string) => {
    const listOfFiles = await getAllFiles(client, bucket);

    if (!listOfFiles) {
        console.log("No objects were in the bucket. Nothing was deleted.");
        return;
    }

    listOfFiles.map(async object => {
        await client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: object.fileKey,
            })
        );
    });
};

/**
 * Checks if an object exists in the specified S3 bucket
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 * @param key The object key to check
 *
 * @returns True if the object exists, false otherwise
 */
const checkFileExists = async (client: S3Client, bucket: string, key: string) => {
    try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
    } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 404) {
            return false;
        }

        console.error("Error checking object existence:", error);
        throw error;
    }
};

const getAllFiles = async (client: S3Client, bucket: string) => {
    const listOfFiles: R2Object[] = [];

    let continuationToken;

    do {
        const listObjects: ListObjectsV2CommandOutput = await client.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                ContinuationToken: continuationToken,
            })
        );

        if (!listObjects.Contents) {
            return null;
        }

        for (const item of listObjects.Contents as _Object[]) {
            const fileKey = item.Key as string;
            const objectName: string = (
                (
                    await client.send(
                        new GetObjectCommand({
                            Bucket: bucket,
                            Key: fileKey,
                        })
                    )
                ).Metadata as FileMetadata
            ).name;

            listOfFiles.push({
                fileKey: fileKey,
                fileName: objectName,
            });
        }

        continuationToken = listObjects.IsTruncated ? listObjects.NextContinuationToken : undefined;
    } while (continuationToken);

    return listOfFiles;
};

/**
 * Lists all objects in the SQLite database
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 */
const listAllFiles = async (client: S3Client, bucket: string) => {
    const listOfFiles = await getAllFiles(client, bucket);
    if (!listOfFiles) {
        console.log("No objects were found in the bucket.");
        return;
    }

    console.table(
        ((await getAllFiles(client, bucket)) as R2Object[]).map(object => ({
            "File key": object.fileKey,
            "File name": object.fileName,
        }))
    );
};

/**
 * Downloads a file from the specified S3 bucket
 *
 * @param fileKey The object key of the file to be downloaded
 * @param downloadPath The path where the file will be downloaded
 * @param downloadName The name of the downloaded file (optional)
 */
const downloadFile = async (fileKey: string, downloadPath: string, downloadName?: string) => {
    try {
        const res = await fetch(`${process.env.DOWNLOAD_URL}/${fileKey}`);
        if (!downloadPath.endsWith("/")) {
            downloadPath += "/";
        }
        const fileStream = createWriteStream(`${downloadPath}${downloadName || fileKey}`);

        await new Promise<void>((resolve, reject) => {
            if (res.body) {
                res.body.pipe(fileStream);
            } else {
                throw new Error("Response body is null");
            }
            res.body.on("error", reject);
            fileStream.on("finish", resolve);
        });
    } catch (error) {
        console.error("Error downloading file:", error);
        process.exit(1);
    }
};

export { deleteAllFiles, deleteFile, downloadFile, listAllFiles, uploadFile };
