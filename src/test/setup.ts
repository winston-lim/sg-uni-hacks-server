import { Connection } from "typeorm";
import { testConn } from "./testConn";

jest.mock(__dirname + "/../utils/sendEmail.ts");

let testConnection: Connection;
beforeEach(async () => {
	jest.clearAllMocks();
	testConnection = await testConn(true);
	await testConnection.query(`
		DELETE FROM "public".user;
		DELETE FROM hack;
		DELETE FROM vote;
	`);
});
afterEach(async () => {
	await testConnection.close();
});
