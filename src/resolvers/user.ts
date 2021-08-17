import argon2 from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { getConnection } from "typeorm";
import { User, UserRole } from "../entities/User";
import { MyContext, UsernamePasswordInput, UserResponse } from "../types";
import {
	validateChangePassword,
	validateForgetPassword,
	validateLogin,
	validateRegister,
} from "../utils/validator";
import { registerErrorHandler } from "../utils/errorHandler";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";

@Resolver(User)
export class UserResolver {
	// @FieldResolver(()=> String)
	// email(@Root() user: User, @Ctx() { req }: MyContext) {
	//   if (req.session.userId === user.id) {
	//     return user.email;
	//   } else {
	//     return "";
	//   }
	// }

	@Query(() => User, { nullable: true })
	async currentUser(@Ctx() { req }: MyContext): Promise<User | undefined> {
		if (!req.session.userId) {
			return;
		}
		return User.findOne(req.session.userId);
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const { username, email, password } = options;
		const errors = await validateRegister(username, email, password);
		if (errors) return { errors };
		const hashedPassword = await argon2.hash(password);
		let createdUser;
		try {
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username,
					email,
					password: hashedPassword,
					role: UserRole.REGULAR,
				})
				.returning("*")
				.execute();
			createdUser = result.raw[0];
		} catch (e) {
			return registerErrorHandler(e);
		}
		req.session.userId = createdUser.id;
		req.session.role = createdUser.role;
		return {
			user: createdUser,
		};
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg("usernameOrEmail") usernameOrEmail: string,
		@Arg("password") password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const errors = await validateLogin(usernameOrEmail, password);
		if (errors) return { errors };
		const user = await User.findOne(
			usernameOrEmail.includes("@")
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		);
		if (!user) {
			return {
				errors: [
					{
						field: "usernameOrEmail",
						message: "user does not exist",
					},
				],
			};
		}
		const valid = await argon2.verify(user.password, password);
		if (!valid) {
			return {
				errors: [
					{
						field: "password",
						message: "incorrect password",
					},
				],
			};
		}
		req.session.userId = user.id;
		req.session.role = user.role;
		return {
			user,
		};
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
		return new Promise((resolve) => {
			req.session.destroy((err) => {
				if (err) {
					console.log(err);
					return resolve(false);
				}
				res.clearCookie(COOKIE_NAME);
				return resolve(true);
			});
		});
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg("email") email: string,
		@Ctx() { redis }: MyContext
	): Promise<boolean> {
		const errors = await validateForgetPassword(email);
		if (errors) return false;
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return true;
		}
		const token = v4();
		const changePasswordToken = FORGET_PASSWORD_PREFIX + token;
		if (user?.changePasswordToken) {
			await redis.del(user.changePasswordToken);
		}
		try {
			await redis.set(
				changePasswordToken,
				user.id,
				"ex",
				1000 * 60 * 60 * 24 * 3
			);
			user.changePasswordToken = token;
			await user.save();
			sendEmail(
				email,
				"Password reset",
				`<a href="${process.env.CORS_ORIGIN}/change-password/${token}"> Click here to reset password </a>`
			);
			return true;
		} catch (e) {
			console.log("ERROR USER:forgotPassword : ", e);
			return false;
		}
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg("newPassword") newPassword: string,
		@Arg("token") token: string,
		@Ctx() { req, redis }: MyContext
	): Promise<UserResponse> {
		const errors = await validateChangePassword(newPassword, token);
		if (errors) return { errors };
		const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
		const user = await User.findOne({ where: { id: userId } });
		if (!userId) {
			return {
				errors: [
					{
						field: "token",
						message: "token is invalid or expired",
					},
				],
			};
		}
		if (!user) {
			return {
				errors: [
					{
						field: "token",
						message: "user no longer exists",
					},
				],
			};
		}
		const isOld = await argon2.verify(user.password, newPassword);
		if (isOld) {
			return {
				errors: [
					{
						field: "password",
						message: "new password cannot be the same as old password",
					},
				],
			};
		}
		user.password = await argon2.hash(newPassword);
		user.changePasswordToken = null;
		await user.save();
		await redis.del(FORGET_PASSWORD_PREFIX + token);
		req.session.userId = user.id;
		req.session.role = user.role;
		return {
			user,
		};
	}
}
