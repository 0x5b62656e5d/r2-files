import {
    S3Client,
    HeadObjectCommand,
    ListObjectsV2CommandOutput,
    _Object,
} from "@aws-sdk/client-s3";
import { checkFileExists, getAllFiles, listAllFiles } from "../helper";

const { S3Client: MockedS3Client } = jest.requireMock("@aws-sdk/client-s3");

let mockClient: S3Client;

beforeEach(() => {
    mockClient = new MockedS3Client({}) as unknown as S3Client;
});

describe("Helper functions tests", () => {
    test("Checks if an object exists in the bucket", async () => {
        const exists = await checkFileExists(mockClient, "bucket", "file.txt");

        expect(exists).toBeTruthy();
        expect(mockClient.send).toHaveBeenCalledWith(
            new HeadObjectCommand({ Bucket: "bucket", Key: "file.txt" })
        );
    });

    test("Checks if an object does not exist in the bucket", async () => {
        (mockClient.send as jest.Mock).mockRejectedValueOnce({
            $metadata: { httpStatusCode: 404 },
        });

        const exists = await checkFileExists(mockClient, "bucket", "file.txt");

        expect(exists).toBeFalsy();
    });

    test("Handles error when checking object existence", async () => {
        const error = new Error("Some error");
        (mockClient.send as jest.Mock).mockRejectedValueOnce(error);

        await expect(checkFileExists(mockClient, "bucket", "file.txt")).rejects.toThrow(error);
    });

    test("Gets all the files from the bucket", async () => {
        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            Contents: [{ Key: "file1key" }, { Key: "file2key" }] as _Object[],
        });
        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            Metadata: { name: "file1name" },
        });
        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            Metadata: { name: "file2name" },
        });

        const files = await getAllFiles(mockClient, "bucket");

        expect(files).toEqual([
            { fileKey: "file1key", fileName: "file1name" },
            { fileKey: "file2key", fileName: "file2name" },
        ]);
    });

    test("Console.table is called with the correct arguments", async () => {
        const consoleSpy = jest.spyOn(console, "table").mockImplementation();

        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            Contents: [{ Key: "file1key" }] as _Object[],
        });
        (mockClient.send as jest.Mock).mockResolvedValueOnce({
            Metadata: { name: "filename" },
        });

        await listAllFiles(mockClient, "bucket");

        expect(consoleSpy).toHaveBeenCalledWith([
            { "File key": "file1key", "File name": "filename" },
        ]);
    });

    test("Empty buckets returns null when getting all files", async () => {
        (mockClient.send as jest.Mock).mockResolvedValueOnce({});

        const files = await getAllFiles(mockClient, "bucket");

        expect(files).toBeNull();
    });

    test("Console.log specifies that no files are in an empty bucket", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        (mockClient.send as jest.Mock).mockResolvedValueOnce({});

        await listAllFiles(mockClient, "bucket");

        expect(consoleSpy).toHaveBeenCalledWith("No objects were found in the bucket.");
        consoleSpy.mockRestore();
    });
});
