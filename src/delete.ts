import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getAllFiles } from "./helper.js";

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

export { deleteAllFiles, deleteFile };
