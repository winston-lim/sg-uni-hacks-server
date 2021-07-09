import { MiddlewareFn } from "type-graphql";
import { UserRole } from "../entities/User";
import { MyContext } from "../types";

export const isAdmin: MiddlewareFn<MyContext> = async ({ context }, next) => {
	const isAdmin = context.req.session.role === UserRole.ADMIN;
	if (!isAdmin) {
		throw new Error("not enough permissions");
	}
	return next();
};
