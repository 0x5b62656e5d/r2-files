import { _Object } from "@aws-sdk/client-s3";
import fetch from "node-fetch";
import { createWriteStream } from "fs";
import { downloadFile } from "../download";

describe("Download file tests", () => {
    test("Console.error specifies when downloading a nonexistent file", async () => {
        (fetch as unknown as jest.Mock).mockRejectedValue("File doesn't exist");

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await downloadFile("file.txt", "path/to/download", "file.txt");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error downloading file:",
            "File doesn't exist"
        );

        consoleErrorSpy.mockRestore();
    });

    test("Downloads a file successfully", async () => {
        (fetch as unknown as jest.Mock).mockResolvedValueOnce({
            body: {
                pipe: jest.fn(),
                on: jest.fn(),
            },
        });

        const mockWriteStream = {
            on: jest.fn((event, cb) => {
                if (event === "finish") {
                    cb();
                }
            }),
        };
        (createWriteStream as unknown as jest.Mock).mockReturnValueOnce(mockWriteStream);

        await downloadFile("file.txt", "path/to/download", "file.txt");

        expect(fetch).toHaveBeenCalledWith(`${process.env.DOWNLOAD_URL}/file.txt`);
        expect(createWriteStream).toHaveBeenCalledWith("path/to/download/file.txt");
        expect(mockWriteStream.on).toHaveBeenCalledWith("finish", expect.any(Function));
    });

    test("Downloads a file to a path with a trailing slash", async () => {
        (fetch as unknown as jest.Mock).mockResolvedValue({});

        await downloadFile("file.txt", "path/to/download/", "file.txt");

        expect(createWriteStream).toHaveBeenCalledWith("path/to/download/file.txt");
    });
});
