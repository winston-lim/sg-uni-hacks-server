import { FORGET_PASSWORD_PREFIX } from "../../../../constants";
import { User } from "../../../../entities/User";
import { createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { sendEmail } from "../../../../utils/sendEmail";
import { validRegisterMutation } from "./register.test";

export const forgotPasswordMutuation = `
mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email)
}
`;

export const validForgotPasswordMutation = async (email: string) => {
	const context = createContext({});
	const { data } = await graphqlCall({
		source: forgotPasswordMutuation,
		variableValues: {
			email,
		},
		context,
	});
	const { forgotPassword } = data!;

	let token: string;
	if ((context.redis.set as jest.Mock).mock.calls[0]) {
		const [tokenPrefix] = (context.redis.set as jest.Mock).mock.calls[0];
		token = tokenPrefix.replace(FORGET_PASSWORD_PREFIX, "");
	} else {
		token = "";
	}
	return { forgotPassword, context, token };
};

it("returns false with bad inputs", async () => {
	//bad email
	const context = createContext({});
	const { data } = await graphqlCall({
		source: forgotPasswordMutuation,
		variableValues: {
			email: "test.com",
		},
		context,
	});
	const { errors } = data!.forgotPassword;
	expect(errors).not.toBeDefined();
	expect(data!.forgotPassword).toEqual(false);
});

it("does not store token if user does not exist", async () => {
	//!user
	const { forgotPassword, context } = await validForgotPasswordMutation(
		"test@test.com"
	);
	//always returns true with valid inputs
	expect(forgotPassword).toEqual(true);
	//does not create token if user does not exist
	expect(context.redis.set).not.toHaveBeenCalled();
	//does not send email if user does not exist
	expect(sendEmail).not.toHaveBeenCalled();
});

it("deletes old token and updates if user has already requested a password change", async () => {
	await validRegisterMutation("tester", "tester@test.com", "password");
	await validForgotPasswordMutation("tester@test.com");
	const user = await User.findOne({ where: { email: "tester@test.com" } });
	expect(user?.changePasswordToken).not.toBeNull();
	//repeat request
	const { forgotPassword, context, token } = await validForgotPasswordMutation(
		"tester@test.com"
	);
	const { errors } = forgotPassword;
	expect(errors).not.toBeDefined();
	const [tokenPrefix] = (context.redis.del as jest.Mock).mock.calls[0];
	const deletedToken = tokenPrefix.replace(FORGET_PASSWORD_PREFIX, "");
	expect(deletedToken).not.toEqual(token);

	const updatedUser = await User.findOne(user!.id);
	expect(updatedUser?.changePasswordToken).toEqual(token);
});

it("stores token and sends email with valid inputs", async () => {
	const { errors } = await validRegisterMutation(
		"tester1",
		"tester1@test.com",
		"password"
	);
	const createdUser = await User.findOne({ where: { username: "tester1" } });
	expect(createdUser).toBeDefined();
	expect(createdUser?.changePasswordToken).toBeNull();
	expect(errors).toBeNull();

	const { forgotPassword, context, token } = await validForgotPasswordMutation(
		"tester1@test.com"
	);
	const updatedUser = await User.findOne(createdUser!.id);
	expect(updatedUser?.changePasswordToken).toEqual(token);
	expect(forgotPassword).toEqual(true);
	expect(context.redis.set).toHaveBeenCalled();

	const [email, title, html] = (sendEmail as jest.Mock).mock.calls[0];
	const sentToken = html
		.split('"')[1]
		.replace("http://localhost:3000/change-password/", "");
	expect(email).toEqual("tester1@test.com");
	expect(sentToken).toEqual(token);
	expect(title).toEqual("Password reset");
});
