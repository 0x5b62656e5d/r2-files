/** @type {import('jest').Config} */
const config = {
    verbose: true,
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testPathIgnorePatterns: ["<rootDir>/dist/"],
    setupFilesAfterEnv: [ "<rootDir>/src/test/jest.setup.ts" ],
};

export default config;
