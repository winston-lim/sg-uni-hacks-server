import { FORGET_PASSWORD_PREFIX } from "../../../../constants";
import { User } from "../../../../entities/User";
import { createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { validForgotPasswordMutation } from "./forgotPassword.test";
import { validRegisterMutation } from "./register.test";

export const changePasswordMutuation = `
mutation ChangePassword($newPassword: String!, $token: String!) {
  changePassword(newPassword: $newPassword, token: $token) {
    user {
      id
      username
      email
      role
    }
    errors {
      field
      message
    }
  }
}
`;

export const validChangePasswordMutation = async (
	newPassword: string,
	token: string
) => {
	const context = createContext({});
	const { data } = await graphqlCall({
		source: changePasswordMutuation,
		variableValues: {
			newPassword,
			token,
		},
		context,
	});
	const { changePassword } = data!;
	return { changePassword, context };
};

it("returns specific field error with bad inputs", async () => {
	//short password
	await validRegisterMutation("tester", "tester@test.com", "password");
	const { token } = await validForgotPasswordMutation("tester@test.com");
	const { changePassword } = await validChangePasswordMutation("pw", token);
	const { user, errors } = changePassword;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("password");
	expect(errors[0].message).toEqual(
		"password must be at least 6 characters long"
	);
	expect(errors[1]).not.toBeDefined();
});

it("returns specific field error with bad inputs", async () => {
	//bad token and short password
	await validRegisterMutation("tester", "tester@test.com", "password");
	await validForgotPasswordMutation("tester@test.com");
	const { changePassword } = await validChangePasswordMutation(
		"pw",
		"randomToken"
	);
	const { user, errors } = changePassword;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("password");
	expect(errors[0].message).toEqual(
		"password must be at least 6 characters long"
	);
	expect(errors[1].field).toEqual("token");
	expect(errors[1].message).toEqual("invalid token");
	expect(errors[2]).not.toBeDefined();
});

it("returns specific field error with bad inputs", async () => {
	//old password
	await validRegisterMutation("tester", "tester@test.com", "password");
	const { token } = await validForgotPasswordMutation("tester@test.com");
	const { changePassword } = await validChangePasswordMutation(
		"password",
		token
	);
	const { user, errors } = changePassword;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("password");
	expect(errors[1]).not.toBeDefined();
});

it("returns token field error if user does not exist", async () => {
	//!user
	await validRegisterMutation("tester", "tester@test.com", "password");
	const { token } = await validForgotPasswordMutation("tester@test.com");
	await User.delete({ email: "tester@test.com" });
	const { changePassword } = await validChangePasswordMutation(
		"newPassword",
		token
	);
	const { user, errors } = changePassword;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("token");
	expect(errors[0].message).toEqual("user no longer exists");
	expect(errors[1]).not.toBeDefined();
});

it("returns updated user with changed password", async () => {
	await validRegisterMutation("tester", "tester@test.com", "password");
	const { token } = await validForgotPasswordMutation("tester@test.com");
	const user = await User.findOne({ where: { email: "tester@test.com" } });
	expect(user?.changePasswordToken).toEqual(token);
	const { changePassword, context } = await validChangePasswordMutation(
		"newPassword",
		token
	);
	const updatedUser = await User.findOne(user!.id);
	expect(updatedUser!.changePasswordToken).toBeNull();

	expect(changePassword.user).not.toBeNull();
	expect(context.redis.del).toHaveBeenCalledWith(
		FORGET_PASSWORD_PREFIX + token
	);
	expect(context.req.session.userId).toEqual(user!.id);
	expect(context.req.session.role).toEqual(user!.role);
});
