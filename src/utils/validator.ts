import { ValidationError } from "apollo-server-express";
import { isUUID, validateOrReject } from "class-validator";
import { User } from "../entities/User";
import { FieldError } from "../types";

const applyClassValidation = async (user: User) => {
	try {
		await validateOrReject(user, {
			skipMissingProperties: true,
		});
		return null;
	} catch (e) {
		const errors = (e as ValidationError[]).map((e) => {
			return {
				field: e.property,
				message:
					e.constraints!.isEmail || e.constraints!.minLength || e.message,
			};
		});
		return errors;
	}
};

export const validateRegister = async (
	username: string,
	email: string,
	password: string
): Promise<FieldError[] | null> => {
	const user = new User();
	user.username = username;
	user.email = email;
	user.password = password;
	return await applyClassValidation(user);
};

export const validateLogin = async (
	usernameOrEmail: string,
	password: string
): Promise<FieldError[] | null> => {
	const user = new User();
	usernameOrEmail.includes("@")
		? (user.email = usernameOrEmail)
		: (user.username = usernameOrEmail);
	user.password = password;
	const errors = await applyClassValidation(user);
	errors?.forEach((e) => {
		if (e.field === "username" || e.field === "email") {
			e.field = "usernameOrEmail";
		}
	});
	return errors;
};

export const validateForgetPassword = async (
	email: string
): Promise<FieldError[] | null> => {
	const user = new User();
	user.email = email;
	return await applyClassValidation(user);
};

export const validateChangePassword = async (
	newPassword: string,
	token: string
): Promise<FieldError[] | null> => {
	const user = new User();
	user.password = newPassword;
	const errors = await applyClassValidation(user);
	const validUuid = isUUID(token);
	if (!validUuid) {
		if (errors) {
			errors.push({
				field: "token",
				message: "invalid token",
			});
		} else {
			return [
				{
					field: "token",
					message: "invalid token",
				},
			];
		}
	}
	return errors;
};
