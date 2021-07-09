import { User } from "../../../../entities/User";
import { createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { validRegisterMutation } from "./register.test";

export const loginMutation = `
mutation Login($usernameOrEmail: String!, $password: String!) {
  login(usernameOrEmail: $usernameOrEmail, password: $password) {
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

const validLoginMutation = async (
	usernameOrEmail: string,
	password: string
) => {
	const context = createContext({});
	const { data } = await graphqlCall({
		source: loginMutation,
		variableValues: {
			usernameOrEmail,
			password,
		},
		context: context,
	});
	const { user, errors } = data!.login;
	return { user, errors, context };
};

it("returns specific field errors with bad input", async () => {
	//bad usernameOrEmail input
	const context = createContext({});
	const { data } = await graphqlCall({
		source: loginMutation,
		variableValues: {
			usernameOrEmail: "test",
			password: "password",
		},
		context: context,
	});
	const { user, errors } = data!.login;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("usernameOrEmail");
	expect(errors[1]).not.toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).not.toBeDefined();
	expect(role).not.toBeDefined();
});

it("returns specific field errors with bad input", async () => {
	//bad usernameOrEmail and password input
	const context = createContext({});
	const { data } = await graphqlCall({
		source: loginMutation,
		variableValues: {
			usernameOrEmail: "test",
			password: "pass",
		},
		context: context,
	});
	const { user, errors } = data!.login;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("usernameOrEmail");
	expect(errors[1].field).toEqual("password");
	expect(errors[2]).not.toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).not.toBeDefined();
	expect(role).not.toBeDefined();
});

it("returns usernameOrEmail field error if user does not exist", async () => {
	const context = createContext({});
	const { data } = await graphqlCall({
		source: loginMutation,
		variableValues: {
			usernameOrEmail: "tester1",
			password: "password",
		},
		context: context,
	});
	const { user, errors } = data!.login;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("usernameOrEmail");
	expect(errors[1]).not.toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).not.toBeDefined();
	expect(role).not.toBeDefined();
});

it("returns password field error with wrong password", async () => {
	await validRegisterMutation("tester1", "tester1@test.com", "password");
	const context = createContext({});
	const { data } = await graphqlCall({
		source: loginMutation,
		variableValues: {
			usernameOrEmail: "tester1",
			password: "wrongpw",
		},
		context: context,
	});
	const { user, errors } = data!.login;
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("password");
	expect(errors[1]).not.toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).not.toBeDefined();
	expect(role).not.toBeDefined();
});

it("authenticates user with valid inputs", async () => {
	await validRegisterMutation("tester", "tester@test.com", "password");
	const { user, errors, context } = await validLoginMutation(
		"tester",
		"password"
	);
	expect(errors).toBeNull();
	expect(user).toMatchObject({
		username: "tester",
		email: "tester@test.com",
		role: "regular",
	});

	const createdUser = await User.findOne({ where: { username: "tester" } });
	expect(createdUser).toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).toEqual(createdUser!.id);
	expect(role).toEqual(createdUser!.role);
});
