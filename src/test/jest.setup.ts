import { _Object } from "@aws-sdk/client-s3";

jest.mock("@aws-sdk/client-s3", () => ({
    S3Client: jest.fn(() => ({
        send: jest.fn(),
    })),
    HeadObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    GetObjectCommand: jest.fn(),
}));

jest.mock("@aws-sdk/lib-storage", () => ({
    Upload: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        done: jest.fn().mockResolvedValue({}),
    })),
}));

jest.mock("node-fetch");

jest.mock("clipboardy", () => ({
    writeSync: jest.fn(),
}));

jest.mock("fs", () => ({
    createReadStream: jest.fn(),
    createWriteStream: jest.fn(() => ({
        on: jest.fn((event, cb) => {
            if (event === "finish") cb();
        }),
    })),
}));

const mockStdout = {
    write: jest.fn(),
    isTTY: true,
    clearLine: jest.fn(),
    cursorTo: jest.fn(),
};

Object.defineProperty(process, "stdout", {
    value: mockStdout,
});

beforeAll(() => {
    process.env.DOWNLOAD_URL = "https://example.com";
    jest.spyOn(process, "exit").mockImplementation();
    jest.spyOn(process.stdout, "clearLine").mockImplementation(() => true);
    jest.spyOn(process.stdout, "cursorTo").mockImplementation(() => true);
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterAll(() => {
    (process.exit as unknown as jest.Mock).mockRestore();
    (process.stdout.clearLine as unknown as jest.Mock).mockRestore();
    (process.stdout.cursorTo as unknown as jest.Mock).mockRestore();
    (process.stdout.write as unknown as jest.Mock).mockRestore();
});

afterEach(() => {
    jest.clearAllMocks();
});
