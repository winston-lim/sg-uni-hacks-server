import { Redis } from "ioredis";
import { Request, Response } from "express";
import { Field, InputType, ObjectType } from "type-graphql";
import { User } from "./entities/User";
import { createUserLoader, createVoteLoader } from "./utils/loaders";

export type MyContext = {
	req: Request;
	res: Response;
	redis: Redis;
	userLoader: ReturnType<typeof createUserLoader>;
	voteLoader: ReturnType<typeof createVoteLoader>;
};

@InputType()
export class UsernamePasswordInput {
	@Field()
	username: string;

	@Field()
	email: string;

	@Field()
	password: string;
}

@ObjectType()
export class FieldError {
	@Field()
	field?: string;

	@Field()
	message?: string;
}

@ObjectType()
export class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User | null;
}

export enum Category {
	GENERAL = "general",
	NOTE_TAKING = "note-taking",
	TIME_SAVER = "time-saver",
	TIME_MANAGEMENT = "time-management",
	HEALTH = "health",
	PLANNING = "planning",
	EDUCATION = "education",
	UNIVERSITY = "university",
	FINANCE = "finance",
	TECHNOLOGY = "technology",
	FASHION = "fashion",
	OTHERS = "others",
}

@InputType()
export class CreateHackInput {
	@Field()
	title: string;
	@Field()
	description: string;
	@Field()
	category: Category;
	@Field()
	body: string;
	@Field({ nullable: true })
	s3Url?: string;
}

@InputType()
export class UpdateHackInput {
	@Field({ nullable: true })
	title?: string;
	@Field({ nullable: true })
	description?: string;
	@Field({ nullable: true })
	category?: Category;
	@Field({ nullable: true })
	body?: string;
}
