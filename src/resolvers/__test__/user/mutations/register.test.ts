import { User } from "../../../../entities/User";
import { createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";

const registerMutation = `
mutation Register($options: UsernamePasswordInput!,  $admin: Boolean ) {
  register(options: $options, admin: $admin) {
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

export const validRegisterMutation = async (
	username: string,
	email: string,
	password: string,
	admin?: boolean
) => {
	const context = createContext({});
	const { data } = await graphqlCall({
		source: registerMutation,
		variableValues: {
			options: {
				username,
				email,
				password,
			},
			admin,
		},
		context,
	});
	const { user, errors } = data!.register;
	return { user, errors, context };
};

it("returns specific field errors with bad inputs", async () => {
	//bad username
	const context = createContext({});
	const { data } = await graphqlCall({
		source: registerMutation,
		variableValues: {
			options: {
				username: "test",
				email: "tester1@test.com",
				password: "password",
			},
		},
		context,
	});
	const { user, errors } = data!.register;
	expect(errors).not.toBeNull();
	expect(errors[0].field).toEqual("username");
	expect(user).toBeNull();
	expect(errors[1]).not.toBeDefined();
	expect(errors[2]).not.toBeDefined();
	expect(errors[3]).not.toBeDefined();
	expect(context.req.session.userId).not.toBeDefined();
	expect(context.req.session.role).not.toBeDefined();
});

it("returns specific field errors with bad inputs", async () => {
	//bad username and email
	const context = createContext({});
	const { data } = await graphqlCall({
		source: registerMutation,
		variableValues: {
			options: {
				username: "teste",
				email: "tester1.com",
				password: "password",
			},
		},
		context,
	});
	const { user, errors } = data!.register;
	expect(errors).not.toBeNull();
	expect(errors[0].field).toEqual("username");
	expect(errors[1].field).toEqual("email");
	expect(user).toBeNull();
	expect(errors[2]).not.toBeDefined();
	expect(errors[3]).not.toBeDefined();
	expect(context.req.session.userId).not.toBeDefined();
	expect(context.req.session.role).not.toBeDefined();
});

it("returns specific field errors with bad inputs", async () => {
	//bad username,email and password
	const context = createContext({});
	const { data } = await graphqlCall({
		source: registerMutation,
		variableValues: {
			options: {
				username: "test",
				email: "tester.com",
				password: "passw",
			},
		},
		context,
	});
	const { user, errors } = data!.register;
	expect(errors).not.toBeNull();
	expect(errors[0].field).toEqual("username");
	expect(errors[1].field).toEqual("email");
	expect(errors[2].field).toEqual("password");
	expect(user).toBeNull();
	expect(errors[3]).not.toBeDefined();
	expect(context.req.session.userId).not.toBeDefined();
	expect(context.req.session.role).not.toBeDefined();
});

it("returns a specific field error if already in use", async () => {
	//duplicate username
	await validRegisterMutation("tester1", "tester1@test.com", "password");
	const { user, errors } = await validRegisterMutation(
		"tester1",
		"tester2@test.com",
		"password"
	);
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("username");
	expect(errors[1]).not.toBeDefined();
});

it("returns a specific field error if already in use", async () => {
	//duplicate email
	await validRegisterMutation("tester2", "tester2@test.com", "password");
	const { user, errors } = await validRegisterMutation(
		"tester3",
		"tester2@test.com",
		"password"
	);
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("email");
	expect(errors[1]).not.toBeDefined();
});

it("returns a specific field error if already in use", async () => {
	//duplicate username and email
	await validRegisterMutation("tester3", "tester3@test.com", "password");
	const { user, errors } = await validRegisterMutation(
		"tester3",
		"tester3@test.com",
		"password"
	);
	expect(user).toBeNull();
	expect(errors[0].field).toEqual("username");
	//expected behavior is to show username only even if email is also in use
	expect(errors[1]).not.toBeDefined();
});

it("creates a user with valid inputs", async () => {
	//regular user
	const { user, errors, context } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	expect(errors).toBe(null);
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

it("creates a user with valid inputs", async () => {
	//admin user
	const { user, errors, context } = await validRegisterMutation(
		"testadmin",
		"admin@test.com",
		"password",
		true
	);
	expect(errors).toBe(null);
	expect(user).toMatchObject({
		username: "testadmin",
		email: "admin@test.com",
		role: "admin",
	});

	const createdUser = await User.findOne({
		where: { username: "testadmin" },
	});
	expect(createdUser).toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).toEqual(createdUser!.id);
	expect(role).toEqual(createdUser!.role);
});
