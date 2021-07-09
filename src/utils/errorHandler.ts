import { UserResponse } from "../types";

export const registerErrorHandler = (e: any): UserResponse => {
	//duplicate username or email
	if (e.code === "23505") {
		let field: string;
		let fallbackMessage: string | undefined;
		if (e.detail.includes("email")) {
			field = "email";
		} else {
			field = "username";
		}
		return {
			errors: [
				{
					field,
					message: fallbackMessage || `${field} already exists`,
				},
			],
		};
	}
	return {
		errors: [
			{
				field: "password",
				message: e,
			},
		],
	};
};
