import {
    S3Client,
    DeleteObjectCommand,
    ListObjectsV2CommandOutput,
    _Object,
} from "@aws-sdk/client-s3";
import { deleteAllFiles, deleteFile } from "../delete";

const { S3Client: MockedS3Client } = jest.requireMock("@aws-sdk/client-s3");

let mockClient: S3Client;

beforeEach(() => {
    mockClient = new MockedS3Client({}) as unknown as S3Client;
});

describe("Delete file tests", () => {
    test("Deleting a file with 404 handled", async () => {
        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 404,
            },
        });

        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        await deleteFile(mockClient, "bucket", "file.txt");

        expect(consoleLogSpy).toHaveBeenCalledWith("File not found.");

        consoleLogSpy.mockRestore();
    });

    test("Deletes a file successfully", async () => {
        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 204,
            },
        });

        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        await deleteFile(mockClient, "bucket", "file.txt");

        expect(consoleLogSpy).toHaveBeenCalledWith("File deleted successfully");

        consoleLogSpy.mockRestore();
    });

    test("Deletes all files successfully", async () => {
        const listObjectsCommandOutput = {
            Contents: [{ Key: "file1key" }] as _Object[],
        } as ListObjectsV2CommandOutput;

        const listObjects = {
            Metadata: { name: "filename" },
        };

        (mockClient.send as jest.Mock).mockResolvedValueOnce(listObjectsCommandOutput);
        (mockClient.send as jest.Mock).mockResolvedValueOnce(listObjects);
        (mockClient.send as jest.Mock).mockResolvedValueOnce({});

        await deleteAllFiles(mockClient, "bucket");

        expect(mockClient.send).toHaveBeenCalledWith(
            new DeleteObjectCommand({ Bucket: "bucket", Key: "file1key" })
        );
    });

    test("Handles empty bucket when deleting all files", async () => {
        (mockClient.send as jest.Mock).mockResolvedValueOnce({});
        (mockClient.send as jest.Mock).mockResolvedValueOnce({});

        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        await deleteAllFiles(mockClient, "bucket");

        expect(consoleLogSpy).toHaveBeenCalledWith(
            "No objects were in the bucket. Nothing was deleted."
        );
    });
});
