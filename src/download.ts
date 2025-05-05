import { createWriteStream } from "fs";
import fetch from "node-fetch";

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

export { downloadFile };
