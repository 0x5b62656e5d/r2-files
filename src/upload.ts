import { _Object, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import clipboard from "clipboardy";
import { createReadStream } from "fs";
import { v4 as uuidv4 } from "uuid";
import { checkFileExists } from "./helper.js";
import mime from "mime";

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
            ContentType: mime.getType(fileName) || "application/octet-stream",
        },
    });

    upload.on("httpUploadProgress", progress => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);

        if (progress.loaded && progress.total) {
            process.stdout.write(
                `Uploaded ${Math.round((progress.loaded / progress.total) * 10000) / 100}%`
            );
        } else {
            process.stdout.write("Starting upload...");
        }
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

export { upload, uploadFile };
