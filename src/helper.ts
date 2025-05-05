import {
    _Object,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    ListObjectsV2CommandOutput,
    S3Client,
} from "@aws-sdk/client-s3";
import { FileMetadata, R2Object } from "./types/types.js";

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

/**
 * Lists all files in the specified S3 bucket
 *
 * @param client The {@link S3Client} client instance
 * @param bucket The name of the S3 bucket
 * @returns An {@link R2Object} array
 */
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
        listOfFiles.map(object => ({
            "File key": object.fileKey,
            "File name": object.fileName,
        }))
    );
};

export { checkFileExists, getAllFiles, listAllFiles };
