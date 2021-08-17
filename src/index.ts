import "dotenv-safe/config";
import { createConnection } from "typeorm";
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
import { createAdmin } from "./utils/createAdmin";
declare module "express-session" {
	export interface SessionData {
		userId: string;
		role: UserRole;
	}
}

const start = async () => {
	const conn = await createConnection({
		type: "postgres",
		url: process.env.DATABASE_URL,
		logging: true,
		// synchronize: true,
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
	const redis = new Redis(process.env.REDIS_URL);
	app.set("proxy", 1);
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
				domain: __prod__ ? ".winston-lim.com" : undefined,
			},
			saveUninitialized: false,
			secret: process.env.SESSION_SECRET, //to set later on
			resave: false,
		})
	);

	app.use(
		cors({
			origin: process.env.CORS_ORIGIN, //to set later on
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

	app.listen(parseInt(process.env.PORT), () => {
		console.log("Server started on 4000");
	});
	await createAdmin();
};

start();
