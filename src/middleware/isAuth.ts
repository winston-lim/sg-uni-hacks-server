import { MiddlewareFn } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
	if (!context.req.session.userId) {
		throw new Error("not authenticated");
	}
	const user = await User.findOne(context.req.session.userId);
	if (!user) {
		throw new Error("user no longer exists");
	}
	return next();
};
