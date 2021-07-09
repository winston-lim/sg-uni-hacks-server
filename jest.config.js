module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	setupFilesAfterEnv: ["./src/test/setup.ts"],
	modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
