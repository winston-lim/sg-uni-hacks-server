import { createConnection } from "typeorm";
import { Hack } from "../entities/Hack";
import { User } from "../entities/User";
import { Vote } from "../entities/Vote";

export const testConn = (drop: boolean = false, connectionName?: string) => {
	return createConnection({
		name: connectionName,
		type: "postgres",
		database: "sg-uni-hacks-test",
		username: "postgres",
		password: "6928891Zz",
		synchronize: drop,
		entities: [User, Hack, Vote],
		dropSchema: drop,
	});
};
