import { createConnection, getConnection } from "typeorm";
import path from "path";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import express from "express";
import connectRedis from "connect-redis";
import session from "express-session";
import Redis from "ioredis";
import { COOKIE_NAME, __prod__ } from "./constants";
import cors from "cors";
import { MyContext } from "./types";
import { UserResolver } from "./resolvers/user";
import { User, UserRole } from "./entities/User";
import { Hack } from "./entities/Hack";
import { Vote } from "./entities/Vote";
import { createUserLoader, createVoteLoader } from "./utils/loaders";
import { HackResolver } from "./resolvers/hack";
import argon2 from "argon2";
require("dotenv").config();
declare module "express-session" {
	export interface SessionData {
		userId: string;
		role: UserRole;
	}
}

const start = async () => {
	const conn = await createConnection({
		type: "postgres",
		database: "sg-uni-hacks",
		username: "postgres",
		password: "6928891Zz",
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, "./migrations/*")],
		entities: [User, Hack, Vote],
	});
	// await Vote.delete({});
	// await Hack.delete({});
	// await User.delete({});
	console.log("USERS: ", await User.find({}));
	console.log("HACKS: ", await Hack.find({}));
	console.log("VOTES: ", await Vote.find({}));
	await conn.runMigrations();

	const app = express();

	const RedisStore = connectRedis(session);
	const redis = new Redis();

	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
				disableTTL: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
				httpOnly: true,
				secure: __prod__,
				sameSite: "lax",
			},
			saveUninitialized: false,
			secret: "random secret", //to set later on
			resave: false,
		})
	);

	app.use(
		cors({
			origin: "http://localhost:3000", //to set later on
			credentials: true,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [UserResolver, HackResolver],
			validate: false, //avoid using default validator
		}),
		context: ({ req, res }): MyContext => ({
			req,
			res,
			redis,
			userLoader: createUserLoader(),
			voteLoader: createVoteLoader(),
		}),
	});

	apolloServer.applyMiddleware({
		app,
		cors: false,
	});

	app.listen(4000, () => {
		console.log("Server started on 4000");
	});
	const hashedPassword = await argon2.hash(
		process.env.ADMIN_PASSWORD || "default"
	);
	try {
		await getConnection()
			.createQueryBuilder()
			.insert()
			.into(User)
			.values({
				username: "admin1",
				email: "winston_lim1@hotmail.com",
				password: hashedPassword,
				role: UserRole.ADMIN,
			})
			.returning("*")
			.execute();
		console.log("Created admin!");
	} catch (e) {
		console.log("Error creating admin: MESSAGE= ", e.message);
	}
};

start();
