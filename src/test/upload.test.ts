import { S3Client, _Object } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import clipboard from "clipboardy";
import { createReadStream } from "fs";
import { uploadFile } from "../upload";

const { S3Client: MockedS3Client } = jest.requireMock("@aws-sdk/client-s3");

let mockClient: S3Client;

beforeEach(() => {
    mockClient = new MockedS3Client({}) as unknown as S3Client;
});

describe("Upload file tests", () => {
    test("Uploads a file successfully", async () => {
        const uploadProgressMock = {
            on: jest.fn((event, callback) => {
                if (event === "httpUploadProgress") {
                    callback({ loaded: 512, total: 1024 });
                }
            }),
            done: jest.fn().mockResolvedValueOnce({}),
        };
        (Upload as unknown as jest.Mock).mockImplementation(() => uploadProgressMock);

        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
        const stdoutWrite = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

        await uploadFile(mockClient, "bucket", "path/to/file.txt", "file.txt", ".txt");

        expect(uploadProgressMock.on).toHaveBeenCalledWith(
            "httpUploadProgress",
            expect.any(Function)
        );
        expect(stdoutWrite).toHaveBeenCalledWith("Uploaded 50%");
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Upload successful"));
    });

    test("Handles null progress values", async () => {
        const uploadProgressMock = {
            on: jest.fn((event, callback) => {
                if (event === "httpUploadProgress") {
                    callback({ loaded: null, total: 1024 });
                }
            }),
            done: jest.fn().mockResolvedValueOnce({}),
        };

        (Upload as unknown as jest.Mock).mockImplementation(() => uploadProgressMock);

        const stdoutWrite = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

        await uploadFile(mockClient, "bucket", "path/to/file.txt", "file.txt", ".txt");

        expect(uploadProgressMock.on).toHaveBeenCalledWith(
            "httpUploadProgress",
            expect.any(Function)
        );
        expect(stdoutWrite).toHaveBeenCalledWith("Starting upload...");
    });

    test("Uploads a file with a UUID key", async () => {
        await uploadFile(mockClient, "bucket", "path/to/file.txt", "file.txt", ".txt");

        expect(Upload).toHaveBeenCalledTimes(1);
        expect(clipboard.writeSync).toHaveBeenCalledWith(
            expect.stringMatching(
                /^https:\/\/example.com\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}\.txt$/
            )
        );
    });

    test("Uploads a file with a specified key", async () => {
        (mockClient.send as jest.Mock).mockRejectedValueOnce({
            $metadata: { httpStatusCode: 404 },
        });

        await uploadFile(mockClient, "bucket", "path/to/file.txt", "file.txt", ".txt", "file");

        expect(Upload).toHaveBeenCalledWith({
            client: mockClient,
            params: {
                Bucket: "bucket",
                Key: "file.txt",
                Body: createReadStream("path/to/file.txt"),
                Metadata: {
                    name: "file.txt",
                },
                ContentType: "text/plain",
            },
        });
        expect(clipboard.writeSync).toHaveBeenCalledTimes(1);
    });

    test("Uploads a file with a specified key that already exists", async () => {
        (mockClient.send as jest.Mock).mockResolvedValueOnce({});

        await uploadFile(mockClient, "bucket", "path/to/file.txt", "file.txt", ".txt", "file");

        expect(clipboard.writeSync).toHaveBeenCalledWith(
            expect.stringMatching(
                /^https:\/\/example.com\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}\.txt$/
            )
        );
    });

    test("Handles upload errors", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        (Upload as unknown as jest.Mock).mockImplementation(() => ({
            on: jest.fn(),
            done: jest.fn().mockRejectedValue("Upload failed"),
        }));

        await uploadFile(mockClient, "bucket", "path/to/file.txt", "file.txt", ".txt");

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Upload failed");
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleErrorSpy.mockRestore();
    });
});
